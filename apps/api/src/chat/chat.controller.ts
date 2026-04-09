import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from "@nestjs/common"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"
import { ChatService } from "./chat.service.js"
import { SendMessageDto } from "./dto/send-message.dto.js"
import { CreateConversationDto } from "./dto/create-conversation.dto.js"

@Controller()
export class ChatController {
  constructor(private readonly chat: ChatService) {}

  @Get("conversations")
  @UseGuards(JwtAuthGuard)
  listConversations(@CurrentUserId() userId: string) {
    return this.chat.listConversations(userId)
  }

  @Post("conversations")
  @UseGuards(JwtAuthGuard)
  createConversation(
    @CurrentUserId() userId: string,
    @Body() dto: CreateConversationDto
  ) {
    return this.chat.getOrCreateConversation(userId, dto.userId)
  }

  @Get("conversations/:id/messages")
  @UseGuards(JwtAuthGuard)
  listMessages(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.chat.listMessages(userId, id)
  }

  @Post("messages")
  @UseGuards(JwtAuthGuard)
  send(@CurrentUserId() userId: string, @Body() dto: SendMessageDto) {
    return this.chat.sendMessage(userId, dto)
  }
}

