import { Injectable } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { PrismaService } from "../prisma/prisma.service.js"

type AccessTokenPayload = { sub?: string; sid?: string; typ?: string }

export type AuthenticatedSession = { userId: string; sessionId: string }

const TOUCH_INTERVAL_MS = 5 * 60 * 1000

@Injectable()
export class SessionsService {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService
  ) {}

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
    const result = await this.prisma.session.updateMany({
      where: { id: sessionId, userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    return result.count > 0
  }

  async revokeOthers(userId: string, keepSessionId: string) {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null, id: { not: keepSessionId } },
      data: { revokedAt: new Date() },
    })
    return result.count
  }

  async revokeAll(userId: string) {
    const result = await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
    return result.count
  }
}