"use client"

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react"
import { toast } from "sonner"
import { io } from "socket.io-client"
import { apiSocketUrl } from "@/lib/api"
import { authFetch } from "@/lib/auth-fetch"
import { getAccessToken } from "@/lib/token"
import {
  AppNotification,
  getNotificationToastPayload,
} from "@/lib/notifications/utils"

type NotificationContextValue = {
  notifications: AppNotification[]
  unreadCount: number
  isLoading: boolean
  markAllAsRead: () => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  markAllAsRead: async () => {},
  refreshNotifications: async () => {},
})

async function fetchNotifications() {
  const res = await authFetch("/app-notifications?take=20", { cache: "no-store" })
  if (!res.ok) return [] as AppNotification[]
  const data = (await res.json()) as { items?: AppNotification[] }
  return Array.isArray(data?.items) ? data.items : []
}

async function fetchUnreadCount() {
  const res = await authFetch("/app-notifications/unread-count", { cache: "no-store" })
  if (!res.ok) return 0
  const data = (await res.json()) as { unread?: number }
  return typeof data?.unread === "number" ? data.unread : 0
}

async function markAllRead() {
  await authFetch("/app-notifications/mark-all-read", { method: "POST" })
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const refreshNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const [items, unread] = await Promise.all([fetchNotifications(), fetchUnreadCount()])
      setNotifications(items)
      setUnreadCount(unread)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  useEffect(() => {
    const token = getAccessToken()
    const url = apiSocketUrl()
    if (!token || !url) return

    const s = io(url + "/ws", {
      transports: ["websocket"],
      auth: { token },
    })

    const onNew = (payload: AppNotification) => {
      setNotifications((prev) => [payload, ...prev.filter((n) => n.id !== payload.id)].slice(0, 50))
      showNotificationToast(payload)
    }

    const onUnread = (payload: { unread?: number }) => {
      const n = typeof payload?.unread === "number" ? payload.unread : 0
      setUnreadCount(n)
    }

    s.on("notif:new", onNew)
    s.on("notif:unread_count", onUnread)

    return () => {
      s.off("notif:new", onNew)
      s.off("notif:unread_count", onUnread)
      s.disconnect()
    }
  }, [])

  const markAllAsRead = useCallback(async () => {
    if (!notifications.length || unreadCount === 0) return
    // Optimistic: mark all read locally.
    const nowIso = new Date().toISOString()
    setNotifications((prev) => prev.map((n) => ({ ...n, readAt: n.readAt ?? nowIso })))
    setUnreadCount(0)
    try {
      await markAllRead()
      // In case server recalculates differently, refresh count.
      const unread = await fetchUnreadCount()
      setUnreadCount(unread)
    } catch (err) {
      console.error("Failed to mark all as read", err)
    }
  }, [notifications.length, unreadCount])

  const value = useMemo(
    () => ({ notifications, unreadCount, isLoading, markAllAsRead, refreshNotifications }),
    [notifications, unreadCount, isLoading, markAllAsRead, refreshNotifications]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotification() {
  return useContext(NotificationContext)
}

function showNotificationToast(notification: AppNotification) {
  const payload = getNotificationToastPayload(notification)
  const actionPath = payload.actionPath

  toast(payload.title, {
    description: payload.description,
    action:
      actionPath && typeof window !== "undefined"
        ? {
            label: payload.actionLabel ?? "View",
            onClick: () => {
              window.location.href = actionPath
            },
          }
        : undefined,
  })
}