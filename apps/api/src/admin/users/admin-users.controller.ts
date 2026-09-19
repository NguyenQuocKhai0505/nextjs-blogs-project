import { Controller, Get, Param, Query, UseGuards } from "@nestjs/common"
import { UserRole } from "@prisma/client"
import { Throttle } from "@nestjs/throttler"
import { Roles } from "../../common/decorators/roles.decorator.js"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js"
import { RolesGuard } from "../../common/guards/roles.guard.js"
import { AdminUsersService } from "./admin-users.service.js"

@Controller("admin/users")
@UseGuards(JwtAuthGuard,RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminUsersController{
    constructor(private readonly adminUsersService: AdminUsersService){}

    @Get()
    list(
        @Query("q") q?:string,
        @Query("role") role?:string,
        @Query("page") page?:string,
        @Query("limit") limit?:string,
    ){
        return this.adminUsersService.listUser({
            q,
            role,
            page: page ? Number(page) : undefined,
            limit: limit ? Number(limit) : undefined,
        })
    }

    @Get(":userId")
    getOne(@Param("userId") userId: string) {
      return this.adminUsersService.getUser(userId)
    }
}