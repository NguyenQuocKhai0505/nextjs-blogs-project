import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets"
import { JwtService } from "@nestjs/jwt"
import type { Server, Socket } from "socket.io"
import { ChatEvents } from "./chat.events.js"
import { PrismaService } from "../prisma/prisma.service.js"
import { webOrigin } from "../common/web-origin.js"

@WebSocketGateway({
  cors: {
    origin: webOrigin(),
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  constructor(
    private readonly jwt: JwtService,
    private readonly events: ChatEvents,
    private readonly prisma: PrismaService
  ) {}

  afterInit() {
    this.events.setServer(this.server)
  }

  private touchPresence(userId: string) {
    void this.prisma.user
      .update({
        where: { id: userId },
        data: { lastSeenAt: new Date() },
      })
      .catch(() => {
        /* ignore */
      })
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
      this.touchPresence(payload.sub)
    } catch {
      client.disconnect(true)
    }
  }

  handleDisconnect(client: Socket) {
    const uid = client.data?.userId as string | undefined
    if (uid) this.touchPresence(uid)
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

  @SubscribeMessage("presence:ping")
  presencePing(@ConnectedSocket() client: Socket) {
    const uid = client.data?.userId as string | undefined
    if (uid) this.touchPresence(uid)
    return { ok: true as const }
  }
}
