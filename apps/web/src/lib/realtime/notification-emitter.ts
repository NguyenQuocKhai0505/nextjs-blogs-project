import { getIO } from "@/lib/realtime/socket-server";
import {
    NotificationWithActor,
    serializeNotification,
  } from "@/lib/db/notification-queries"

  export function emitNotificationToUser(
    userId:string,
    notification:NotificationWithActor | null
  ){
    if(!userId || !notification) return 
    const io = getIO()
    if(!io) return 
    io.to(`user:${userId}`).emit("notification", serializeNotification(notification))
  }