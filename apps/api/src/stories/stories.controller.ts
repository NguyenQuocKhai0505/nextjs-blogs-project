import {
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Body,
  UseGuards,
} from "@nestjs/common"
import { StoriesService } from "./stories.service.js"
import { CreateStoryDto } from "./dto/create-story.dto.js"
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
