import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly jwt: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<Request & { userId?: string }>()
    const header = (req as any).headers?.authorization as string | undefined
    const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : null
    if (!token) throw new UnauthorizedException("Missing token")

    try {
      const payload = this.jwt.verify(token, {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret",
      }) as { sub?: string; typ?: string }
      if (!payload?.sub) throw new UnauthorizedException("Invalid token")
      ;(req as any).userId = payload.sub
      return true
    } catch {
      throw new UnauthorizedException("Invalid token")
    }
  }
}

