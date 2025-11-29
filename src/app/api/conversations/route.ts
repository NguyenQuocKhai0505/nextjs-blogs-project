import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getConversations, getOrCreateConversation } from "@/lib/db/chat-queries"
import { getFollowersUsers } from "@/lib/db/queries"

type ConversationSummary = Awaited<ReturnType<typeof getConversations>>[number]
type FollowerUser = Awaited<ReturnType<typeof getFollowersUsers>>[number]
type ContactUser = ConversationSummary["otherUser"] | FollowerUser
type SerializedMessage =
  ConversationSummary["lastMessage"] extends null
    ? null
    : ConversationSummary["lastMessage"] & { createdAt: string }
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
          ...conversation.lastMessage,
          createdAt:
            typeof conversation.lastMessage.createdAt === "string"
              ? conversation.lastMessage.createdAt
              : new Date(conversation.lastMessage.createdAt).toISOString(),
        }
      : null,
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const [conversations, followers] = await Promise.all([
      getConversations(session.user.id),
      getFollowersUsers(session.user.id),
    ])

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

    return NextResponse.json({ conversations: mergedContacts })
  } catch (error) {
    console.error("Error fetching conversations:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const targetUserId = body?.targetUserId

    if (!targetUserId) {
      return NextResponse.json(
        { error: "targetUserId is required" },
        { status: 400 }
      )
    }

    if (targetUserId === session.user.id) {
      return NextResponse.json(
        { error: "Cannot chat with yourself" },
        { status: 400 }
      )
    }

    const conversation = await getOrCreateConversation(
      session.user.id,
      targetUserId
    )

    if (!conversation) {
      return NextResponse.json(
        { error: "Failed to create conversation" },
        { status: 500 }
      )
    }

    const otherUser =
      conversation.user1.id === session.user.id
        ? conversation.user2
        : conversation.user1

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
    console.error("Error creating conversation:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}