import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Body,
  Query,
  UseGuards,
} from "@nestjs/common"
import { StoriesService } from "./stories.service.js"
import { CreateStoryDto } from "./dto/create-story.dto.js"
import { SetStoryReactionDto } from "./dto/set-story-reaction.dto.js"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"

@Controller("stories")
export class StoriesController {
  constructor(private readonly stories: StoriesService) {}

  @Get("feed")
  feed(@CurrentUserId() viewerId?: string) {
    return this.stories.getFeed(viewerId)
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUserId() userId: string, @Body() dto: CreateStoryDto) {
    return this.stories.create(userId, dto)
  }

  @Post(":id/view")
  @UseGuards(JwtAuthGuard)
  markViewed(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.stories.markViewed(id, userId)
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
    return this.stories.listReactions(id, reaction)
  }

  @Get(":id/reaction")
  @UseGuards(JwtAuthGuard)
  getReaction(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.stories.getReactionStatus(id, userId)
  }

  @Post(":id/reaction")
  @UseGuards(JwtAuthGuard)
  setReaction(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: SetStoryReactionDto
  ) {
    return this.stories.setReaction(id, userId, dto.reaction)
  }

  @Get(":id/views")
  @UseGuards(JwtAuthGuard)
  listViewers(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.stories.listViewers(id, userId)
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number
  ) {
    return this.stories.remove(id, userId)
  }
}
