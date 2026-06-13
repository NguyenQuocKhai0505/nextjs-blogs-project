import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post as HttpPost,
  Query,
  UseGuards,
} from "@nestjs/common"
import { PostsService } from "./posts.service.js"
import { CreatePostDto } from "./dto/create-post.dto.js"
import { CreateCommentDto } from "./dto/create-comment.dto.js"
import { UpdatePostDto } from "./dto/update-post.dto.js"
import { SetReactionDto } from "./dto/set-reaction.dto.js"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"

@Controller("posts")
export class PostsController {
  constructor(private readonly posts: PostsService) {}

  @Get()
  list(@Query("categoryIds") categoryIdsRaw?: string, @Query("days") daysRaw?: string) {
    const ids = (categoryIdsRaw ?? "")
      .split(",")
      .map((s) => Number(s.trim()))
      .filter((n) => Number.isFinite(n) && n > 0)
    const days = Number(daysRaw)
    return this.posts.list({
      categoryIds: ids.length ? ids : undefined,
      days: Number.isFinite(days) && days > 0 ? days : undefined,
    })
  }

  @Get("by-author/:authorId")
  listByAuthor(@Param("authorId") authorId: string) {
    return this.posts.listByAuthorId(authorId)
  }

  @Get("id/:postId/reactions")
  listReactions(
    @Param("postId", ParseIntPipe) postId: number,
    @Query("reaction") reactionRaw?: string
  ) {
    const allowed = ["LIKE", "LOVE", "HAHA", "WOW", "SAD", "ANGRY"] as const
    const reaction = reactionRaw && (allowed as readonly string[]).includes(reactionRaw)
      ? (reactionRaw as (typeof allowed)[number])
      : undefined
    return this.posts.listReactions(postId, reaction)
  }

  @Get("id/:postId/reaction")
  @UseGuards(JwtAuthGuard)
  reactionStatus(
    @CurrentUserId() userId: string,
    @Param("postId", ParseIntPipe) postId: number
  ) {
    return this.posts.getReactionStatus(postId, userId)
  }

  @HttpPost("id/:postId/reaction")
  @UseGuards(JwtAuthGuard)
  setReaction(
    @CurrentUserId() userId: string,
    @Param("postId", ParseIntPipe) postId: number,
    @Body() dto: SetReactionDto
  ) {
    return this.posts.setReaction(postId, userId, dto.reaction)
  }

  @Get("id/:postId/liked")
  @UseGuards(JwtAuthGuard)
  likeStatus(
    @CurrentUserId() userId: string,
    @Param("postId", ParseIntPipe) postId: number
  ) {
    return this.posts.getLikeStatus(postId, userId)
  }

  @HttpPost("id/:postId/like")
  @UseGuards(JwtAuthGuard)
  toggleLike(
    @CurrentUserId() userId: string,
    @Param("postId", ParseIntPipe) postId: number
  ) {
    return this.posts.toggleLike(postId, userId)
  }

  @Get("id/:postId/comments")
  listComments(@Param("postId", ParseIntPipe) postId: number) {
    return this.posts.listComments(postId)
  }

  @HttpPost("id/:postId/comments")
  @UseGuards(JwtAuthGuard)
  addComment(
    @CurrentUserId() userId: string,
    @Param("postId", ParseIntPipe) postId: number,
    @Body() dto: CreateCommentDto
  ) {
    return this.posts.createComment(postId, userId, dto)
  }

  @Delete("id/:postId/comments/:commentId")
  @UseGuards(JwtAuthGuard)
  removeComment(
    @CurrentUserId() userId: string,
    @Param("commentId", ParseIntPipe) commentId: number
  ) {
    return this.posts.deleteComment(commentId, userId)
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

