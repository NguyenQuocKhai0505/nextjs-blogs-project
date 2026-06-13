import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { Throttle } from "@nestjs/throttler"

import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { AiService } from "./ai.service.js"
import { ChatDto } from "./dto/chat.dto.js"
import { TranslateDto } from "./dto/translate.dto.js"

const aiChatTtl = Number(process.env.AI_CHAT_THROTTLE_TTL_MS ?? 60_000)
const aiChatLimit = Number(process.env.AI_CHAT_THROTTLE_LIMIT ?? 20)
const aiTranslateLimit = Number(process.env.AI_TRANSLATE_THROTTLE_LIMIT ?? 40)

@Controller("ai")
export class AiController {
  constructor(private readonly ai: AiService) {}

  @UseGuards(JwtAuthGuard)
  @Throttle({
    default: {
      ttl: aiChatTtl,
      limit: aiTranslateLimit,
    },
  })
  @Post("translate")
  async translate(@CurrentUserId() _userId: string, @Body() dto: TranslateDto) {
    return this.ai.translate(dto.text, dto.targetLanguage)
  }

  /** Stricter limit than global default — per user (via optional JWT middleware + tracker). */
  @UseGuards(JwtAuthGuard)
  @Throttle({
    default: {
      ttl: aiChatTtl,
      limit: aiChatLimit,
    },
  })
  @Post("chat")
  async chat(@CurrentUserId() _userId: string, @Body() dto: ChatDto) {
    return this.ai.chat(dto.messages)
  }
}
