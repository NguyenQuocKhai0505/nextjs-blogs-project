"use client"

import { useEffect, useRef } from "react"
import { cn } from "@/lib/utils"

export type MessageItem = {
  id: number
  conversationId: number
  senderId: string
  content: string | null
  imageUrl?: string | null
  videoUrl?: string | null
  createdAt: string
}

type ChatWindowProps = {
  messages: MessageItem[]
  currentUserId: string
  loading: boolean
  onDeleteMessage?: (messageId: number) => void
}

export default function ChatWindow({ messages, currentUserId, loading, onDeleteMessage }: ChatWindowProps) {
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
    <div className="flex flex-1 flex-col gap-2 overflow-y-auto px-6 py-4">
      {messages.map(message => {
        const isOwn = message.senderId === currentUserId
        const timeClass = isOwn
          ? "text-primary-foreground/70"
          : "text-muted-foreground/70"

        return (
          <div
            key={message.id}
            className={cn("flex w-full justify-start", isOwn && "justify-end")}
          >
            <div className="relative max-w-[70%]">
              {isOwn && onDeleteMessage && (
                <button
                  type="button"
                  onClick={() => onDeleteMessage(message.id)}
                  className="absolute -right-2 -top-2 rounded-full bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground shadow-sm hover:text-destructive"
                >
                  x
                </button>
              )}
              <div
                className={cn(
                  "inline-flex max-w-full flex-col gap-1 rounded-3xl px-4 py-2 text-sm",
                  isOwn
                    ? "bg-primary text-primary-foreground rounded-br-xl"
                    : "bg-muted text-foreground rounded-bl-xl"
                )}
              >
                {message.imageUrl && (
                  <img
                    src={message.imageUrl}
                    alt="image"
                    className="max-h-52 w-full rounded-xl object-cover"
                  />
                )}
                {message.videoUrl && (
                  <video
                    src={message.videoUrl}
                    controls
                    className="max-h-52 w-full rounded-xl"
                  />
                )}
                {message.content && (
                  <p className="break-words leading-relaxed">{message.content}</p>
                )}

                <p className={cn("mt-1 text-right text-[11px]", timeClass)}>
                  {new Date(message.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            </div>
          </div>
        )
      })}
      <div ref={bottomRef} />
    </div>
  )
}

