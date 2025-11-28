"use client"

import { createContext, useContext, useEffect, useMemo, useState, useCallback } from "react"
import { toast } from "sonner"
import { useSocket } from "@/contexts/socket-context"
import {
  ClientNotification,
  getNotificationToastPayload,
} from "@/lib/notifications/utils"

type NotificationContextValue = {
  notifications: ClientNotification[]
  unreadCount: number
  isLoading: boolean
  markAllAsRead: () => Promise<void>
  markAsRead: (ids: number[]) => Promise<void>
  refreshNotifications: () => Promise<void>
}

const NotificationContext = createContext<NotificationContextValue>({
  notifications: [],
  unreadCount: 0,
  isLoading: true,
  markAllAsRead: async () => {},
  markAsRead: async () => {},
  refreshNotifications: async () => {},
})

async function fetchNotifications() {
  const res = await fetch("/api/notifications", {
    cache: "no-store",
    headers: {
      "Content-Type": "application/json",
    },
  })
  if (!res.ok) return []
  const data = await res.json()
  return data?.notifications ?? []
}

async function patchNotifications(ids?: number[]) {
  await fetch("/api/notifications", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(ids ? { ids } : {}),
  })
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket()
  const [notifications, setNotifications] = useState<ClientNotification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isLoading, setIsLoading] = useState(true)

  const refreshNotifications = useCallback(async () => {
    setIsLoading(true)
    try {
      const data = await fetchNotifications()
      setNotifications(data)
      setUnreadCount(data.filter((n: ClientNotification) => !n.read).length)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshNotifications()
  }, [refreshNotifications])

  useEffect(() => {
    if (!socket) return

    const handleNotification = (payload: ClientNotification) => {
      setNotifications(prev => [payload, ...prev.filter(n => n.id !== payload.id)].slice(0, 50))
      if (!payload.read) {
        setUnreadCount(count => count + 1)
      }
      showNotificationToast(payload)
    }

    socket.on("notification", handleNotification)
    return () => {
      socket.off("notification", handleNotification)
    }
  }, [socket])

  const markAllAsRead = useCallback(async () => {
    if (!notifications.length || unreadCount === 0) return
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    setUnreadCount(0)
    try {
      await patchNotifications()
    } catch (err) {
      console.error("Failed to mark all as read", err)
    }
  }, [notifications.length, unreadCount])

  const markAsRead = useCallback(async (ids: number[]) => {
    if (!ids.length) return
    const targetIds = new Set(ids)
    setNotifications(prev => {
      let newlyRead = 0
      const next = prev.map(n => {
        if (targetIds.has(n.id) && !n.read) {
          newlyRead++
          return { ...n, read: true }
        }
        return n
      })
      if (newlyRead) setUnreadCount(count => Math.max(0, count - newlyRead))
      return next
    })
    try {
      await patchNotifications(ids)
    } catch (err) {
      console.error("Failed to mark as read", err)
    }
  }, [])

  const value = useMemo(
    () => ({ notifications, unreadCount, isLoading, markAllAsRead, markAsRead, refreshNotifications }),
    [notifications, unreadCount, isLoading, markAllAsRead, markAsRead, refreshNotifications]
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export function useNotification() {
  return useContext(NotificationContext)
}

function showNotificationToast(notification: ClientNotification) {
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