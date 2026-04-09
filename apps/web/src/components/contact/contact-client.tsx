"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { toast } from "sonner"
import { MessageCircle, Search } from "lucide-react"

import { apiSocketUrl } from "@/lib/api"
import { getAccessToken } from "@/lib/token"
import { authFetch } from "@/lib/auth-fetch"
import MessageInput from "@/components/contact/message-input"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

type UserLite = {
  id: string
  name: string
  avatarUrl: string | null
  // legacy fields (from old BetterAuth/Drizzle chat UI)
  email?: string | null
  avatar?: string | null
}

export type ConversationItem = {
  id: number
  otherUser: UserLite
  updatedAt: string
  lastMessage: {
    id: number
    conversationId: number
    sender: UserLite
    content: string | null
    imageUrl: string | null
    videoUrl: string | null
    createdAt: string
  } | null
}

// Legacy exports to keep older chat components compiling.
export type ContactUser = UserLite
export type ContactSummary = ConversationItem & { unreadCount?: number }

export type MessageItem = {
  id: number
  conversationId: number
  senderId: string
  content: string | null
  imageUrl: string | null
  videoUrl: string | null
  read: boolean
  createdAt: string
  sender: UserLite
}

export default function ContactClient({
  initialConversations,
}: {
  initialConversations: ConversationItem[]
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [conversations, setConversations] =
    useState<ConversationItem[]>(initialConversations)
  const [activeId, setActiveId] = useState<number | null>(
    initialConversations[0]?.id ?? null
  )
  const [messages, setMessages] = useState<MessageItem[]>([])
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [friendQuery, setFriendQuery] = useState("")
  const [friendHits, setFriendHits] = useState<UserLite[]>([])

  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

  async function reloadConversations() {
    const listRes = await authFetch("/conversations", { cache: "no-store" })
    if (!listRes.ok) return
    const list = (await listRes.json()) as ConversationItem[]
    setConversations(list)
    return list
  }

  async function openChatWith(otherUserId: string) {
    const res = await authFetch("/conversations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ userId: otherUserId }),
    })
    if (res.status === 403) {
      toast.error(
        "Only mutual friends can chat. Follow each other from profile pages first."
      )
      return
    }
    if (!res.ok) {
      toast.error("Could not open chat.")
      return
    }
    const list = await reloadConversations()
    const conv = list?.find((c) => c.otherUser.id === otherUserId)
    if (conv) setActiveId(conv.id)
  }

  useEffect(() => {
    const uid = searchParams.get("userId")
    if (!uid?.trim()) return
    let cancelled = false
    ;(async () => {
      const res = await authFetch("/conversations", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId: uid.trim() }),
      })
      if (cancelled) return
      if (res.status === 403) {
        toast.error(
          "Only mutual friends can chat. Visit their profile and follow each other first."
        )
      } else if (res.ok) {
        const list = await reloadConversations()
        const conv = list?.find((c) => c.otherUser.id === uid.trim())
        if (conv) setActiveId(conv.id)
      }
      router.replace("/contact", { scroll: false })
    })()
    return () => {
      cancelled = true
    }
  }, [searchParams, router])

  useEffect(() => {
    const q = friendQuery.trim()
    const t = window.setTimeout(() => {
      void (async () => {
        if (!getAccessToken()) {
          setFriendHits([])
          return
        }
        const res = await authFetch(
          `/me/mutual-friends?q=${encodeURIComponent(q)}`,
          { cache: "no-store" }
        )
        if (!res.ok) {
          setFriendHits([])
          return
        }
        const data = (await res.json()) as UserLite[]
        setFriendHits(Array.isArray(data) ? data : [])
      })()
    }, 250)
    return () => window.clearTimeout(t)
  }, [friendQuery])

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [activeId, conversations]
  )

  useEffect(() => {
    let socket: Socket | null = null
    const token = getAccessToken()
    const url = apiSocketUrl()
    if (!token || !url) return

    socket = io(url, {
      transports: ["websocket"],
      auth: { token },
    })

    socket.on("connect", () => {
      const ids = conversations.map((c) => c.id)
      socket?.emit("conversations:join", { conversationIds: ids })
    })

    socket.on("message:created", (msg: MessageItem) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.conversationId)
        if (idx < 0) return prev
        const copy = [...prev]
        const c = copy[idx]
        copy[idx] = {
          ...c,
          updatedAt: msg.createdAt,
          lastMessage: {
            id: msg.id,
            conversationId: msg.conversationId,
            sender: msg.sender,
            content: msg.content,
            imageUrl: msg.imageUrl,
            videoUrl: msg.videoUrl,
            createdAt: msg.createdAt,
          },
        }
        copy.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        return copy
      })

      if (msg.conversationId === activeId) {
        setMessages((prev) => [...prev, msg])
      }
    })

    return () => {
      socket?.disconnect()
    }
  }, [activeId, conversations])

  useEffect(() => {
    if (!activeId) return
    let cancelled = false
    ;(async () => {
      setLoadingMessages(true)
      try {
        const res = await authFetch(`/conversations/${activeId}/messages`, {
          cache: "no-store",
        })
        if (!res.ok) throw new Error("Failed to load messages")
        const data = (await res.json()) as MessageItem[]
        if (!cancelled) setMessages(data)
      } catch {
        if (!cancelled) setMessages([])
      } finally {
        if (!cancelled) setLoadingMessages(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeId])

  async function send(payload: {
    content?: string
    imageUrl?: string
    videoUrl?: string
  }) {
    if (!activeId) return
    const res = await authFetch("/messages", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ conversationId: activeId, ...payload }),
    })
    if (res.status === 403) {
      toast.error("You can no longer message this user (mutual follow required).")
    }
  }

  return (
    <div className="grid gap-4 md:grid-cols-[320px_minmax(0,1fr)]">
      <Card className="overflow-hidden">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">Chats</p>
          <p className="mt-1 text-xs text-muted-foreground">
            You can only message mutual friends (both follow each other), like adding friends on
            other apps. Use profiles to follow; open chat from here or the profile.
          </p>
        </div>
        <div className="border-b px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Mutual friends
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search friends to start chatting…"
              value={friendQuery}
              onChange={(e) => setFriendQuery(e.target.value)}
            />
          </div>
          {friendHits.length > 0 ? (
            <ul className="mt-2 max-h-36 space-y-1 overflow-y-auto">
              {friendHits.map((u) => (
                <li key={u.id}>
                  <button
                    type="button"
                    className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-accent"
                    onClick={() => void openChatWith(u.id)}
                  >
                    <MessageCircle className="size-4 shrink-0 text-muted-foreground" />
                    <span className="truncate font-medium">{u.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : friendQuery.trim() && getAccessToken() ? (
            <p className="mt-2 text-xs text-muted-foreground">No matching mutual friends.</p>
          ) : null}
        </div>
        <div className="max-h-[min(40vh,320px)] overflow-auto">
          {conversations.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">
              No conversations yet. Follow someone and have them follow you back, then start a chat
              above.
            </div>
          ) : (
            conversations.map((c) => (
              <button
                key={c.id}
                className={cn(
                  "w-full border-b px-4 py-3 text-left hover:bg-accent",
                  activeId === c.id && "bg-accent"
                )}
                onClick={() => setActiveId(c.id)}
              >
                <div className="text-sm font-medium">{c.otherUser.name}</div>
                <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                  {c.lastMessage?.content ??
                    (c.lastMessage?.imageUrl ? "Sent an image" : null) ??
                    (c.lastMessage?.videoUrl ? "Sent a video" : "—")}
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="flex min-h-[70vh] flex-col overflow-hidden">
        <div className="border-b px-4 py-3 text-sm font-semibold">
          {activeConversation ? activeConversation.otherUser.name : "Select a chat"}
        </div>
        <div className="flex-1 overflow-auto px-4 py-3">
          {loadingMessages ? (
            <div className="text-sm text-muted-foreground">Loading…</div>
          ) : messages.length === 0 ? (
            <div className="text-sm text-muted-foreground">No messages yet.</div>
          ) : (
            <div className="space-y-3">
              {messages.map((m) => (
                <div key={m.id} className="rounded-xl border p-3">
                  <div className="text-xs text-muted-foreground">
                    {m.sender.name} • {new Date(m.createdAt).toLocaleString()}
                  </div>
                  {m.content ? <div className="mt-1 text-sm">{m.content}</div> : null}
                  {m.imageUrl ? (
                    <img
                      src={m.imageUrl}
                      alt="attachment"
                      className="mt-2 max-h-64 w-auto rounded-lg"
                    />
                  ) : null}
                  {m.videoUrl ? (
                    <video
                      src={m.videoUrl}
                      controls
                      className="mt-2 max-h-64 w-auto rounded-lg"
                    />
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
        <MessageInput onSend={send} disabled={!activeId} />
      </Card>
    </div>
  )
}

