import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { ConversationKind, Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"
import { areMutualFriends, getMutualFriendIds } from "../users/follow.helpers.js"
import { ChatEvents } from "./chat.events.js"

/** Sender can recall within this window (WhatsApp-style). */
const RECALL_WINDOW_MS = 15 * 60 * 1000

const lastMessageInclude = {
  orderBy: { createdAt: "desc" as const },
  take: 1,
  include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
}

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
        AND: [
          {
            OR: [
              {
                kind: ConversationKind.DIRECT,
                OR: [{ user1Id: userId }, { user2Id: userId }],
              },
              {
                members: { some: { userId } },
              },
            ],
          },
          { hides: { none: { userId } } },
        ],
      },
      orderBy: { updatedAt: "desc" },
      include: {
        user1: { select: { id: true, name: true, avatarUrl: true } },
        user2: { select: { id: true, name: true, avatarUrl: true } },
        messages: lastMessageInclude,
      },
    })

    const out: Array<{
      id: number
      kind: "DIRECT" | "GROUP"
      title: string | null
      otherUser: { id: string; name: string; avatarUrl: string | null } | null
      updatedAt: Date
      unreadCount: number
      lastMessage: {
        id: number
        conversationId: number
        sender: { id: string; name: string; avatarUrl: string | null }
        content: string | null
        imageUrl: string | null
        videoUrl: string | null
        revokedAt: Date | null
        createdAt: Date
      } | null
    }> = []

    for (const c of rows) {
      const lastMessage = c.messages[0] ?? null
      const lastPayload = lastMessage
        ? {
            id: lastMessage.id,
            conversationId: lastMessage.conversationId,
            sender: lastMessage.sender,
            content: lastMessage.content,
            imageUrl: lastMessage.imageUrl,
            videoUrl: lastMessage.videoUrl,
            revokedAt: lastMessage.revokedAt ?? null,
            createdAt: lastMessage.createdAt,
          }
        : null

      if (c.kind === ConversationKind.GROUP) {
        out.push({
          id: c.id,
          kind: "GROUP",
          title: c.title ?? null,
          otherUser: null,
          updatedAt: c.updatedAt,
          unreadCount: 0,
          lastMessage: lastPayload,
        })
        continue
      }

      const u1 = c.user1Id
      const u2 = c.user2Id
      if (!u1 || !u2 || !c.user1 || !c.user2) continue
      const otherId = u1 === userId ? u2 : u1
      if (!mutual.has(otherId)) continue
      const other = u1 === userId ? c.user2 : c.user1
      out.push({
        id: c.id,
        kind: "DIRECT",
        title: null,
        otherUser: other,
        updatedAt: c.updatedAt,
        unreadCount: 0,
        lastMessage: lastPayload,
      })
    }

    const unreadMap = await this.bulkUnreadCounts(
      userId,
      out.map((o) => o.id)
    )
    for (const row of out) {
      row.unreadCount = unreadMap.get(row.id) ?? 0
    }

    return out
  }

  /**
   * Inbound unread = messages from others with id greater than this user's read cursor.
   * No read-state row ⇒ COALESCE(..., 0) ⇒ all historical inbound messages count until they call mark read.
   */
  private async bulkUnreadCounts(
    userId: string,
    conversationIds: number[]
  ): Promise<Map<number, number>> {
    const map = new Map<number, number>()
    for (const id of conversationIds) map.set(id, 0)
    if (conversationIds.length === 0) return map

    const rows = await this.prisma.$queryRaw<Array<{ cid: number; cnt: bigint }>>(
      Prisma.sql`
      SELECT m.conversation_id AS cid, COUNT(*)::bigint AS cnt
      FROM messages m
      LEFT JOIN conversation_read_states crs
        ON crs.conversation_id = m.conversation_id AND crs.user_id = ${userId}
      WHERE m.conversation_id IN (${Prisma.join(conversationIds)})
        AND m.sender_id != ${userId}
        AND m.id > COALESCE(crs.last_read_message_id, 0)
      GROUP BY m.conversation_id
    `
    )
    for (const r of rows) {
      map.set(Number(r.cid), Number(r.cnt))
    }
    return map
  }

  async markConversationRead(
    userId: string,
    conversationId: number,
    lastReadMessageId?: number
  ) {
    await this.assertCanAccessConversation(userId, conversationId)

    let target: number
    if (lastReadMessageId == null) {
      const last = await this.prisma.message.findFirst({
        where: { conversationId },
        orderBy: { id: "desc" },
        select: { id: true },
      })
      target = last?.id ?? 0
    } else {
      const m = await this.prisma.message.findFirst({
        where: { id: lastReadMessageId, conversationId },
        select: { id: true },
      })
      if (!m) {
        throw new BadRequestException("Invalid message id for this conversation")
      }
      target = m.id
    }

    const existing = await this.prisma.conversationReadState.findUnique({
      where: {
        userId_conversationId: { userId, conversationId },
      },
    })
    const next = Math.max(existing?.lastReadMessageId ?? 0, target)

    await this.prisma.conversationReadState.upsert({
      where: { userId_conversationId: { userId, conversationId } },
      create: { userId, conversationId, lastReadMessageId: next },
      update: { lastReadMessageId: next },
    })

    return { ok: true as const, lastReadMessageId: next }
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

    const existing = await this.prisma.conversation.findFirst({
      where: {
        kind: ConversationKind.DIRECT,
        user1Id: a,
        user2Id: b,
      },
    })
    if (existing) {
      await this.prisma.conversationHide.deleteMany({
        where: { userId: currentUserId, conversationId: existing.id },
      })
      return existing
    }

    try {
      const created = await this.prisma.conversation.create({
        data: {
          kind: ConversationKind.DIRECT,
          user1Id: a,
          user2Id: b,
        },
      })
      await this.prisma.conversationHide.deleteMany({
        where: { userId: currentUserId, conversationId: created.id },
      })
      return created
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === "P2002") {
        const again = await this.prisma.conversation.findFirst({
          where: { kind: ConversationKind.DIRECT, user1Id: a, user2Id: b },
        })
        if (again) {
          await this.prisma.conversationHide.deleteMany({
            where: { userId: currentUserId, conversationId: again.id },
          })
          return again
        }
      }
      throw e
    }
  }

  async createGroup(creatorId: string, title: string, memberIds: string[]) {
    const name = title.trim()
    if (!name) throw new BadRequestException("Group title is required")

    const unique = [...new Set(memberIds.filter((id) => id && id !== creatorId))]
    if (unique.length < 1) {
      throw new BadRequestException("Select at least one mutual friend for the group")
    }

    for (const mid of unique) {
      const ok = await areMutualFriends(this.prisma, creatorId, mid)
      if (!ok) {
        throw new ForbiddenException(
          `User ${mid} is not a mutual friend; you can only add mutual friends to a group.`
        )
      }
    }

    const conv = await this.prisma.$transaction(async (tx) => {
      const c = await tx.conversation.create({
        data: {
          kind: ConversationKind.GROUP,
          title: name,
          user1Id: null,
          user2Id: null,
        },
      })
      const memberRows = [creatorId, ...unique].map((userId) => ({
        conversationId: c.id,
        userId,
      }))
      await tx.conversationMember.createMany({ data: memberRows })
      return c
    })

    return conv
  }

  async hideConversationForUser(userId: string, conversationId: number) {
    await this.assertCanAccessConversation(userId, conversationId)
    await this.prisma.conversationHide.upsert({
      where: {
        userId_conversationId: { userId, conversationId },
      },
      create: { userId, conversationId },
      update: { hiddenAt: new Date() },
    })
    return { ok: true as const }
  }

  async recallMessage(userId: string, messageId: number) {
    const msg = await this.prisma.message.findUnique({
      where: { id: messageId },
      select: {
        id: true,
        conversationId: true,
        senderId: true,
        createdAt: true,
        revokedAt: true,
      },
    })
    if (!msg) throw new NotFoundException("Message not found")
    if (msg.senderId !== userId) {
      throw new ForbiddenException("You can only recall your own messages")
    }
    if (msg.revokedAt) {
      throw new BadRequestException("Message already recalled")
    }
    if (Date.now() - msg.createdAt.getTime() > RECALL_WINDOW_MS) {
      throw new BadRequestException("Recall window has expired")
    }
    await this.assertCanAccessConversation(userId, msg.conversationId)

    const updated = await this.prisma.message.update({
      where: { id: messageId },
      data: {
        revokedAt: new Date(),
        content: null,
        imageUrl: null,
        videoUrl: null,
      },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    })

    await this.prisma.conversation.update({
      where: { id: msg.conversationId },
      data: { updatedAt: new Date() },
    })

    this.events.messageRevoked(msg.conversationId, updated)
    return updated
  }

  /** When someone sends a message, other participants see the thread again if they had hidden it. */
  private async clearConversationHidesForRecipients(
    conversationId: number,
    senderId: string
  ) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: {
        kind: true,
        user1Id: true,
        user2Id: true,
        members: { select: { userId: true } },
      },
    })
    if (!conv) return
    const recipientIds: string[] = []
    if (conv.kind === ConversationKind.GROUP) {
      for (const m of conv.members) {
        if (m.userId !== senderId) recipientIds.push(m.userId)
      }
    } else {
      if (conv.user1Id && conv.user1Id !== senderId) recipientIds.push(conv.user1Id)
      if (conv.user2Id && conv.user2Id !== senderId) recipientIds.push(conv.user2Id)
    }
    if (recipientIds.length === 0) return
    await this.prisma.conversationHide.deleteMany({
      where: {
        conversationId,
        userId: { in: recipientIds },
      },
    })
  }

  private async assertCanAccessConversation(userId: string, conversationId: number) {
    const conv = await this.prisma.conversation.findUnique({
      where: { id: conversationId },
      select: { id: true, kind: true, user1Id: true, user2Id: true },
    })
    if (!conv) throw new ForbiddenException("Conversation not accessible")

    if (conv.kind === ConversationKind.GROUP) {
      const m = await this.prisma.conversationMember.findUnique({
        where: {
          conversationId_userId: { conversationId, userId },
        },
      })
      if (!m) throw new ForbiddenException("Conversation not accessible")
      return conv
    }

    if (conv.user1Id !== userId && conv.user2Id !== userId) {
      throw new ForbiddenException("Conversation not accessible")
    }
    const u1 = conv.user1Id
    const u2 = conv.user2Id
    if (!u1 || !u2) throw new ForbiddenException("Conversation not accessible")
    const otherId = u1 === userId ? u2 : u1
    if (!(await areMutualFriends(this.prisma, userId, otherId))) {
      throw new ForbiddenException(
        "This chat is no longer available (mutual follow required)."
      )
    }
    return conv
  }

  async listMessages(userId: string, conversationId: number) {
    await this.assertCanAccessConversation(userId, conversationId)

    return this.prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true, avatarUrl: true } } },
    })
  }

  async sendMessage(
    userId: string,
    input: {
      conversationId: number
      content?: string
      imageUrl?: string
      videoUrl?: string
    }
  ) {
    await this.assertCanAccessConversation(userId, input.conversationId)

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

    await this.prisma.conversation.update({
      where: { id: input.conversationId },
      data: { updatedAt: new Date() },
    })

    await this.clearConversationHidesForRecipients(input.conversationId, userId)

    this.events.messageCreated(input.conversationId, msg)
    return msg
  }
}
