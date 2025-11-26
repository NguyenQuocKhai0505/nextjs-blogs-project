"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export type MessageItem = {
  id: number
  conversationId: number
  senderId: string
  content: string
  createdAt: string
}

type ChatWindowProps = {
  messages: MessageItem[]
  currentUserId: string
  loading: boolean
}

export default function ChatWindow({ messages, currentUserId, loading }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages.length])

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Loading messages...
      </div>
    )
  }

  if (!messages.length) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
        Say hi 👋 to start the conversation
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto px-6 py-4">
      {messages.map(message => {
        const isOwn = message.senderId === currentUserId
        return (
          <div
            key={message.id}
            className={cn("flex w-full justify-start", isOwn && "justify-end")}
          >
            <div
              className={cn(
                "max-w-[70%] rounded-2xl px-4 py-2 text-sm shadow-sm",
                isOwn
                  ? "bg-primary text-primary-foreground rounded-br-sm"
                  : "bg-muted text-foreground rounded-bl-sm"
              )}
            >
              <p className="whitespace-pre-line">{message.content}</p>
              <p className="mt-1 text-right text-[11px] opacity-70">
                {new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

