import { GoogleGenerativeAI } from "@google/generative-ai"
import { Injectable, InternalServerErrorException, ServiceUnavailableException } from "@nestjs/common"

import type { ChatMessageDto } from "./dto/chat.dto.js"

@Injectable()
export class AiService {
  async chat(messages: ChatMessageDto[]): Promise<{ text: string }> {
    const key = process.env.GEMINI_API_KEY
    if (!key) {
      throw new ServiceUnavailableException("AI is not configured")
    }

    // Override with GEMINI_MODEL in .env (e.g. gemini-2.5-flash, gemini-2.5-pro).
    const modelName = process.env.GEMINI_MODEL ?? "gemini-2.5-flash"
    const genAI = new GoogleGenerativeAI(key)
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction:
        "You are a helpful assistant inside the Ksocial app. Be concise and accurate. Match the user's language when possible.",
    })

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
