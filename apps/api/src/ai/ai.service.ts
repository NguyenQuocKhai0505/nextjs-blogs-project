import { GoogleGenerativeAI } from "@google/generative-ai"
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  ServiceUnavailableException,
} from "@nestjs/common"

import type { ChatMessageDto } from "./dto/chat.dto.js"

const TARGET_LANGUAGE_NAMES: Record<"en" | "ko" | "vi", string> = {
  en: "English",
  ko: "Korean",
  vi: "Vietnamese",
}

export type SuggestPostResult = {
  title: string
  description: string
  content: string
  categoryName: string | null
}

export type ReportAiReviewResult = {
  likelyViolation: boolean
  severity: "low" | "medium" | "high"
  summary: string
  suggestedAction: "uphold" | "dismiss" | "needs_human"
  suggestedWarnMessage: string
}


@Injectable()
export class AiService {
  private getModel(systemInstruction?: string) {
    const key = process.env.GEMINI_API_KEY
    if (!key) {
      throw new ServiceUnavailableException("AI is not configured")
    }
    const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"
    const genAI = new GoogleGenerativeAI(key)
    return genAI.getGenerativeModel({
      model: modelName,
      ...(systemInstruction ? { systemInstruction } : {}),
    })
  }

  private async withGemini<T>(run: () => Promise<T>): Promise<T> {
    try {
      return await run()
    } catch (err) {
      if (
        err instanceof BadRequestException ||
        err instanceof ServiceUnavailableException ||
        err instanceof InternalServerErrorException
      ) {
        throw err
      }

      const message = err instanceof Error ? err.message : String(err)
      const cause =
        err instanceof Error && err.cause instanceof Error
          ? `${err.cause.message}`
          : ""
      const detail = `${message} ${cause}`.toLowerCase()

      if (
        detail.includes("unable_to_verify_leaf_signature") ||
        detail.includes("certificate") ||
        detail.includes("fetch failed")
      ) {
        throw new ServiceUnavailableException(
          "AI network/TLS error. On local Windows set ALLOW_INSECURE_TLS=1 in apps/api/.env (antivirus SSL scan). On Render use GEMINI_MODEL=gemini-2.5-flash and redeploy."
        )
      }

      throw new ServiceUnavailableException(
        message.startsWith("AI ") ? message : `AI request failed: ${message}`
      )
    }
  }

  async translate(
    text: string,
    targetLanguage: "en" | "ko" | "vi"
  ): Promise<{ text: string; targetLanguage: "en" | "ko" | "vi" }> {
    const trimmed = text.trim()
    if (!trimmed) {
      throw new BadRequestException("Empty text")
    }

    const langName = TARGET_LANGUAGE_NAMES[targetLanguage]

    return this.withGemini(async () => {
      const model = this.getModel(
        `You are a professional translator. Translate chat messages accurately and naturally into ${langName}. Return ONLY the translated text — no quotes, labels, or explanations.`
      )

      const result = await model.generateContent(trimmed)
      const translated = result.response.text().trim()
      if (!translated) {
        throw new InternalServerErrorException("Empty translation")
      }

      return { text: translated, targetLanguage }
    })
  }

  async chat(messages: ChatMessageDto[]): Promise<{ text: string }> {
    if (!messages.length) {
      throw new BadRequestException("No messages")
    }

    const last = messages[messages.length - 1]
    if (last.role !== "user") {
      throw new BadRequestException("Last message must be from user")
    }

    return this.withGemini(async () => {
      const model = this.getModel(
        "You are a helpful assistant inside the Ksocial app. Be concise and accurate. Match the user's language when possible."
      )

      const history = messages.slice(0, -1).map((m) => ({
        role: m.role === "user" ? ("user" as const) : ("model" as const),
        parts: [{ text: m.content }],
      }))

      const chat = model.startChat({ history })
      const result = await chat.sendMessage(last.content)
      const text = result.response.text()
      return { text }
    })
  }

