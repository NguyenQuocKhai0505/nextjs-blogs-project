import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"
import { UsersService } from "./users.service.js"
import { UpdateMeDto } from "./dto/update-me.dto.js"

@Controller()
export class UsersController {
  constructor(private readonly users: UsersService) {}

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@CurrentUserId() userId: string) {
    return this.users.getMe(userId)
  }

  @Get("me/mutual-friends")
  @UseGuards(JwtAuthGuard)
  mutualFriends(@CurrentUserId() userId: string, @Query("q") q?: string) {
    return this.users.listMutualFriends(userId, q ?? "")
  }

  @Patch("me")
  @UseGuards(JwtAuthGuard)
  updateMe(@CurrentUserId() userId: string, @Body() dto: UpdateMeDto) {
    return this.users.updateMe(userId, dto)
  }

  /** Must be registered before `users/:id` so "discover" is not parsed as an id. */
  @Get("users/discover")
  discoverUsers(
    @Query("q") q: string = "",
    @Query("limit") limitRaw: string = "80"
  ) {
    const limit = Number(limitRaw)
    return this.users.discoverUsers(q, Number.isFinite(limit) ? limit : 80)
  }

  @Get("users/:id/relationship")
  @UseGuards(JwtAuthGuard)
  relationship(@CurrentUserId() viewerId: string, @Param("id") targetId: string) {
    return this.users.getRelationship(viewerId, targetId)
  }

  @Post("users/:id/follow")
  @UseGuards(JwtAuthGuard)
  follow(@CurrentUserId() viewerId: string, @Param("id") targetId: string) {
    return this.users.follow(viewerId, targetId)
  }

  @Delete("users/:id/follow")
  @UseGuards(JwtAuthGuard)
  unfollow(@CurrentUserId() viewerId: string, @Param("id") targetId: string) {
    return this.users.unfollow(viewerId, targetId)
  }

  @Get("users/:id")
  user(@Param("id") id: string) {
    return this.users.getUserPublic(id)
  }

  // Public search, used by web chat UI.
  @Get("search-users")
  searchUsers(
    @Query("q") q: string = "",
    @Query("limit") limitRaw: string = "10"
  ) {
    const limit = Number(limitRaw)
    return this.users.searchUsers(q, Number.isFinite(limit) ? limit : 10)
  }
}

