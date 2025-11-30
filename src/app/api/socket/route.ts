import { NextResponse } from "next/server"

export async function GET() {
  // Next.js không hỗ trợ WebSocket trực tiếp trong route handler
  // Socket.IO được khởi tạo trong custom server (server.js)
  // Route này chỉ để trả về thông tin về Socket.IO server
  return NextResponse.json({ 
    message: "Socket.IO server is running",
    path: "/api/socket"
  })
}