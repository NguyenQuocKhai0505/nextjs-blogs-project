import { db } from "."
import { conversations, messages, users } from "./schema"
import { eq, and, or, desc, asc } from "drizzle-orm"

/**
 * Lấy hoặc tạo conversation giữa 2 users
 * Logic: Kiểm tra xem đã có conversation chưa (user1-user2 hoặc user2-user1)
 * Nếu chưa có thì tạo mới
 */
export async function getOrCreateConversation(user1Id: string, user2Id: string) {
  try {
    // Tìm conversation (có thể user1 là user1Id hoặc user2Id)
    const existing = await db.query.conversations.findFirst({
      where: or(
        and(
          eq(conversations.user1Id, user1Id),
          eq(conversations.user2Id, user2Id)
        ),
        and(
          eq(conversations.user1Id, user2Id),
          eq(conversations.user2Id, user1Id)
        )
      ),
      with: {
        user1: true,
        user2: true,
      },
    })

    if (existing) {
      return existing
    }

    // Tạo mới conversation (luôn đặt user có id nhỏ hơn là user1Id)
    const [user1, user2] = user1Id < user2Id ? [user1Id, user2Id] : [user2Id, user1Id]
    
    const [newConversation] = await db
      .insert(conversations)
      .values({
        user1Id: user1,
        user2Id: user2,
      })
      .returning()

    // Fetch lại với relations
    const fullConversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, newConversation.id),
      with: {
        user1: true,
        user2: true,
      },
    })

    return fullConversation
  } catch (error) {
    console.error("Error in getOrCreateConversation:", error)
    return null
  }
}

/**
 * Lấy tất cả conversations của một user
 * Logic: User có thể là user1 hoặc user2 trong conversation
 */
export async function getConversations(userId: string) {
  try {
    const allConversations = await db.query.conversations.findMany({
      where: or(
        eq(conversations.user1Id, userId),
        eq(conversations.user2Id, userId)
      ),
      orderBy: [desc(conversations.updatedAt)],
      with: {
        user1: true,
        user2: true,
        messages: {
          orderBy: [desc(messages.createdAt)],
          limit: 1, // Chỉ lấy tin nhắn cuối cùng
          with: {
            sender: true,
          },
        },
      },
    })

    // Format để dễ dùng: xác định user còn lại (không phải current user)
    return allConversations.map((conv) => {
      const otherUser = conv.user1Id === userId ? conv.user2 : conv.user1
      const lastMessage = conv.messages[0] || null
      
      // Đếm số tin nhắn chưa đọc
      // (Sẽ tính sau bằng query riêng để tối ưu)

      return {
        id: conv.id,
        otherUser,
        lastMessage,
        updatedAt: conv.updatedAt,
        unreadCount: 0,
      }
    })
  } catch (error) {
    console.error("Error in getConversations:", error)
    return []
  }
}

/**
 * Lấy tất cả messages của một conversation
 */
export async function getMessages(conversationId: number, limit = 50) {
  try {
    const allMessages = await db.query.messages.findMany({
      where: eq(messages.conversationId, conversationId),
      orderBy: [asc(messages.createdAt)], // Tin nhắn cũ nhất trước
      limit,
      with: {
        sender: true,
      },
    })

    return allMessages
  } catch (error) {
    console.error("Error in getMessages:", error)
    return []
  }
}

/**
 * Tạo message mới
 */
export async function createMessage(
  conversationId: number,
  senderId: string,
  content: string
) {
  try {
    const [newMessage] = await db
      .insert(messages)
      .values({
        conversationId,
        senderId,
        content,
        read: false,
      })
      .returning()

    // Cập nhật updatedAt của conversation
    await db
      .update(conversations)
      .set({ updatedAt: new Date() })
      .where(eq(conversations.id, conversationId))

    // Fetch lại với relations
    const fullMessage = await db.query.messages.findFirst({
      where: eq(messages.id, newMessage.id),
      with: {
        sender: true,
        conversation: {
          with: {
            user1: true,
            user2: true,
          },
        },
      },
    })

    return fullMessage
  } catch (error) {
    console.error("Error in createMessage:", error)
    return null
  }
}

/**
 * Đánh dấu messages là đã đọc
 */
export async function markMessagesAsRead(
  conversationId: number,
  userId: string
) {
  try {
    // Đánh dấu tất cả messages của user khác (không phải mình) là đã đọc
    await db
      .update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.read, false),
          // Chỉ đánh dấu messages không phải của mình
          // (Cần query để lấy conversation trước)
        )
      )

    // Cách đúng: Lấy conversation để biết user nào là user khác
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    })

    if (!conversation) return

    const otherUserId = conversation.user1Id === userId 
      ? conversation.user2Id 
      : conversation.user1Id

    await db
      .update(messages)
      .set({ read: true })
      .where(
        and(
          eq(messages.conversationId, conversationId),
          eq(messages.senderId, otherUserId),
          eq(messages.read, false)
        )
      )

    return { success: true }
  } catch (error) {
    console.error("Error in markMessagesAsRead:", error)
    return null
  }
}

/**
 * Đếm số tin nhắn chưa đọc trong một conversation
 */
export async function getUnreadCount(conversationId: number, userId: string) {
  try {
    const conversation = await db.query.conversations.findFirst({
      where: eq(conversations.id, conversationId),
    })

    if (!conversation) return 0

    const otherUserId = conversation.user1Id === userId 
      ? conversation.user2Id 
      : conversation.user1Id

    const unreadMessages = await db.query.messages.findMany({
      where: and(
        eq(messages.conversationId, conversationId),
        eq(messages.senderId, otherUserId),
        eq(messages.read, false)
      ),
    })

    return unreadMessages.length
  } catch (error) {
    console.error("Error in getUnreadCount:", error)
    return 0
  }
}