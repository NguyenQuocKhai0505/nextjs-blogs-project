import { SetMetadata } from "@nestjs/common"
import { UserRole } from "@prisma/client"

export const ROLES_KEY = "roles"

/** Restrict a route/controller to one or more roles (checked against DB). */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)
