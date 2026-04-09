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
import { useMe } from "@/lib/use-me"
import { useLocale } from "@/lib/i18n/locale-context"

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
  const { me } = useMe(true)
  const { t, locale } = useLocale()

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
      toast.error(t("chat.toastMutualOnly"))
      return
    }
    if (!res.ok) {
      toast.error(t("chat.toastOpenFail"))
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
        toast.error(t("chat.toastMutualFromProfile"))
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
  }, [searchParams, router, t])

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
      toast.error(t("chat.toastSendBlocked"))
    }
  }

  return (
    <div className="grid gap-3 sm:gap-4 lg:grid-cols-[minmax(240px,26%)_minmax(0,1fr)] xl:grid-cols-[minmax(260px,24%)_minmax(0,1fr)]">
      <Card className="flex flex-col overflow-hidden lg:min-h-[72vh]">
        <div className="border-b px-4 py-3">
          <p className="text-sm font-semibold">{t("chat.title")}</p>
          <p className="mt-1 text-xs text-muted-foreground">{t("chat.mutualHint")}</p>
        </div>
        <div className="border-b px-4 py-3">
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {t("chat.mutualFriends")}
          </p>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder={t("chat.searchFriendsPlaceholder")}
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
            <p className="mt-2 text-xs text-muted-foreground">{t("chat.noMutualMatches")}</p>
          ) : null}
        </div>
        <div className="min-h-0 flex-1 max-h-[min(45vh,380px)] overflow-y-auto lg:max-h-none lg:flex-1">
          {conversations.length === 0 ? (
            <div className="p-4 text-sm text-muted-foreground">{t("chat.noConversations")}</div>
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
                    (c.lastMessage?.imageUrl ? t("chat.sentImage") : null) ??
                    (c.lastMessage?.videoUrl ? t("chat.sentVideo") : "—")}
                </div>
              </button>
            ))
          )}
        </div>
      </Card>

      <Card className="flex min-h-[70vh] flex-col overflow-hidden lg:min-h-[72vh]">
        <div className="border-b px-4 py-3 text-sm font-semibold">
          {activeConversation ? activeConversation.otherUser.name : t("chat.selectChat")}
        </div>
        <div className="flex min-h-0 flex-1 flex-col bg-muted/20">
          <div className="flex-1 overflow-y-auto px-2 py-4 sm:px-4 md:px-6">
            {loadingMessages ? (
              <div className="text-sm text-muted-foreground">{t("chat.loading")}</div>
            ) : messages.length === 0 ? (
              <div className="text-sm text-muted-foreground">{t("chat.noMessages")}</div>
            ) : (
              <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 xl:max-w-5xl">
                {messages.map((m) => {
                  const isMine = Boolean(me?.id && m.senderId === me.id)
                  const timeLabel = new Date(m.createdAt).toLocaleString(
                    locale === "ko" ? "ko-KR" : "en-US",
                    {
                      month: "numeric",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    }
                  )
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex w-full items-end gap-2",
                        isMine ? "flex-row-reverse justify-end" : "flex-row justify-start"
                      )}
                    >
                      {!isMine ? (
                        <div className="relative mb-5 h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted ring-1 ring-border">
                          {m.sender.avatarUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element -- remote user avatars
                            <img
                              src={m.sender.avatarUrl}
                              alt=""
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold text-muted-foreground">
                              {m.sender.name?.charAt(0)?.toUpperCase() ?? "?"}
                            </span>
                          )}
                        </div>
                      ) : (
                        <div className="w-8 shrink-0" aria-hidden />
                      )}
                      <div
                        className={cn(
                          "flex max-w-[min(100%,34rem)] flex-col gap-1",
                          isMine ? "items-end" : "items-start"
                        )}
                      >
                        {!isMine ? (
                          <span className="px-1 text-[11px] font-medium text-muted-foreground">
                            {m.sender.name}
                          </span>
                        ) : null}
                        <div
                          className={cn(
                            "rounded-[18px] px-3.5 py-2 text-[15px] leading-snug shadow-sm",
                            isMine
                              ? "rounded-br-md bg-primary text-primary-foreground"
                              : "rounded-bl-md bg-card text-card-foreground ring-1 ring-border/60"
                          )}
                        >
                          {m.content ? (
                            <p className="whitespace-pre-wrap break-words">{m.content}</p>
                          ) : null}
                          {m.imageUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={m.imageUrl}
                              alt="attachment"
                              className={cn(
                                "max-h-64 w-full max-w-full rounded-lg object-contain",
                                m.content ? "mt-2" : ""
                              )}
                            />
                          ) : null}
                          {m.videoUrl ? (
                            <video
                              src={m.videoUrl}
                              controls
                              className={cn(
                                "max-h-64 w-full max-w-full rounded-lg",
                                m.content || m.imageUrl ? "mt-2" : ""
                              )}
                            />
                          ) : null}
                        </div>
                        <span
                          className={cn(
                            "px-1 text-[10px] text-muted-foreground",
                            isMine ? "text-right" : "text-left"
                          )}
                        >
                          {timeLabel}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
          <div className="shrink-0 border-t border-border/60 bg-card px-2 pb-3 pt-2 sm:px-4 md:px-6">
            <div className="mx-auto w-full max-w-4xl xl:max-w-5xl">
              <MessageInput onSend={send} disabled={!activeId} />
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

