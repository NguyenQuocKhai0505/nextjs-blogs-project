"use client"

import { useEffect, useState } from "react"
import ChatWindow, { MessageItem } from "./chat-window"
import MessageInput from "./message-input"
import { ContactUser } from "./contact-client"
import { useSocket } from "@/contexts/socket-context"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { MoreHorizontal } from "lucide-react"

type ChatPanelProps = {
  conversationId: number | null
  participant: ContactUser | null
  currentUserId: string
  onDeleteConversation?: (conversationId: number) => void
}

export default function ChatPanel({
  conversationId,
  participant,
  currentUserId,
  onDeleteConversation,
}: ChatPanelProps) {
  const { socket, isConnected } = useSocket()
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!conversationId) {
      setMessages([])
      return
    }

    const fetchMessages = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/messages?conversationId=${conversationId}`)
        if (!res.ok) {
          throw new Error("Failed to load messages")
        }
        const data = await res.json()
        setMessages(data.messages || [])
      } catch (error) {
        console.error(error)
      } finally {
        setLoading(false)
      }
    }

    fetchMessages()
  }, [conversationId])

  useEffect(() => {
    if (!socket || !conversationId) return

    socket.emit("join_conversation", conversationId)
    socket.emit("mark_read", conversationId)

    const handleNewMessage = (message: MessageItem) => {
      if (message.conversationId === conversationId) {
        setMessages(prev => [...prev, message])
        socket.emit("mark_read", conversationId)
      }
    }

    socket.on("new_message", handleNewMessage)

    return () => {
      socket.off("new_message", handleNewMessage)
    }
  }, [socket, conversationId])

  type OutgoingMessagePayload = {
    content?: string
    imageUrl?: string
    videoUrl?: string
  }

  const handleSendMessage = async (payload: OutgoingMessagePayload) => {
    if (!conversationId) return

    const body = { conversationId, ...payload }

    if (socket && isConnected) {
      socket.emit("send_message", body)
    } else {
      try {
        const res = await fetch("/api/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          throw new Error("Failed to send message")
        }
        const data = await res.json()
        if (data.message) {
          setMessages(prev => [...prev, data.message])
        }
      } catch (error) {
        console.error(error)
      }
    }
  }

  if (!participant) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 text-center text-muted-foreground">
        <p className="text-lg font-semibold text-foreground">Select a contact</p>
        <p className="max-w-sm text-sm">
          Pick someone from your contact list on the left to start a conversation.
        </p>
      </div>
    )
  }

  return (
    <section className="flex h-full flex-col">
      <header className="flex items-center justify-between border-b px-6 py-4">
        <div className="flex items-center gap-3">
          <Avatar className="size-12">
            {participant.avatar ? (
              <AvatarImage src={participant.avatar} alt={participant.name} />
            ) : null}
            <AvatarFallback>{participant.name?.charAt(0).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{participant.name}</p>
            <p className="text-xs text-muted-foreground">
              {isConnected ? "Online" : "Offline"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className={cn("h-2.5 w-2.5 rounded-full", isConnected ? "bg-green-500" : "bg-gray-400")} />
          <p>{isConnected ? "Connected" : "Waiting for connection"}</p>
          {conversationId && onDeleteConversation && (
            <button
              type="button"
              className="ml-3 rounded-full p-1 hover:bg-muted"
              onClick={() => {
                const ok = window.confirm("Delete this conversation? This action cannot be undone.")
                if (ok) {
                  onDeleteConversation(conversationId)
                }
              }}
              aria-label="Conversation options"
            >
              <MoreHorizontal className="h-4 w-4" />
            </button>
          )}
        </div>
      </header>
      <ChatWindow
        messages={messages}
        currentUserId={currentUserId}
        loading={loading}
        onDeleteMessage={async (messageId) => {
          // Xoá local ngay để UI phản hồi nhanh
          setMessages(prev => prev.filter(m => m.id !== messageId))

          if (socket && isConnected) {
            socket.emit("delete_message", { messageId })
          } else {
            try {
              await fetch(`/api/messages?messageId=${messageId}`, {
                method: "DELETE",
              })
            } catch (error) {
              console.error(error)
            }
          }
        }}
      />
      <MessageInput onSend={handleSendMessage} disabled={!conversationId} />
    </section>
  )
}

