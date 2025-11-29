import { NextRequest } from "next/server"
import { Server as SocketIOServer } from "socket.io"
import { Server as HTTPServer } from "http"
import { auth } from "../../../lib/auth"
import { createMessage, markMessagesAsRead } from "../../../lib/db/chat-queries"
import { emitNotificationToUser } from "@/lib/realtime/notification-emitter"
import { createNotification } from "@/lib/db/notification-queries"
let io: SocketIOServer | null = null

//Map de luu userId -> socketId

const userSocketMap = new Map<string,string>()

export async function GET()
{
  // Next.js không hỗ trợ WebSocket trực tiếp trong route handler
  // Cần dùng custom server hoặc tách ra file riêng
  // Ở đây chỉ là ví dụ cấu trúc
  return new Response("Socket.IO server",{status:200})
}
//Khoi tao Socket.IO server
export function initializeSocketIO(server: HTTPServer)
{
  if(io) return io

  io = new SocketIOServer(server,{
    path:"/api/socket",
    addTrailingSlash: false,
    cors:{
      origin: process.env.BASE_URL || "http://localhost:3000",
      methods:["GET","POST"],
    },
  })
  io.use(async(socket,next)=>{
    try{
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

      if(!session?.user)
      {
        return next(new Error("Unauthorized"))
      }

      //Luu userId vao socket data
      socket.data.userId = session.user.id
      next()
    }catch(error)
    {
      next(new Error("Authentication Failed"))
    }
  })
  io.on("connection",(socket)=>{
    const userId = socket.data.userId

    //Luu mapping userId -> socketid 
    userSocketMap.set(userId,socket.id)
    console.log(`User ${userId} connected`)

    //Join vao room cua chinh user 
    socket.join(`user:${userId}`)

    //Event: Join conversation
    socket.on("join_conversation", async(conversationId: number) =>{
      socket.join(`conversation:${conversationId}`)
      console.log(`User ${userId} joined conversation ${conversationId}`)
    })
    //Event: Gui tin nhan 
    socket.on("send_message", async (data:{
      conversationId: number
      content: string
    })=>{
      try{
        //Luu vao database
        const message = await createMessage(
          data.conversationId,
          userId,
          data.content
        )
        if(!message){
          socket.emit("error",{message:"Failed to send message"})
          return 
        }
        //Emit den tat ca users trong conservation room 
        io?.to(`conversation:${data.conversationId}`).emit("new_message",{
          id: message.id,
          conversationId: message.conversationId,
          senderId: message.senderId,
          content: message.content,
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
          emitNotificationToUser(recipientId, notification)
        }
      }catch(error)
      {
        console.error("Error sending message: ",error)
        socket.emit("error",{message:"Error sending messafe"})
      }
    })
    //Even danh dau da doc
    socket.on("mark_read",async(conversationId: number)=>{
      try{
        await markMessagesAsRead(conversationId,userId)

        //Emit den tu user kia de ho biet tin nhan da duoc doc
        io?.to(`conversation:${conversationId}`).emit("message_read",{
          conversationId,
          readBy: userId
        })
      }catch(error)
      {
        console.error("Error marking as read: ",error)
        userSocketMap.delete(userId)
        console.log(`User ${userId} disconnected`)
      }
    })
  })
  return io
}
export function getIO(){
  return io
}