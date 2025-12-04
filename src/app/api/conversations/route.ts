import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getConversations, getOrCreateConversation, deleteConversation } from "@/lib/db/chat-queries"
import { getFollowingUsers } from "@/lib/db/queries"

type ConversationSummary = Awaited<ReturnType<typeof getConversations>>[number]
type FollowingUser = Awaited<ReturnType<typeof getFollowingUsers>>[number]
type ContactUser = ConversationSummary["otherUser"] | FollowingUser
type SerializedMessage = {
  content: string
  createdAt: string
  senderId: string
} | null
type SerializedUser = {
  id: string
  name: string
  email: string
  avatar: string | null
  createdAt?: string
  updatedAt?: string
}
type ContactEntry = {
  id: number
  otherUser: SerializedUser
  updatedAt: string
  unreadCount: number
  lastMessage: SerializedMessage
}

function serializeUser(user: ContactUser): SerializedUser {
  const serialized: SerializedUser = {
    id: user.id,
    name: user.name,
    email: user.email,
    avatar: user.avatar ?? null,
  }
  
  // Serialize Date fields if they exist (using type assertion for optional fields)
  const userWithDates = user as ContactUser & { createdAt?: Date | string; updatedAt?: Date | string }
  
  if (userWithDates.createdAt) {
    serialized.createdAt = userWithDates.createdAt instanceof Date 
      ? userWithDates.createdAt.toISOString() 
      : typeof userWithDates.createdAt === 'string' 
        ? userWithDates.createdAt 
        : String(userWithDates.createdAt)
  }
  
  if (userWithDates.updatedAt) {
    serialized.updatedAt = userWithDates.updatedAt instanceof Date 
      ? userWithDates.updatedAt.toISOString() 
      : typeof userWithDates.updatedAt === 'string' 
        ? userWithDates.updatedAt 
        : String(userWithDates.updatedAt)
  }
  
  return serialized
}

function serializeConversation(conversation: ConversationSummary): ContactEntry {
  return {
    id: conversation.id,
    otherUser: serializeUser(conversation.otherUser),
    unreadCount: conversation.unreadCount ?? 0,
    updatedAt:
      conversation.updatedAt instanceof Date
        ? conversation.updatedAt.toISOString()
        : typeof conversation.updatedAt === 'string'
          ? conversation.updatedAt
          : String(conversation.updatedAt),
    lastMessage: conversation.lastMessage
      ? {
          content: conversation.lastMessage.content,
          senderId: conversation.lastMessage.senderId,
          createdAt:
            typeof conversation.lastMessage.createdAt === "string"
              ? conversation.lastMessage.createdAt
              : conversation.lastMessage.createdAt instanceof Date
                ? conversation.lastMessage.createdAt.toISOString()
                : String(conversation.lastMessage.createdAt),
        }
      : null,
  }
}

export async function GET(req: NextRequest) {
  console.log("[CONVERSATIONS API] GET request received")
  try {
    console.log("[CONVERSATIONS API] Getting session...")
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    console.log("[CONVERSATIONS API] Session:", session ? "exists" : "null")

    if (!session?.user) {
      console.log("[CONVERSATIONS API] Unauthorized - no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[CONVERSATIONS API] Fetching conversations and following users for user:", session.user.id)
    const [conversations, following] = await Promise.all([
      getConversations(session.user.id),
      getFollowingUsers(session.user.id),
    ])

    console.log("[CONVERSATIONS API] Conversations count:", conversations.length)
    console.log("[CONVERSATIONS API] Following users count:", following.length)

    const contactsMap = new Map<string, ContactEntry>()

    conversations.forEach(conv => {
      contactsMap.set(conv.otherUser.id, serializeConversation(conv))
    })

    following.forEach(user => {
      if (!contactsMap.has(user.id)) {
        contactsMap.set(user.id, {
          id: -1,
          otherUser: serializeUser(user),
          updatedAt: new Date().toISOString(),
          lastMessage: null,
          unreadCount: 0,
        })
      }
    })

    const mergedContacts = Array.from(contactsMap.values()).sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    )

    console.log("[CONVERSATIONS API] Returning", mergedContacts.length, "contacts")
    return NextResponse.json({ conversations: mergedContacts })
  } catch (error) {
    console.error("[CONVERSATIONS API] Error fetching conversations:", error)
    console.error("[CONVERSATIONS API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  console.log("[CONVERSATIONS API] POST request received")
  try {
    console.log("[CONVERSATIONS API] Getting session...")
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    console.log("[CONVERSATIONS API] Session:", session ? "exists" : "null")

    if (!session?.user) {
      console.log("[CONVERSATIONS API] Unauthorized - no session")
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    console.log("[CONVERSATIONS API] Parsing request body...")
    const body = await req.json()
    const targetUserId = body?.targetUserId
    console.log("[CONVERSATIONS API] Target user ID:", targetUserId)

    if (!targetUserId) {
      console.log("[CONVERSATIONS API] Missing targetUserId")
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      )
    }

    if (targetUserId === session.user.id) {
      console.log("[CONVERSATIONS API] Cannot chat with yourself")
      return NextResponse.json(
        { error: "Cannot chat with yourself" },
        { status: 400 }
      )
    }

    console.log("[CONVERSATIONS API] Creating/getting conversation between:", session.user.id, "and", targetUserId)
    const conversation = await getOrCreateConversation(
      session.user.id,
      targetUserId
    )

    if (!conversation) {
      console.error("[CONVERSATIONS API] Failed to create conversation")
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      )
    }

    const otherUser =
      conversation.user1.id === session.user.id
        ? conversation.user2
        : conversation.user1

    console.log("[CONVERSATIONS API] Conversation created successfully, ID:", conversation.id)
    return NextResponse.json({
      conversation: {
        id: conversation.id,
        otherUser: serializeUser(otherUser),
        lastMessage: null,
        updatedAt: new Date().toISOString(),
        unreadCount: 0,
      },
    })
  } catch (error) {
    console.error("[CONVERSATIONS API] Error creating conversation:", error)
    console.error("[CONVERSATIONS API] Error stack:", error instanceof Error ? error.stack : "No stack trace")
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = parseInt(searchParams.get("conversationId") || "0")

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      )
    }

    const result = await deleteConversation(conversationId, session.user.id)

    if (result === null) {
      return NextResponse.json(
        { error: "Conversation not found" },
        { status: 404 }
      )
    }

    if (result === false) {
      return NextResponse.json(
        { error: "You don't have permission to delete this conversation" },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[CONVERSATIONS API] Error deleting conversation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}