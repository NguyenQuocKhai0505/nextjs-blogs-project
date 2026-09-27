import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common"
import type { Request } from "express"
import { SessionsService } from "../../sessions/session.service.js"

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly sessions: SessionsService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context
      .switchToHttp()
      .getRequest<Request & { userId?: string; sessionId?: string }>()
    const header = req.headers.authorization
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length).trim() : null
    if (!token) throw new UnauthorizedException("Missing token")

    const auth = await this.sessions.verifyAccessToken(token)
    if (!auth) throw new UnauthorizedException("Session expired. Please sign in again.")

    req.userId = auth.userId
    req.sessionId = auth.sessionId
    return true
  }
}