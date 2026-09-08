import { Controller, Get, UseGuards } from "@nestjs/common"
import { UserRole } from "@prisma/client"
import { Throttle } from "@nestjs/throttler"

import { Roles } from "../../common/decorators/roles.decorator.js"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js"
import { RolesGuard } from "../../common/guards/roles.guard.js"
import { AdminDashboardService } from "./admin-dashboard.service.js"

@Controller("admin")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Throttle({ default: { ttl: 60_000, limit: 60 } })
export class AdminDashboardController {
  constructor(private readonly dashboard: AdminDashboardService) {}

  @Get("dashboard")
  getDashboard() {
    return this.dashboard.dashboard()
  }
}
