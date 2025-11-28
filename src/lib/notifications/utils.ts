export type ClientNotification = {
  id: number
  type: string
  meta: Record<string, any>
  read: boolean
  createdAt: string
  actor: { id: string; name: string; avatar?: string | null }
}

export type NotificationToastPayload = {
  title: string
  description?: string
  actionPath?: string
  actionLabel?: string
}

const notificationCopy: Record<string, string> = {
  like: "liked your post",
  comment: "commented on your post",
  follow: "started following you",
  message: "sent you a message",
}

export function getNotificationText(notification: ClientNotification): string {
  const actorName = notification.actor?.name ?? "Someone"
  const actionText = notificationCopy[notification.type] ?? "triggered an activity"
  return `${actorName} ${actionText}`
}

export function getNotificationNavigatePath(notification: ClientNotification): string {
  switch (notification.type) {
    case "like":
    case "comment":
      if (notification.meta?.slug) return `/post/${notification.meta.slug}`
      if (notification.meta?.postId) return `/post/${notification.meta.postId}`
      return "/"
    case "follow":
      return `/profile/${notification.actor.id}`
    case "message":
      if (notification.meta?.conversationId) return `/contact?conversation=${notification.meta.conversationId}`
      return `/contact?user=${notification.actor.id}`
    default:
      return "/"
  }
}

export function getNotificationToastPayload(notification: ClientNotification): NotificationToastPayload {
  const base = getNotificationText(notification)
  let description: string | undefined

  switch (notification.type) {
    case "like":
      description = "Open the post to see more details."
      break
    case "comment":
      description = notification.meta?.commentPreview ?? "View the conversation to read the comment."
      break
    case "follow":
      description = "Check their profile to follow back."
      break
    case "message":
      description = notification.meta?.messagePreview ?? "Jump into the chat to continue the conversation."
      break
    default:
      description = "See more details inside the app."
  }

  const actionPath = getNotificationNavigatePath(notification)

  return {
    title: base,
    description,
    actionPath,
    actionLabel: notification.type === "message" ? "Reply" : "View",
  }
}

