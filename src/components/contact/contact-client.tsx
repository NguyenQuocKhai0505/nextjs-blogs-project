"use client"
 
import { useCallback, useEffect, useMemo, useState } from "react"
import ChatList from "./chat-list"
import ChatPanel from "./chat-panel"
import { SocketProvider, useSocket } from "@/contexts/socket-context"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

export type ContactUser = {
  id: string
  name: string
  email?: string | null
  avatar?: string | null
}

export type ContactMessage = {
  id?: number
  content: string | null
  createdAt: string
  senderId: string
}

export type ContactSummary = {
  id: number
  otherUser: ContactUser
  updatedAt: string
  lastMessage: ContactMessage | null
  unreadCount?: number
}

type ContactClientProps = {
  initialContacts: ContactSummary[]
  currentUserId: string
}

type ContactState = ContactSummary & { unreadCount: number }
type IncomingSocketMessage = {
  conversationId: number
  content: string
  createdAt: string | Date
  senderId: string
}

function ContactClientContent({ initialContacts, currentUserId }: ContactClientProps) {
  const { socket } = useSocket()
  const [contacts, setContacts] = useState<ContactState[]>(() => {
    const byUser = new Map<string, ContactSummary>()

    for (const contact of initialContacts ?? []) {
      const existing = byUser.get(contact.otherUser.id)
      if (!existing) {
        byUser.set(contact.otherUser.id, contact)
      } else {
        // Giữ conversation có updatedAt mới nhất
        const existingTime = new Date(existing.updatedAt).getTime()
        const currentTime = new Date(contact.updatedAt).getTime()
        if (currentTime > existingTime) {
          byUser.set(contact.otherUser.id, contact)
        }
      }
    }

    return Array.from(byUser.values()).map(contact => ({
      ...contact,
      unreadCount: contact.unreadCount ?? 0,
    }))
  })

  const [selectedUserId, setSelectedUserId] = useState<string | null>(
    initialContacts?.[0]?.otherUser.id ?? null
  )

  // Nếu URL có ?userId=... thì ưu tiên chọn user đó (chạy 1 lần trên client)
  useEffect(() => {
    if (typeof window === "undefined") return
    const params = new URLSearchParams(window.location.search)
    const urlUserId = params.get("userId")
    if (urlUserId) {
      setSelectedUserId(urlUserId)
    }
  }, [])

  const selectedConversation = useMemo(
    () => contacts.find(contact => contact.otherUser.id === selectedUserId) ?? null,
    [contacts, selectedUserId]
  )

  const refreshContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/conversations", {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      })
      if (!res.ok) return
      const data = await res.json()
      const normalized: ContactState[] = (data.conversations || []).map(
        (conversation: ContactSummary) => ({
          ...conversation,
          updatedAt:
            typeof conversation.updatedAt === "string"
              ? conversation.updatedAt
              : new Date(conversation.updatedAt).toISOString(),
          unreadCount: conversation.unreadCount ?? 0,
        })
      )
      setContacts(normalized)
    } catch (error) {
      console.error("Failed to refresh conversations", error)
    }
  }, [])

  // Load danh sách contacts (bao gồm cả following) ngay khi vào trang
  useEffect(() => {
    refreshContacts()
  }, [refreshContacts])

  const ensureConversation = useCallback(
    async (userId: string) => {
      const target = contacts.find(contact => contact.otherUser.id === userId)
      if (!target) return null
      if (target.id && target.id > 0) {
        return target.id
      }
      try {
        const res = await fetch("/api/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: userId }),
        })
        if (!res.ok) throw new Error("Failed to create conversation")
        const data = await res.json()
        setContacts(prev =>
          prev.map(contact =>
            contact.otherUser.id === userId
              ? {
                  ...contact,
                  id: data.conversation.id,
                  updatedAt: data.conversation.updatedAt,
                }
              : contact
          )
        )
        return data.conversation.id as number
      } catch (error) {
        console.error("Failed to ensure conversation", error)
        return null
      }
    },
    [contacts]
  )

  // Đảm bảo khi auto-select từ URL thì cũng tạo conversation nếu cần
  useEffect(() => {
    if (!selectedUserId) return
    ensureConversation(selectedUserId)
  }, [selectedUserId, ensureConversation])

  const handleSelectContact = useCallback(
    (userId: string) => {
      setSelectedUserId(userId)
      setContacts(prev =>
        prev.map(contact =>
          contact.otherUser.id === userId ? { ...contact, unreadCount: 0 } : contact
        )
      )
      ensureConversation(userId)
    },
    [ensureConversation]
  )

  useEffect(() => {
    if (!socket) return

    const handleNewMessage = (message: IncomingSocketMessage) => {
      setContacts(prev => {
        const next = [...prev]
        const index = next.findIndex(contact => contact.id === message.conversationId)
        if (index === -1) {
          return prev
        }
        const target = next[index]
        const shouldResetUnread =
          target.id === selectedConversation?.id && message.senderId !== currentUserId

        next[index] = {
          ...target,
          lastMessage: {
            content: message.content,
            createdAt:
              typeof message.createdAt === "string"
                ? message.createdAt
                : new Date(message.createdAt).toISOString(),
            senderId: message.senderId,
          },
          updatedAt:
            typeof message.createdAt === "string"
              ? message.createdAt
              : new Date(message.createdAt).toISOString(),
          unreadCount: shouldResetUnread
            ? 0
            : target.unreadCount + (message.senderId === currentUserId ? 0 : 1),
        }

        return next.sort(
          (a, b) =>
            new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        )
      })
    }

    const handleMessageRead = (payload: { conversationId: number }) => {
      setContacts(prev =>
        prev.map(contact =>
          contact.id === payload.conversationId ? { ...contact, unreadCount: 0 } : contact
        )
      )
    }

    socket.on("new_message", handleNewMessage)
    socket.on("message_read", handleMessageRead)

    return () => {
      socket.off("new_message", handleNewMessage)
      socket.off("message_read", handleMessageRead)
    }
  }, [socket, currentUserId, selectedConversation?.id])

  const activeConversationId =
    selectedConversation && selectedConversation.id > 0 ? selectedConversation.id : null

  const [pendingDeleteId, setPendingDeleteId] = useState<number | null>(null)

  const handleDeleteConversation = useCallback(
    async (conversationId: number) => {
      // Xoá trong state contacts
      setContacts(prev => prev.filter(c => c.id !== conversationId))

      // Nếu đang xem cuộc trò chuyện này thì clear panel
      if (selectedConversation?.id === conversationId) {
        setSelectedUserId(null)
      }

      try {
        await fetch(`/api/conversations?conversationId=${conversationId}`, {
          method: "DELETE",
        })
      } catch (error) {
        console.error("Failed to delete conversation", error)
      }
    },
    [selectedConversation]
  )

  return (
    <div className="container mx-auto py-6">
      <div className="h-[calc(100vh-160px)] rounded-2xl border bg-white shadow-sm dark:bg-neutral-900">
        <div className="grid h-full grid-cols-[280px_1fr]">
          <ChatList
            contacts={contacts}
            selectedUserId={selectedUserId}
            onSelect={handleSelectContact}
            onRefresh={refreshContacts}
            onDeleteConversation={id => setPendingDeleteId(id)}
          />
          <ChatPanel
            currentUserId={currentUserId}
            conversationId={activeConversationId}
            participant={selectedConversation?.otherUser ?? null}
            onDeleteConversation={id => setPendingDeleteId(id)}
          />
        </div>
      </div>

      <AlertDialog
        open={pendingDeleteId !== null}
        onOpenChange={open => {
          if (!open) setPendingDeleteId(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete conversation?</AlertDialogTitle>
            <AlertDialogDescription>
              This will remove all messages in this conversation. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (pendingDeleteId !== null) {
                  await handleDeleteConversation(pendingDeleteId)
                  setPendingDeleteId(null)
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

export default function ContactClient(props: ContactClientProps) {
  return (
    <SocketProvider>
      <ContactClientContent {...props} />
    </SocketProvider>
  )
}