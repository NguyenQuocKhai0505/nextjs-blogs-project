import { Server as SocketIOServer } from "socket.io"
import { Server as HTTPServer } from "http"
import { auth } from "../../lib/auth"
import { createMessage, deleteMessage, markMessagesAsRead } from "../../lib/db/chat-queries"
import { createNotification, serializeNotification } from "@/lib/db/notification-queries"

let io: SocketIOServer | null = null

//Map de luu userId -> socketId
const userSocketMap = new Map<string, string>()

//Khoi tao Socket.IO server
export function initializeSocketIO(server: HTTPServer) {
  if (io) return io

  io = new SocketIOServer(server, {
    path: "/api/socket",
    addTrailingSlash: false,
    cors: {
      // Cho phép cùng origin (Render) và cả localhost khi dev
      origin: process.env.BASE_URL || "*",
      methods: ["GET", "POST"],
    },
  })
  io.use(async (socket, next) => {
    try {
      //Lay session tu cookie hoac query
      const headers = new Headers()
      Object.entries(socket.handshake.headers).forEach(([key, value]) => {
        if (Array.isArray(value)) {
          headers.append(key, value.join(","))
        } else if (value) {
          headers.append(key, value)
        }
      })

      const session = await auth.api.getSession({
        headers,
      })

      if (!session?.user) {
        return next(new Error("Unauthorized"))
      }

      //Luu userId vao socket data
      socket.data.userId = session.user.id
      next()
    } catch {
      next(new Error("Authentication Failed"))
    }
  })
  
  io.on("connection", (socket) => {
    const userId = socket.data.userId

    //Luu mapping userId -> socketid
    userSocketMap.set(userId, socket.id)
    console.log(`User ${userId} connected`)

    //Join vao room cua chinh user
    socket.join(`user:${userId}`)

    //Event: Join conversation
    socket.on("join_conversation", async (conversationId: number) => {
      socket.join(`conversation:${conversationId}`)
      console.log(`User ${userId} joined conversation ${conversationId}`)
    })
    //Event: Gui tin nhan
    socket.on("send_message", async (data: {
      conversationId: number
      content?: string
      imageUrl?:string
      videoUrl?: string
    }) => {
      try {
        const hasText = data.content && data.content.trim().length>0
        const hasImage = !!data.imageUrl
        const hasVideo = !!data.videoUrl
        if(!hasText && !hasImage && !hasVideo)
        {
          socket.emit("error",{message:"Empty Message"})
          return
        }
        //Luu vao database
        const message = await createMessage(
          data.conversationId,
          userId,
          {
            content: hasText ? data.content!.trim() : undefined,
            imageUrl: data.imageUrl,
            videoUrl: data.videoUrl
          }
        )
        if (!message) {
          socket.emit("error", { message: "Failed to send message" })
          return
        }
        //Emit den tat ca users trong conservation room
        io?.to(`conversation:${data.conversationId}`).emit("new_message", {
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
          imageUrl: message.imageUrl,
          videoUrl: message.videoUrl, 
          read: message.read,
          createdAt: message.createdAt,
          sender: message.sender
        })

        const recipientId =
          message.conversation?.user1Id === userId
            ? message.conversation?.user2Id
            : message.conversation?.user1Id

        if (recipientId && recipientId !== userId) {
          const notification = await createNotification({
            userId: recipientId,
            actorId: userId,
            type: "message",
            meta: { conversationId: data.conversationId },
          })
          if (notification) {
            io?.to(`user:${recipientId}`).emit("notification", serializeNotification(notification))
          }
        }
      } catch (error) {
        console.error("Error sending message: ", error)
        socket.emit("error", { message: "Error sending messafe" })
      }
    })

    // Event: Xoá message
    socket.on("delete_message", async (data: { messageId: number }) => {
      try {
        const result = await deleteMessage(data.messageId, userId)

        if (result === null || result === false) {
          return
        }

        io?.to(`conversation:${result.conversationId}`).emit("message_deleted", {
          conversationId: result.conversationId,
          messageId: data.messageId,
        })
      } catch (error) {
        console.error("Error deleting message: ", error)
      }
    })
    //Even danh dau da doc
    socket.on("mark_read", async (conversationId: number) => {
      try {
        await markMessagesAsRead(conversationId, userId)

        //Emit den tu user kia de ho biet tin nhan da duoc doc
        io?.to(`conversation:${conversationId}`).emit("message_read", {
          conversationId,
          readBy: userId
        })
      } catch (error) {
        console.error("Error marking as read: ", error)
        userSocketMap.delete(userId)
        console.log(`User ${userId} disconnected`)
      }
    })

    // ====== POST ROOMS (LIKE / COMMENT REALTIME) ======
    // Client join vao room cua 1 post cu the
    socket.on("join_post", (postId: number) => {
      if (!postId) return
      socket.join(`post:${postId}`)
      console.log(`User ${userId} joined post room ${postId}`)
    })

    // Client roi khoi room cua post khi khong con xem nua
    socket.on("leave_post", (postId: number) => {
      if (!postId) return
      socket.leave(`post:${postId}`)
      console.log(`User ${userId} left post room ${postId}`)
    })
  })
  return io
}

export function getIO() {
  return io
}

