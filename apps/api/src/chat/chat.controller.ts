import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"
import { ChatService } from "./chat.service.js"
import { SendMessageDto } from "./dto/send-message.dto.js"
import { CreateConversationDto } from "./dto/create-conversation.dto.js"
import { CreateGroupDto } from "./dto/create-group.dto.js"
import { MarkConversationReadDto } from "./dto/mark-conversation-read.dto.js"

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

  @Post("conversations/groups")
  @UseGuards(JwtAuthGuard)
  createGroup(@CurrentUserId() userId: string, @Body() dto: CreateGroupDto) {
    return this.chat.createGroup(userId, dto.title, dto.memberIds)
  }

  @Get("conversations/:id/messages")
  @UseGuards(JwtAuthGuard)
  listMessages(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.chat.listMessages(userId, id)
  }

  @Post("conversations/:id/read")
  @UseGuards(JwtAuthGuard)
  markRead(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: MarkConversationReadDto
  ) {
    return this.chat.markConversationRead(userId, id, dto.lastReadMessageId)
  }

  @Post("messages")
  @UseGuards(JwtAuthGuard)
  send(@CurrentUserId() userId: string, @Body() dto: SendMessageDto) {
    return this.chat.sendMessage(userId, dto)
  }

  @Post("messages/:messageId/recall")
  @UseGuards(JwtAuthGuard)
  recallMessage(
    @CurrentUserId() userId: string,
    @Param("messageId", ParseIntPipe) messageId: number
  ) {
    return this.chat.recallMessage(userId, messageId)
  }

  @Delete("conversations/:id")
  @UseGuards(JwtAuthGuard)
  hideConversation(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.chat.hideConversationForUser(userId, id)
  }
}

