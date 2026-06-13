"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { io, Socket } from "socket.io-client"
import { toast } from "sonner"
import { MessageCircle, MoreVertical, Search } from "lucide-react"

import { apiSocketUrl } from "@/lib/api"
import { getAccessToken } from "@/lib/token"
import { authFetch } from "@/lib/auth-fetch"
import MessageInput from "@/components/contact/message-input"
import { VoiceMessagePlayer } from "@/components/contact/voice-message-player"
import { CreateGroupDialog } from "@/components/contact/create-group-dialog"
import { Card } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { cn } from "@/lib/utils"
import { useMe } from "@/lib/use-me"
import { localeBcp47, useLocale } from "@/lib/i18n/locale-context"

const RECALL_WINDOW_MS = 15 * 60 * 1000

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
  kind?: "DIRECT" | "GROUP"
  title?: string | null
  otherUser: UserLite | null
  /** Inbound messages not yet “read” for this viewer (see API read cursor). */
  unreadCount?: number
  updatedAt: string
  lastMessage: {
    id: number
    conversationId: number
    sender: UserLite
    content: string | null
    imageUrl: string | null
    videoUrl: string | null
    audioUrl: string | null
    audioDurationSec: number | null
    revokedAt?: string | null
    createdAt: string
  } | null
}

function conversationLabel(c: ConversationItem): string {
  if (c.kind === "GROUP" && c.title?.trim()) return c.title.trim()
  return c.otherUser?.name ?? "Chat"
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
  audioUrl: string | null
  audioDurationSec: number | null
  read: boolean
  revokedAt?: string | null
  createdAt: string
  sender: UserLite
}

/** UUID / user id compare (avoids subtle mismatch between JWT and API casing). */
function userIdsEqual(a: string | undefined | null, b: string | undefined | null) {
  if (a == null || b == null) return false
  return a.trim().toLowerCase() === b.trim().toLowerCase()
}

