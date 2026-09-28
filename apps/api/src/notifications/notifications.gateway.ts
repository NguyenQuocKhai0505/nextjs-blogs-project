import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io";
import { SessionsService } from "../sessions/session.service.js";

@WebSocketGateway({
  namespace: "/ws",
  cors: { origin: true, credentials: true },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private online = new Map<string, Set<string>>(); // userId -> socketIds

  constructor(private readonly sessions: SessionsService) {}

  afterInit() {
    this.sessions.onSessionsRevoked((sessionIds) => {
      for (const id of sessionIds) {
        this.server.in(`session:${id}`).disconnectSockets(true);
      }
    });
  }

  private extractToken(socket: Socket): string | null {
    const t1 = (socket.handshake.auth as any)?.token;
    if (typeof t1 === "string" && t1) return t1;

    const hdr = socket.handshake.headers?.authorization;
    if (typeof hdr === "string" && hdr.startsWith("Bearer ")) return hdr.slice(7);

    return null;
  }

  async handleConnection(socket: Socket) {
    const token = this.extractToken(socket);
    if (!token) return socket.disconnect(true);

    const auth = await this.sessions.verifyAccessToken(token);
    if (!auth) return socket.disconnect(true);

    socket.data.userId = auth.userId;
    socket.data.sessionId = auth.sessionId;
    socket.join(`user:${auth.userId}`);
    socket.join(`session:${auth.sessionId}`);

    const set = this.online.get(auth.userId) ?? new Set<string>();
    set.add(socket.id);
    this.online.set(auth.userId, set);
  }

  async handleDisconnect(socket: Socket) {
    const userId = socket.data.userId as string | undefined;
    if (!userId) return;

    const set = this.online.get(userId);
    if (!set) return;

    set.delete(socket.id);
    if (set.size === 0) this.online.delete(userId);
  }

  emitNewNotification(recipientId: string, payload: unknown) {
    this.server.to(`user:${recipientId}`).emit("notif:new", payload);
  }

  emitUnreadCount(recipientId: string, unread: number) {
    this.server.to(`user:${recipientId}`).emit("notif:unread_count", { unread });
  }
}
