import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { createMessage, getMessages } from "@/lib/db/chat-queries"

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
    const conversationId = body?.conversationId
    const content = body?.content

    if (!conversationId || !content?.trim()) {
      return NextResponse.json(
        { error: "conversationId and content are required" },
        { status: 400 }
      )
    }

    const message = await createMessage(
      Number(conversationId),
      session.user.id,
      content.trim()
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