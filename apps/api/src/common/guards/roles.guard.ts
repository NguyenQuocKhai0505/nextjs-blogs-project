import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common"
import { Reflector } from "@nestjs/core"
import { UserRole } from "@prisma/client"

import { PrismaService } from "../../prisma/prisma.service.js"
import { ROLES_KEY } from "../decorators/roles.decorator.js"

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly prisma: PrismaService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles || requiredRoles.length === 0) {
      return true
    }

    const req = context.switchToHttp().getRequest<{
      userId?: string
      userRole?: UserRole
    }>()
    const userId = req.userId
    if (!userId) {
      throw new UnauthorizedException("Missing user")
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })

    if (!user) {
      throw new UnauthorizedException("User not found")
    }

    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException("Admin only")
    }

    req.userRole = user.role
    return true
  }
}
