import { Injectable, NestMiddleware } from "@nestjs/common"
import type { NextFunction, Request, Response } from "express"
import { SessionsService } from "../../sessions/session.service.js"

/**
 * Attaches `userId` to the request when a valid access JWT is present.
 * Used before global rate limiting so throttler can key by user instead of only IP.
 * Invalid/expired tokens are ignored (no throw) — route guards still enforce auth where needed.
 */
@Injectable()
export class OptionalJwtUserMiddleware implements NestMiddleware {
  constructor(private readonly sessions: SessionsService) {}

  async use(req: Request, _res: Response, next: NextFunction) {
    const header = req.headers.authorization
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null
    if (token) {
      try {
        const auth = await this.sessions.verifyAccessToken(token)
        if (auth) {
          ;(req as Request & { userId?: string }).userId = auth.userId
        }
      } catch {
        // Treat lookup failures as anonymous; route guards still enforce auth.
      }
    }
    next()
  }
}