/**
 * New notifications system (Postgres/Prisma):
 * - Backend REST: /app-notifications
 * - Backend socket events: notif:new, notif:unread_count (namespace /ws)
 *
 * We keep the UI types here to avoid leaking Prisma types into the web app.
 */
export type AppNotificationType =
  | "POST_LIKED"
  | "POST_COMMENTED"
  | "FOLLOWED"
  | "SYSTEM"

export type AppNotificationTargetKind = "post" | "comment" | "user" | "system"

export type AppNotificationMeta = {
  postTitle?: string
  commentId?: number
  [key: string]: unknown
}

export type AppNotification = {
  id: number
  type: AppNotificationType | string
  targetKind: AppNotificationTargetKind | string
  targetId: string
  targetSlug?: string | null
  meta: AppNotificationMeta
  readAt?: string | null
  createdAt: string
  updatedAt: string
  actorCount: number
  actorIds: unknown
}

export type NotificationToastPayload = {
  title: string
  description?: string
  actionPath?: string
  actionLabel?: string
}

const notificationCopy: Record<string, string> = {
  POST_LIKED: "liked your post",
  POST_COMMENTED: "commented on your post",
  FOLLOWED: "started following you",
  SYSTEM: "sent you a notification",
}

export function isRead(notification: AppNotification): boolean {
  return !!notification.readAt
}

export function getNotificationText(notification: AppNotification): string {
  // We aggregate actors on backend; if you later enrich meta with actor snapshots,
  // you can render real names here. For now keep it simple and consistent.
  const who = notification.actorCount > 1 ? `${notification.actorCount} people` : "Someone"
  const actionText = notificationCopy[notification.type] ?? "triggered an activity"
  return `${who} ${actionText}`
}

export function getNotificationNavigatePath(notification: AppNotification): string {
  if (notification.targetKind === "post") {
    if (notification.targetSlug) return `/post/${notification.targetSlug}`
    return "/"
  }
  if (notification.targetKind === "user") {
    // targetId is the userId for FOLLOWED
    return `/profile/${notification.targetId}`
  }
  return "/"
}

export function getNotificationToastPayload(notification: AppNotification): NotificationToastPayload {
  const base = getNotificationText(notification)
  let description: string | undefined

  switch (notification.type) {
    case "POST_LIKED":
      description = "Open the post to see more details."
      break
    case "POST_COMMENTED":
      description = "Open the post to read the comment."
      break
    case "FOLLOWED":
      description = "Check their profile to follow back."
      break
    default:
      description = "See more details inside the app."
  }

  const actionPath = getNotificationNavigatePath(notification)

  return {
    title: base,
    description,
    actionPath,
    actionLabel: "View",
  }
}

