import { Injectable } from "@nestjs/common"
import type { Server } from "socket.io"

@Injectable()
export class ChatEvents {
  private io: Server | null = null

  setServer(io: Server) {
    this.io = io
  }

  messageCreated(conversationId: number, payload: unknown) {
    this.io?.to(`conv:${conversationId}`).emit("message:created", payload)
  }
}

