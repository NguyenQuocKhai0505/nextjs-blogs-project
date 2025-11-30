import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getConversations, getOrCreateConversation } from "@/lib/db/chat-queries"
import { getFollowersUsers } from "@/lib/db/queries"

type ConversationSummary = Awaited<ReturnType<typeof getConversations>>[number]
type FollowerUser = Awaited<ReturnType<typeof getFollowersUsers>>[number]
type ContactUser = ConversationSummary["otherUser"] | FollowerUser
type SerializedMessage = {
  content: string
  createdAt: string
  senderId: string
} | null
type ContactEntry = {
  id: number
  otherUser: ContactUser
  updatedAt: string
  unreadCount: number
  lastMessage: SerializedMessage
}

function serializeConversation(conversation: ConversationSummary): ContactEntry {
  return {
    id: conversation.id,
    otherUser: conversation.otherUser,
    unreadCount: conversation.unreadCount ?? 0,
    updatedAt:
      conversation.updatedAt instanceof Date
        ? conversation.updatedAt.toISOString()
        : conversation.updatedAt,
    lastMessage: conversation.lastMessage
      ? {
          content: conversation.lastMessage.content,
          senderId: conversation.lastMessage.senderId,
          createdAt:
            typeof conversation.lastMessage.createdAt === "string"
              ? conversation.lastMessage.createdAt
              : new Date(conversation.lastMessage.createdAt).toISOString(),
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

    console.log("[CONVERSATIONS API] Fetching conversations and followers for user:", session.user.id)
    const [conversations, followers] = await Promise.all([
      getConversations(session.user.id),
      getFollowersUsers(session.user.id),
    ])

    console.log("[CONVERSATIONS API] Conversations count:", conversations.length)
    console.log("[CONVERSATIONS API] Followers count:", followers.length)

    const contactsMap = new Map<string, ContactEntry>()

    conversations.forEach(conv => {
      contactsMap.set(conv.otherUser.id, serializeConversation(conv))
    })

    followers.forEach(user => {
      if (!contactsMap.has(user.id)) {
        contactsMap.set(user.id, {
          id: -1,
          otherUser: user,
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
        otherUser,
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