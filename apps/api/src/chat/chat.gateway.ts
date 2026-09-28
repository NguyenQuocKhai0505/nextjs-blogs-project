import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets"
import type { Server, Socket } from "socket.io"
import { ChatEvents } from "./chat.events.js"
import { PrismaService } from "../prisma/prisma.service.js"
import { SessionsService } from "../sessions/session.service.js"
@WebSocketGateway({
  cors: {
    origin: process.env.WEB_URL ?? "http://localhost:3000",
    credentials: true,
  },
})
export class ChatGateway implements OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server

  constructor(
    private readonly events: ChatEvents,
    private readonly prisma: PrismaService,
    private readonly sessions: SessionsService
  ) {}

  afterInit() {
    this.events.setServer(this.server)
    this.sessions.onSessionsRevoked((sessionIds) => {
      for (const id of sessionIds) {
        this.server.in(`session:${id}`).disconnectSockets(true)
      }
    })
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

  async handleConnection(client: Socket) {
    const token =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined)
    if (!token) return client.disconnect(true)

    const auth = await this.sessions.verifyAccessToken(token)
    if (!auth) return client.disconnect(true)

    client.data.userId = auth.userId
    client.data.sessionId = auth.sessionId
    client.join(`user:${auth.userId}`)
    client.join(`session:${auth.sessionId}`)
    this.touchPresence(auth.userId)
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
