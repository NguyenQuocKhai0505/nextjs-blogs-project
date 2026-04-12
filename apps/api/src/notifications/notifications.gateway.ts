import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";

type JwtPayload = { sub?: string; userId?: string; id?: string; typ?: string };

@WebSocketGateway({
  namespace: "/ws",
  cors: { origin: true, credentials: true },
})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private online = new Map<string, Set<string>>(); // userId -> socketIds

  constructor(private readonly jwt: JwtService) {}
  
    private extractToken(socket: Socket): string | null {
      const t1 = (socket.handshake.auth as any)?.token;
      if (typeof t1 === "string" && t1) return t1;
  
      const hdr = socket.handshake.headers?.authorization;
      if (typeof hdr === "string" && hdr.startsWith("Bearer ")) return hdr.slice(7);
  
      return null;
    }
  
  private getUserIdFromToken(token: string): string | null {
    // Match how `JwtAuthGuard` + `ChatGateway` verify access tokens in this repo.
    try {
      const payload = this.jwt.verify<JwtPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret",
      });
      const uid = payload.sub || payload.userId || payload.id || null;
      if (!uid) return null;
      if (payload.typ && payload.typ !== "access") return null;
      return uid;
    } catch {
      return null;
    }
  }
  
  async handleConnection(socket: Socket) {
    const token = this.extractToken(socket);
    if (!token) return socket.disconnect(true);

    const userId = this.getUserIdFromToken(token);
    if (!userId) return socket.disconnect(true);

    (socket.data as any).userId = userId;

    socket.join(`user:${userId}`);

    const set = this.online.get(userId) ?? new Set<string>();
    set.add(socket.id);
    this.online.set(userId, set);
  }

  async handleDisconnect(socket: Socket) {
    const userId = (socket.data as any).userId as string | undefined;
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