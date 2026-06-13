/**
 * New notifications system (Postgres/Prisma):
 * - Backend REST: /app-notifications
 * - Backend socket events: notif:new, notif:unread_count (namespace /ws)
 */

export type AppNotificationType =
  | "POST_LIKED"
  | "POST_COMMENTED"
  | "FOLLOWED"
  | "SYSTEM"

export type AppNotificationTargetKind = "post" | "comment" | "user" | "system"

export type NotificationActor = {
  id: string
  name: string
  avatarUrl: string | null
}

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
  actorIds: string[]
  actors?: NotificationActor[]
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

export function parseActorIds(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.filter((id): id is string => typeof id === "string" && id.length > 0)
  }
  return []
}

export function getPrimaryActor(notification: AppNotification): NotificationActor | null {
  if (notification.actors?.[0]) return notification.actors[0]
  const firstId = notification.actorIds?.[0] ?? parseActorIds(notification.actorIds as unknown)[0]
  if (!firstId) return null
  return { id: firstId, name: "Someone", avatarUrl: null }
}

export function isRead(notification: AppNotification): boolean {
  return !!notification.readAt
}

export function getNotificationText(notification: AppNotification): string {
  const primary = getPrimaryActor(notification)
  const who =
    notification.actorCount > 1
      ? `${primary?.name ?? "Someone"} and ${notification.actorCount - 1} others`
      : (primary?.name ?? "Someone")
  const actionText = notificationCopy[notification.type] ?? "triggered an activity"
  return `${who} ${actionText}`
}

/** Navigate to the actor's profile (who performed the action). */
export function getNotificationNavigatePath(notification: AppNotification): string {
  const actor = getPrimaryActor(notification)
  if (actor?.id) return `/profile/${actor.id}`
  if (notification.targetKind === "post" && notification.targetSlug) {
    return `/post/${notification.targetSlug}`
  }
  return "/"
}

export function getNotificationToastPayload(notification: AppNotification): NotificationToastPayload {
  const base = getNotificationText(notification)
  let description: string | undefined

  switch (notification.type) {
    case "POST_LIKED":
      description = "View their profile."
      break
    case "POST_COMMENTED":
      description = "View their profile."
      break
    case "FOLLOWED":
      description = "View their profile."
      break
    default:
      description = "See more details inside the app."
  }

  const actionPath = getNotificationNavigatePath(notification)

  return {
    title: base,
    description,
    actionPath,
    actionLabel: "View profile",
  }
}
