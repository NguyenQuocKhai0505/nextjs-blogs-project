import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common"
import { UserRole } from "@prisma/client"
import { Throttle } from "@nestjs/throttler"
import { IsOptional, IsString, MaxLength } from "class-validator"

import { CurrentUserId } from "../../common/decorators/current-user-id.decorator.js"
import { Roles } from "../../common/decorators/roles.decorator.js"
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard.js"
import { RolesGuard } from "../../common/guards/roles.guard.js"
import { AdminPostsService } from "./admin-posts.service.js"

class WarnUserDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  message?: string
}

@Controller("admin/posts")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@Throttle({ default: { ttl: 60_000, limit: 60 } })
export class AdminPostsController {
  constructor(private readonly adminPosts: AdminPostsService) {}

  @Get("by-user")
  listByUser(
    @Query("q") q?: string,
    @Query("page") page?: string,
    @Query("limit") limit?: string
  ) {
    return this.adminPosts.listAuthors({
      q,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    })
  }

  @Get("by-user/:userId")
  getAuthor(@Param("userId") userId: string) {
    return this.adminPosts.getAuthorPosts(userId)
  }

  @Post("by-user/:userId/warn")
  warnUser(
    @CurrentUserId() adminId: string,
    @Param("userId") userId: string,
    @Body() dto: WarnUserDto
  ) {
    return this.adminPosts.warnUser(adminId, userId, dto.message)
  }

  @Delete(":id")
  removePost(@Param("id", ParseIntPipe) id: number) {
    return this.adminPosts.removePost(id)
  }
}