  async suggestPost(input: {
    brief: string
    locale?: "en" | "ko" | "vi"
    categoryNames?: string[]
  }): Promise<SuggestPostResult> {
    const brief = input.brief.trim()
    if (brief.length < 5) {
      throw new BadRequestException("Brief is too short")
    }

    const locale = input.locale ?? "en"
    const langName = TARGET_LANGUAGE_NAMES[locale]
    const categories = (input.categoryNames ?? [])
      .map((n) => n.trim())
      .filter(Boolean)
      .slice(0, 40)

    const categoryHint =
      categories.length > 0
        ? `Pick categoryName as the best match from this list only (exact string): ${JSON.stringify(categories)}. If none fit, use null.`
        : `Set categoryName to null.`

    return this.withGemini(async () => {
      const model = this.getModel(
        `You help users write social posts for Ksocial.
Write in ${langName}.
Return ONLY valid JSON (no markdown fences) with keys:
- title: string, 3–120 chars, catchy but natural
- description: string, 5–240 chars, short summary for the feed
- content: string, at least 10 chars, the full post body (2–6 short paragraphs or a clear social caption; keep under 4000 chars)
- categoryName: string or null
${categoryHint}
Do not invent facts beyond the user's brief. Expand briefly and helpfully.`
      )

      const result = await model.generateContent(
        `User brief:\n${brief}\n\nRespond with JSON only.`
      )
      const raw = result.response.text().trim()
      const parsed = this.parseSuggestJson(raw)

      const title = this.clamp(parsed.title, 3, 255)
      const description = this.clamp(parsed.description, 5, 255)
      const content = this.clamp(parsed.content, 10, 8000)
      if (!title || !description || !content) {
        throw new InternalServerErrorException("AI returned incomplete post fields")
      }

      let categoryName: string | null = null
      if (typeof parsed.categoryName === "string" && parsed.categoryName.trim()) {
        const wanted = parsed.categoryName.trim()
        if (categories.length === 0) {
          categoryName = wanted
        } else {
          const match = categories.find((c) => c.toLowerCase() === wanted.toLowerCase())
          categoryName = match ?? null
        }
      }

      return { title, description, content, categoryName }
    })
  }
    async reviewReportContent(input: {
      reason: string
      details?: string | null
      title?: string | null
      description?: string | null
      content?: string | null
    }): Promise<ReportAiReviewResult> {
      const body = [input.title, input.description, input.content]
        .filter((s) => typeof s === "string" && s.trim())
        .join("\n\n")
        .trim()

      if (!body) {
        throw new BadRequestException("No content to review")
      }

      return this.withGemini(async () => {
        const model = this.getModel(
          `You are a content-moderation assistant for a social app (Ksocial).
  Decide if the reported post likely violates guidelines
  (hate, harassment, threats, severe abusive profanity, spam).
  Avoid false positives (quotes, jokes without abuse, educational mentions).
  Return ONLY valid JSON (no markdown fences) with keys:
  - likelyViolation: boolean
  - severity: "low" | "medium" | "high"
  - summary: string (1–2 sentences in English)
  - suggestedAction: "uphold" | "dismiss" | "needs_human"
  - suggestedWarnMessage: string (short warning to send the author if uphold)
  Never invent facts beyond the provided text.`
        )

        const prompt = [
          `Report reason: ${input.reason}`,
          input.details ? `Reporter details: ${input.details}` : null,
          `Post content:\n${body.slice(0, 6000)}`,
          `Respond with JSON only.`,
        ]
          .filter(Boolean)
          .join("\n\n")

        const result = await model.generateContent(prompt)
        const raw = result.response.text().trim()
        const parsed = this.parseSuggestJson(raw)

        const severityRaw = String(parsed.severity ?? "medium").toLowerCase()
        const severity =
          severityRaw === "low" || severityRaw === "high"
            ? severityRaw
            : "medium"

        const actionRaw = String(
          parsed.suggestedAction ?? "needs_human"
        ).toLowerCase()
        const suggestedAction =
          actionRaw === "uphold" || actionRaw === "dismiss"
            ? actionRaw
            : "needs_human"

        const warn =
          typeof parsed.suggestedWarnMessage === "string" &&
          parsed.suggestedWarnMessage.trim()
            ? parsed.suggestedWarnMessage.trim().slice(0, 500)
            : "Your content was removed for violating community guidelines."

        return {
          likelyViolation: Boolean(parsed.likelyViolation),
          severity,
          summary:
            typeof parsed.summary === "string" && parsed.summary.trim()
              ? parsed.summary.trim().slice(0, 500)
              : "No summary",
          suggestedAction,
          suggestedWarnMessage: warn,
        }
      })
    }
  
  private clamp(value: unknown, min: number, max: number): string {
    if (typeof value !== "string") return ""
    const t = value.trim()
    if (t.length < min) return t
    return t.length > max ? t.slice(0, max) : t
  }

  private parseSuggestJson(raw: string): Record<string, unknown> {
    let text = raw.trim()
    const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
    if (fence?.[1]) text = fence[1].trim()

    try {
      const data = JSON.parse(text) as unknown
      if (data && typeof data === "object") return data as Record<string, unknown>
    } catch {
      /* fall through */
    }

    const start = text.indexOf("{")
    const end = text.lastIndexOf("}")
    if (start >= 0 && end > start) {
      try {
        const data = JSON.parse(text.slice(start, end + 1)) as unknown
        if (data && typeof data === "object") return data as Record<string, unknown>
      } catch {
        /* ignore */
      }
    }

    throw new InternalServerErrorException("Could not parse AI suggestion")
  }
}
