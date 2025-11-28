import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import {
  getNotifications,
  getUnreadNotifications,
  markNotificationsAsRead,
  serializeNotification,
} from "@/lib/db/notification-queries"
export async function GET(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  })
  if (!session?.user) {
    return NextResponse.json({ notifications: [] })
  }

  const notifications = await getNotifications(session.user.id)
  return NextResponse.json({
    notifications: notifications.map(serializeNotification),
  })
}

export async function PATCH(req: NextRequest) {
  const session = await auth.api.getSession({
    headers: req.headers,
  })
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const body = await req.json().catch(() => ({}))
  let ids = Array.isArray(body?.ids)
    ? body.ids.filter((id: unknown): id is number => typeof id === "number")
    : []

  if (!ids.length) {
    const unread = await getUnreadNotifications(session.user.id, 100)
    ids = unread.map(n => n.id)
  }

  if (ids.length) {
    await markNotificationsAsRead(session.user.id, ids)
  }

  return NextResponse.json({ success: true })
}