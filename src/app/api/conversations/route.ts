import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getConversations, getOrCreateConversation } from "@/lib/db/chat-queries"
import { getFollowersUsers } from "@/lib/db/queries"

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

    const contactsMap = new Map<string, any>()

    conversations.forEach(conv => {
      contactsMap.set(conv.otherUser.id, {
        ...conv,
        unreadCount: conv.unreadCount ?? 0,
        updatedAt:
          conv.updatedAt instanceof Date
            ? conv.updatedAt.toISOString()
            : conv.updatedAt,
        lastMessage: conv.lastMessage
          ? {
              ...conv.lastMessage,
              createdAt:
                typeof conv.lastMessage.createdAt === "string"
                  ? conv.lastMessage.createdAt
                  : new Date(conv.lastMessage.createdAt).toISOString(),
            }
          : null,
      })
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