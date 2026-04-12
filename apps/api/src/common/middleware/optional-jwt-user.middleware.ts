import { Injectable, NestMiddleware } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import type { NextFunction, Request, Response } from "express"

/**
 * Attaches `userId` to the request when a valid access JWT is present.
 * Used before global rate limiting so throttler can key by user instead of only IP.
 * Invalid/expired tokens are ignored (no throw) — route guards still enforce auth where needed.
 */
@Injectable()
export class OptionalJwtUserMiddleware implements NestMiddleware {
  constructor(private readonly jwt: JwtService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null
    if (!token) {
      next()
      return
    }
    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret",
      }) as { sub?: string; typ?: string }
      if (payload?.sub && (!payload.typ || payload.typ === "access")) {
        ;(req as Request & { userId?: string }).userId = payload.sub
      }
    } catch {
      // optional: leave userId unset
    }
    next()
  }
}
