import { db } from "."
import { notifications, users } from "./schema"
import { eq, and, desc, inArray } from "drizzle-orm"

export type NotificationType = "like" | "comment" | "follow" | "message"

export type NotificationWithActor = typeof notifications.$inferSelect & {
    actor: Pick<typeof users.$inferSelect, "id" | "name" | "avatar">
}

export interface CreateNotificationInput{
    userId: string // nguoi nhan
    actorId: string //nguoi gay ra su kien
    type: NotificationType
    meta?: Record<string,unknown>
}
export function serializeNotification(notification: NotificationWithActor) {
    return {
      id: notification.id,
      type: notification.type,
      meta: notification.meta ?? {},
      read: notification.read,
      createdAt: notification.createdAt instanceof Date
        ? notification.createdAt.toISOString()
        : notification.createdAt,
      actor: {
        id: notification.actor.id,
        name: notification.actor.name,
        avatar: notification.actor.avatar,
      },
    }
  }
  export async function createNotification({
    userId,
    actorId,
    type,
    meta = {},
  }: CreateNotificationInput): Promise<NotificationWithActor | null> {
    if (!userId || !actorId || userId === actorId) return null

    const [inserted] = await db
      .insert(notifications)
      .values({ userId, actorId, type, meta })
      .returning()

    if (!inserted) return null

    const fullNotification = await db.query.notifications.findFirst({
      where: eq(notifications.id, inserted.id),
      with: { actor: true },
    })

    return fullNotification as NotificationWithActor | null
  }
export async function getNotifications(
  userId: string,
  limit = 50
): Promise<NotificationWithActor[]> {
  return db.query.notifications.findMany({
    where: eq(notifications.userId, userId),
    orderBy: [desc(notifications.createdAt)],
    with: { actor: true },
    limit,
  }) as Promise<NotificationWithActor[]>
}

export async function getUnreadNotifications(
  userId: string,
  limit = 20
): Promise<NotificationWithActor[]> {
  return db.query.notifications.findMany({
    where: and(eq(notifications.userId, userId), eq(notifications.read, false)),
    orderBy: [desc(notifications.createdAt)],
    with: { actor: true },
    limit,
  }) as Promise<NotificationWithActor[]>
}
export async function markNotificationsAsRead(userId: string, ids: number[]){
    if(!ids?.length) return 
    await db.update(notifications).set({read:true})
    .where(and(eq(notifications.userId,userId),inArray(notifications.id,ids)))
}