function lastMessagePreview(
  m: ConversationItem["lastMessage"],
  t: (key: string) => string
): string {
  if (!m) return "—"
  if (m.revokedAt) return t("chat.revokedPreview")
  if (m.content?.trim()) return m.content
  if (m.imageUrl) return t("chat.sentImage")
  if (m.videoUrl) return t("chat.sentVideo")
  if (m.audioUrl) return t("chat.sentVoice")
  return "—"
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
  const [hideConfirmId, setHideConfirmId] = useState<number | null>(null)
  const { me } = useMe(true)
  const { t, locale } = useLocale()

  const activeIdRef = useRef(activeId)
  useEffect(() => {
    activeIdRef.current = activeId
  }, [activeId])
  const meRef = useRef(me)
  useEffect(() => {
    meRef.current = me
  }, [me])

  useEffect(() => {
    setConversations(initialConversations)
  }, [initialConversations])

  const markConversationRead = useCallback(
    async (conversationId: number, lastReadMessageId: number) => {
      if (lastReadMessageId < 1) return
      const res = await authFetch(`/conversations/${conversationId}/read`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ lastReadMessageId }),
      })
      if (!res.ok) return
      setConversations((prev) =>
        prev.map((c) => (c.id === conversationId ? { ...c, unreadCount: 0 } : c))
      )
    },
    []
  )

  const reloadConversations = useCallback(async () => {
    const listRes = await authFetch("/conversations", { cache: "no-store" })
    if (!listRes.ok) return undefined
    const list = (await listRes.json()) as ConversationItem[]
    setConversations(list)
    return list
  }, [])

  const recallMessage = useCallback(
    async (messageId: number) => {
      const res = await authFetch(`/messages/${messageId}/recall`, {
        method: "POST",
      })
      if (res.ok) {
        toast.success(t("chat.toastRecallOk"))
        return
      }
      if (res.status === 400) {
        toast.error(t("chat.toastRecallExpired"))
      } else {
        toast.error(t("chat.toastRecallFail"))
      }
    },
    [t]
  )

  const confirmHideConversation = useCallback(async () => {
    if (hideConfirmId == null) return
    const id = hideConfirmId
    setHideConfirmId(null)
    const res = await authFetch(`/conversations/${id}`, { method: "DELETE" })
    if (!res.ok) {
      toast.error(t("chat.toastHideFail"))
      return
    }
    toast.success(t("chat.toastConversationHidden"))
    const list = await reloadConversations()
    if (activeIdRef.current === id) {
      setMessages([])
      setActiveId(list?.[0]?.id ?? null)
    }
  }, [hideConfirmId, reloadConversations, t])

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
    const conv = list?.find(
      (c) => c.kind !== "GROUP" && c.otherUser?.id === otherUserId
    )
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
        const conv = list?.find(
          (c) => c.kind !== "GROUP" && c.otherUser?.id === uid.trim()
        )
        if (conv) setActiveId(conv.id)
      }
      router.replace("/contact", { scroll: false })
    })()
    return () => {
      cancelled = true
    }
  }, [searchParams, router, t, reloadConversations])

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
    let presenceIv: ReturnType<typeof setInterval> | null = null
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
      socket?.emit("presence:ping")
      if (presenceIv) clearInterval(presenceIv)
      presenceIv = setInterval(() => {
        socket?.emit("presence:ping")
      }, 60_000)
    })

    socket.on("message:created", (msg: MessageItem) => {
      const myId = meRef.current?.id
      const curActive = activeIdRef.current

      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.conversationId)
        if (idx < 0) {
          void reloadConversations()
          return prev
        }
        const copy = [...prev]
        const c = copy[idx]
        let unreadCount = c.unreadCount ?? 0
        if (!userIdsEqual(msg.senderId, myId)) {
          if (msg.conversationId === curActive) unreadCount = 0
          else unreadCount = unreadCount + 1
        }
        copy[idx] = {
          ...c,
          updatedAt: msg.createdAt,
          unreadCount,
          lastMessage: {
            id: msg.id,
            conversationId: msg.conversationId,
            sender: msg.sender,
            content: msg.content,
            imageUrl: msg.imageUrl,
            videoUrl: msg.videoUrl,
            audioUrl: msg.audioUrl,
            audioDurationSec: msg.audioDurationSec,
            revokedAt: msg.revokedAt ?? null,
            createdAt: msg.createdAt,
          },
        }
        copy.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        return copy
      })

      if (msg.conversationId === curActive) {
        setMessages((prev) => [...prev, msg])
        if (!userIdsEqual(msg.senderId, myId)) {
          void markConversationRead(msg.conversationId, msg.id)
        }
      }
    })

    socket.on("message:revoked", (msg: MessageItem) => {
      setMessages((prev) =>
        prev.map((x) => (x.id === msg.id ? { ...x, ...msg } : x))
      )
      setConversations((prev) => {
        const idx = prev.findIndex((c) => c.id === msg.conversationId)
        if (idx < 0) return prev
        const c = prev[idx]
        if (c.lastMessage?.id !== msg.id) return prev
        const nowIso = new Date().toISOString()
        const copy = [...prev]
        copy[idx] = {
          ...c,
          updatedAt: nowIso,
          lastMessage: c.lastMessage
            ? {
                ...c.lastMessage,
                content: msg.content,
                imageUrl: msg.imageUrl,
                videoUrl: msg.videoUrl,
                audioUrl: msg.audioUrl,
                audioDurationSec: msg.audioDurationSec,
                revokedAt: msg.revokedAt ?? c.lastMessage.revokedAt ?? null,
              }
            : null,
        }
        copy.sort((a, b) => +new Date(b.updatedAt) - +new Date(a.updatedAt))
        return copy
      })
    })

    return () => {
      if (presenceIv) clearInterval(presenceIv)
      socket?.disconnect()
    }
  }, [activeId, conversations, reloadConversations, markConversationRead])

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
        if (!cancelled && data.length > 0) {
          const maxId = Math.max(...data.map((m) => m.id))
          void markConversationRead(activeId, maxId)
        }
      } catch {
        if (!cancelled) setMessages([])
      } finally {
        if (!cancelled) setLoadingMessages(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [activeId, markConversationRead])

  async function send(payload: {
    content?: string
    imageUrl?: string
    videoUrl?: string
    audioUrl?: string
    audioDurationSec?: number
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
          <div className="flex items-start justify-between gap-2">
            <p className="text-sm font-semibold">{t("chat.title")}</p>
            <CreateGroupDialog
              onCreated={async (conversationId) => {
                const list = await reloadConversations()
                if (list?.some((c) => c.id === conversationId)) {
                  setActiveId(conversationId)
                }
              }}
            />
          </div>
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
            conversations.map((c) => {
              const unread = c.unreadCount ?? 0
              return (
                <div
                  key={c.id}
                  className={cn(
                    "flex w-full items-stretch border-b hover:bg-accent/80",
                    activeId === c.id && "bg-accent"
                  )}
                >
                  <button
                    type="button"
                    className="min-w-0 flex-1 px-4 py-3 text-left"
                    onClick={() => setActiveId(c.id)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-medium">{conversationLabel(c)}</div>
                        <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                          {lastMessagePreview(c.lastMessage, t)}
                        </div>
                      </div>
                      {unread > 0 ? (
                        <span className="mt-0.5 inline-flex h-5 min-w-[1.25rem] shrink-0 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">
                          {unread > 99 ? "99+" : unread}
                        </span>
                      ) : null}
                    </div>
                  </button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-auto shrink-0 rounded-none px-3"
                        aria-label={t("chat.conversationMenuAria")}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="size-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setHideConfirmId(c.id)}
                      >
                        {t("chat.deleteConversation")}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })
          )}
        </div>
      </Card>

      <Card className="flex min-h-[70vh] flex-col overflow-hidden lg:min-h-[72vh]">
        <div className="border-b px-4 py-3 text-sm font-semibold">
          {activeConversation ? conversationLabel(activeConversation) : t("chat.selectChat")}
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
                  const viewerId = me?.id
                  const senderKey = m.senderId || m.sender?.id
                  const isMine = userIdsEqual(viewerId, senderKey)
                  const isRevoked = Boolean(m.revokedAt)
                  const canRecall =
                    isMine &&
                    !isRevoked &&
                    Date.now() - new Date(m.createdAt).getTime() <= RECALL_WINDOW_MS
                  const timeLabel = new Date(m.createdAt).toLocaleString(localeBcp47[locale], {
                    month: "numeric",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  })
                  return (
                    <div
                      key={m.id}
                      className={cn(
                        "flex w-full",
                        isMine ? "justify-end" : "justify-start"
                      )}
                    >
                      <div className="flex w-fit max-w-[min(88vw,22rem)] items-end gap-2 sm:max-w-[min(78%,26rem)]">
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
                        ) : null}
                        <div
                          className={cn(
                            "flex min-w-0 flex-col gap-1",
                            isMine ? "items-end" : "items-start"
                          )}
                        >
                          {!isMine ? (
                            <span className="max-w-full truncate px-1 text-[11px] font-medium text-muted-foreground">
                              {m.sender.name}
                            </span>
                          ) : null}
                          <div
                            className={cn(
                              "flex items-end gap-1",
                              isMine ? "flex-row-reverse" : "flex-row"
                            )}
                          >
                            <div
                              className={cn(
                                "max-w-full rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm",
                                isMine
                                  ? "rounded-br-sm bg-primary text-primary-foreground"
                                  : "rounded-bl-sm bg-muted/90 text-foreground ring-1 ring-border/50",
                                isRevoked && "italic opacity-90"
                              )}
                            >
                            {isRevoked ? (
                              <p className="text-sm">{t("chat.messageRevoked")}</p>
                            ) : (
                              <>
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
                                {m.audioUrl ? (
                                  <VoiceMessagePlayer
                                    src={m.audioUrl}
                                    durationSec={m.audioDurationSec}
                                    isOwn={isMine}
                                    className={cn(
                                      m.content || m.imageUrl || m.videoUrl ? "mt-2" : ""
                                    )}
                                  />
                                ) : null}
                              </>
                            )}
                          </div>
                          {canRecall ? (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className={cn(
                                    "h-8 w-8 shrink-0",
                                    isMine
                                      ? "text-primary-foreground/80 hover:bg-primary-foreground/15 hover:text-primary-foreground"
                                      : ""
                                  )}
                                  aria-label={t("chat.messageMenuAria")}
                                >
                                  <MoreVertical className="size-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align={isMine ? "end" : "start"}>
                                <DropdownMenuItem
                                  onClick={() => void recallMessage(m.id)}
                                >
                                  {t("chat.recallMessage")}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
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
                        {isMine ? (
                          <div className="mb-5 h-8 w-8 shrink-0" aria-hidden />
                        ) : null}
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

      <AlertDialog
        open={hideConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setHideConfirmId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("chat.deleteConversationTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("chat.deleteConversationDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("chat.deleteConversationCancel")}</AlertDialogCancel>
            <Button variant="destructive" onClick={() => void confirmHideConversation()}>
              {t("chat.deleteConversationConfirm")}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

