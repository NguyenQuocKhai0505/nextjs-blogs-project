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
import { ReelsService } from "./reel.service.js"
import { CreateReelDto } from "./dto/create-reel.dto.js"
import { SetReelReactionDto } from "./dto/set-reel.reaction.dto.js"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"

@Controller("reels")
export class ReelsController {
  constructor(private readonly reels: ReelsService) {}

  @Get("feed")
  feed(@Query("cursor") cursorRaw?: string, @Query("take") takeRaw?: string) {
    const cursor = Number(cursorRaw)
    const take = Number(takeRaw)
    return this.reels.getFeed({
      cursor: Number.isFinite(cursor) ? cursor : undefined,
      take: Number.isFinite(take) ? take : undefined,
    })
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUserId() userId: string, @Body() dto: CreateReelDto) {
    return this.reels.createReel(userId, dto)
  }

  @Get(":id/reactions")
  listReactions(
    @Param("id", ParseIntPipe) id: number,
    @Query("reaction") reactionRaw?: string
  ) {
    const allowed = ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"] as const
    const reaction = reactionRaw && (allowed as readonly string[]).includes(reactionRaw)
      ? (reactionRaw as (typeof allowed)[number])
      : undefined
    return this.reels.listReactions(id, reaction)
  }

  @Get(":id/reaction")
  @UseGuards(JwtAuthGuard)
  getReaction(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.reels.getReactionStatus(id, userId)
  }

  @Post(":id/reaction")
  @UseGuards(JwtAuthGuard)
  setReaction(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: SetReelReactionDto
  ) {
    return this.reels.setReaction(id, userId, dto.reaction)
  }

  @Post(":id/view")
  @UseGuards(JwtAuthGuard)
  markViewed(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.reels.markViewed(id, userId)
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.reels.remove(id, userId)
  }
}
