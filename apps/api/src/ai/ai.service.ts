import { GoogleGenerativeAI } from "@google/generative-ai"
import { Injectable, InternalServerErrorException, ServiceUnavailableException } from "@nestjs/common"

import type { ChatMessageDto } from "./dto/chat.dto.js"

const TARGET_LANGUAGE_NAMES: Record<"en" | "ko" | "vi", string> = {
  en: "English",
  ko: "Korean",
  vi: "Vietnamese",
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

  async translate(
    text: string,
    targetLanguage: "en" | "ko" | "vi"
  ): Promise<{ text: string; targetLanguage: "en" | "ko" | "vi" }> {
    const trimmed = text.trim()
    if (!trimmed) {
      throw new InternalServerErrorException("Empty text")
    }

    const langName = TARGET_LANGUAGE_NAMES[targetLanguage]
    const model = this.getModel(
      `You are a professional translator. Translate chat messages accurately and naturally into ${langName}. Return ONLY the translated text — no quotes, labels, or explanations.`
    )

    const result = await model.generateContent(trimmed)
    const translated = result.response.text().trim()
    if (!translated) {
      throw new InternalServerErrorException("Empty translation")
    }

    return { text: translated, targetLanguage }
  }

  async chat(messages: ChatMessageDto[]): Promise<{ text: string }> {
    const model = this.getModel(
      "You are a helpful assistant inside the Ksocial app. Be concise and accurate. Match the user's language when possible."
    )

    if (!messages.length) {
      throw new InternalServerErrorException("No messages")
    }

    const last = messages[messages.length - 1]
    if (last.role !== "user") {
      throw new InternalServerErrorException("Last message must be from user")
    }

    const history = messages.slice(0, -1).map((m) => ({
      role: m.role === "user" ? ("user" as const) : ("model" as const),
      parts: [{ text: m.content }],
    }))

    const chat = model.startChat({ history })
    const result = await chat.sendMessage(last.content)
    const text = result.response.text()
    return { text }
  }
}
