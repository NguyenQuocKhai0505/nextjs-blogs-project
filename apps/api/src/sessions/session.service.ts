import { EventEmitter } from "node:events"
import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import type { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"

type AccessTokenPayload = { sub?: string; sid?: string; typ?: string }

export type AuthenticatedSession = { userId: string; sessionId: string }

type RevokedListener = (sessionIds: string[]) => void

const TOUCH_INTERVAL_MS = 5 * 60 * 1000

@Injectable()
export class SessionsService {
  private readonly revokedEvents = new EventEmitter()

  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService
  ) {}

  onSessionsRevoked(listener: RevokedListener) {
    this.revokedEvents.on("revoked", listener)
  }

  async verifyAccessToken(token: string): Promise<AuthenticatedSession | null> {
    let payload: AccessTokenPayload
    try {
      payload = this.jwt.verify<AccessTokenPayload>(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret",
      })
    } catch {
      return null
    }

    if (!payload.sub || !payload.sid || payload.typ !== "access") return null

    const session = await this.prisma.session.findUnique({
      where: { id: payload.sid },
      select: { userId: true, revokedAt: true, expiresAt: true, lastActiveAt: true },
    })
    if (!session) return null
    if (session.userId !== payload.sub) return null
    if (session.revokedAt) return null
    if (session.expiresAt <= new Date()) return null

    if (Date.now() - session.lastActiveAt.getTime() > TOUCH_INTERVAL_MS) {
      void this.prisma.session
        .update({ where: { id: payload.sid }, data: { lastActiveAt: new Date() } })
        .catch(() => {})
    }

    return { userId: payload.sub, sessionId: payload.sid }
  }

  async listActive(userId: string, currentSessionId: string) {
    const rows = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: "desc" },
      select: {
        id: true,
        ipAddress: true,
        userAgent: true,
        createdAt: true,
        lastActiveAt: true,
      },
    })
    return rows.map((row) => ({ ...row, current: row.id === currentSessionId }))
  }

  async revoke(userId: string, sessionId: string) {
    const count = await this.revokeWhere({ id: sessionId, userId })
    return count > 0
  }

  async revokeOthers(userId: string, keepSessionId: string) {
    return this.revokeWhere({ userId, id: { not: keepSessionId } })
  }

  async revokeAll(userId: string) {
    return this.revokeWhere({ userId })
  }

  private async revokeWhere(where: Prisma.SessionWhereInput) {
    const rows = await this.prisma.session.findMany({
      where: { ...where, revokedAt: null },
      select: { id: true },
    })
    if (rows.length === 0) return 0

    const ids = rows.map((row) => row.id)
    await this.prisma.session.updateMany({
      where: { id: { in: ids }, revokedAt: null },
      data: { revokedAt: new Date() },
    })

    this.revokedEvents.emit("revoked", ids)
    return ids.length
  }
}
