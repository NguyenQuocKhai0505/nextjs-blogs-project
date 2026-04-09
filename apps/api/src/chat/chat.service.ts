import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"
import { areMutualFriends, getMutualFriendIds } from "../users/follow.helpers.js"
import { ChatEvents } from "./chat.events.js"

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly events: ChatEvents
  ) {}

  async listConversations(userId: string) {
    const mutual = await getMutualFriendIds(this.prisma, userId)
    const rows = await this.prisma.conversation.findMany({
      where: {
        OR: [{ user1Id: userId }, { user2Id: userId }],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        user1: { select: { id: true, name: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, avatarUrl: true } },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
        },
      },
    })

    const filtered = rows.filter((c) => {
      const other = c.user1Id === userId ? c.user2Id : c.user1Id
      return mutual.has(other)
    })

    return filtered.map((c) => {
      const other =
        c.user1Id === userId ? c.user2 : c.user1
      const lastMessage = c.messages[0] ?? null
      return {
        id: c.id,
        otherUser: other,
        updatedAt: c.updatedAt,
        lastMessage: lastMessage
          ? {
              id: lastMessage.id,
              conversationId: lastMessage.conversationId,
              sender: lastMessage.sender,
              content: lastMessage.content,
              imageUrl: lastMessage.imageUrl,
              videoUrl: lastMessage.videoUrl,
              createdAt: lastMessage.createdAt,
            }
          : null,
      }
    })
  }

  async getOrCreateConversation(currentUserId: string, otherUserId: string) {
    const other = await this.prisma.user.findUnique({
      where: { id: otherUserId },
      select: { id: true },
    })
    if (!other) {
      throw new NotFoundException("User not found")
    }
    const mutual = await areMutualFriends(this.prisma, currentUserId, otherUserId)
    if (!mutual) {
      throw new ForbiddenException(
        "You can only chat with mutual friends (both of you must follow each other)."
      )
    }

    const [a, b] =
      currentUserId < otherUserId
        ? [currentUserId, otherUserId]
        : [otherUserId, currentUserId]

    // upsert avoids P2002 when two requests create the same pair at once, or if a row
    // already exists but findFirst/create raced.
    return this.prisma.conversation.upsert({
      where: {
        user1Id_user2Id: { user1Id: a, user2Id: b },
      },
      create: { user1Id: a, user2Id: b },
      update: {},
    })
  }

  async listMessages(userId: string, conversationId: number) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, user1Id: true, user2Id: true },
    })
    if (!conv) throw new ForbiddenException("Conversation not accessible")
    if (conv.user1Id !== userId && conv.user2Id !== userId) {
      throw new ForbiddenException("Conversation not accessible")
    }
    const otherId = conv.user1Id === userId ? conv.user2Id : conv.user1Id
    if (!(await areMutualFriends(this.prisma, userId, otherId))) {
      throw new ForbiddenException(
        "This chat is no longer available (mutual follow required)."
      )
    }

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    })
  }

  async sendMessage(userId: string, input: {
    conversationId: number
    content?: string
    imageUrl?: string
    videoUrl?: string
  }) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: input.conversationId },
      select: { id: true, user1Id: true, user2Id: true },
    })
    if (!conv) throw new ForbiddenException("Conversation not accessible")
    if (conv.user1Id !== userId && conv.user2Id !== userId) {
      throw new ForbiddenException("Conversation not accessible")
    }
    const otherId = conv.user1Id === userId ? conv.user2Id : conv.user1Id
    if (!(await areMutualFriends(this.prisma, userId, otherId))) {
      throw new ForbiddenException(
        "You can only message mutual friends (both of you must follow each other)."
      )
    }

    const msg = await this.prisma.message.create({
      data: {
        conversationId: input.conversationId,
        senderId: userId,
        content: input.content ?? null,
        imageUrl: input.imageUrl ?? null,
        videoUrl: input.videoUrl ?? null,
      },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    })

    // bump updatedAt
    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    })

    this.events.messageCreated(input.conversationId, msg)
    return msg
  }
}

