import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post as HttpPost,
  UseGuards,
} from "@nestjs/common"
import { PostsService } from "./posts.service.js"
import { CreatePostDto } from "./dto/create-post.dto.js"
import { UpdatePostDto } from "./dto/update-post.dto.js"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"

@Controller("posts")
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  list() {
    return this.posts.list()
  }

  @Get(":slug")
  get(@Param("slug") slug: string) {
    return this.posts.getBySlug(slug)
  }

  @HttpPost()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUserId() userId: string, @Body() dto: CreatePostDto) {
    return this.posts.create(userId, dto)
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  update(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdatePostDto
  ) {
    return this.posts.update(userId, id, dto)
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard)
  remove(@CurrentUserId() userId: string, @Param("id", ParseIntPipe) id: number) {
    return this.posts.remove(userId, id)
  }
}

