import type { Request } from "express"

export type SessionMeta = {
  ipAddress?: string | null
  userAgent?: string | null
}

export function getSessionMeta(req: Request): SessionMeta {
  return {
    ipAddress: req.ip ?? req.socket?.remoteAddress ?? null,
    userAgent: req.get("user-agent") ?? null,
  }
}
