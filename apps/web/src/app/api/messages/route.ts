import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createMessage, getMessages, deleteMessage } from "@/lib/db/chat-queries"

export async function GET(req: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    })

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const conversationId = parseInt(searchParams.get("conversationId") || "0")
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      )
    }

    const messages = await getMessages(conversationId, limit)

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Error fetching messages:", error)
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
    const { conversationId, content, imageUrl, videoUrl } = body || {}

    if (!conversationId) {
      return NextResponse.json(
        { error: "conversationId is required" },
        { status: 400 }
      )
    }

    const hasText = !!(content && content.trim().length > 0)
    const hasImage = !!imageUrl
    const hasVideo = !!videoUrl

    if (!hasText && !hasImage && !hasVideo) {
      return NextResponse.json(
        { error: "At least one of content, imageUrl, videoUrl is required" },
        { status: 400 }
      )
    }

    const message = await createMessage(
      Number(conversationId),
      session.user.id,
      {
        content: hasText ? content.trim() : undefined,
        imageUrl,
        videoUrl,
      }
    )

    if (!message) {
      return NextResponse.json(
        { error: "Failed to create message" },
        { status: 500 }
      )
    }

    return NextResponse.json({ message })
  } catch (error) {
    console.error("Error creating message:", error)
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
    const messageId = parseInt(searchParams.get("messageId") || "0")

    if (!messageId) {
      return NextResponse.json(
        { error: "messageId is required" },
        { status: 400 }
      )
    }

    const result = await deleteMessage(messageId, session.user.id)

    if (result === null) {
      return NextResponse.json(
        { error: "Message not found" },
        { status: 404 }
      )
    }

    if (result === false) {
      return NextResponse.json(
        { error: "You don't have permission to delete this message" },
        { status: 403 }
      )
    }

    return NextResponse.json({ success: true, conversationId: result.conversationId })
  } catch (error) {
    console.error("Error deleting message:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}