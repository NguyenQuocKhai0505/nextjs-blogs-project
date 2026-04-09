import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets"
import { JwtService } from "@nestjs/jwt"
import type { Server, Socket } from "socket.io"
import { ChatEvents } from "./chat.events.js"

@WebSocketGateway({
  cors: {
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  },
})
export class ChatGateway {
  @WebSocketServer()
  server!: Server

  constructor(
    private readonly jwt: JwtService,
    private readonly events: ChatEvents
  ) {}

  afterInit() {
    this.events.setServer(this.server)
  }

  handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined)
    if (!token) return client.disconnect(true)

    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret",
      }) as { sub?: string; typ?: string }
      if (!payload?.sub || payload.typ !== "access") return client.disconnect(true)
      client.data.userId = payload.sub
      client.join(`user:${payload.sub}`)
    } catch {
      client.disconnect(true)
    }
  }

  @SubscribeMessage("conversations:join")
  joinConversations(
    @MessageBody() body: { conversationIds?: number[] },
    @ConnectedSocket() client: Socket
  ) {
    const ids = Array.isArray(body?.conversationIds) ? body.conversationIds : []
    for (const id of ids) {
      if (typeof id === "number" && Number.isFinite(id) && id > 0) {
        client.join(`conv:${id}`)
      }
    }
    return { ok: true }
  }
}

