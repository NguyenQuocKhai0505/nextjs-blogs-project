import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type { Prisma } from "@prisma/client"
import { ReactionType, UserRole } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"
import { NotificationsGateway } from "../notifications/notifications.gateway.js"
import { NotificationsService } from "../notifications/notifications.service.js"
import { CreateCommentDto } from "./dto/create-comment.dto.js"
import { CreatePostDto } from "./dto/create-post.dto.js"
import { UpdatePostDto } from "./dto/update-post.dto.js"

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

const postAuthorCategoryInclude = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.PostInclude

@Injectable()
export class PostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly notifGateway: NotificationsGateway
  ) {}

  private async assertCategoryExists(categoryId: number) {
    const row = await this.prisma.category.findUnique({ where: { id: categoryId } })
    if (!row) throw new BadRequestException("Invalid category")
  }

  /** True if the user is an admin (moderation / any post). */
  private async isAdminUser(userId: string): Promise<boolean> {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    return u?.role === UserRole.ADMIN
  }

  /** Author or admin may change or remove a post. */
  private canModeratePost(postAuthorId: string, actorId: string, actorIsAdmin: boolean): boolean {
    return actorIsAdmin || postAuthorId === actorId
  }

  /**
   * Resolves a URL slug unique among all posts.
   * When `excludePostId` is set, that post’s current row is ignored (safe title edits).
   */
  private async resolveUniqueSlug(baseSlug: string, excludePostId?: number): Promise<string> {
    let slug = baseSlug
    let n = 1
    for (;;) {
      const conflict = await this.prisma.post.findFirst({
        where: {
          slug,
          ...(excludePostId != null ? { NOT: { id: excludePostId } } : {}),
        },
        select: { id: true },
      })
      if (!conflict) return slug
      n += 1
      slug = `${baseSlug}-${n}`
    }
  }

  async list(opts?: { categoryIds?: number[]; days?: number }) {
    const result = await this.listFeed({
      mode: "forYou",
      categoryIds: opts?.categoryIds,
      days: opts?.days,
      take: 500,
    })
    return result.items
  }

  async listFeed(opts: {
    mode?: "forYou" | "following"
    userId?: string
    categoryIds?: number[]
    days?: number
    cursor?: number
    take?: number
  }) {
    const take = Math.min(Math.max(opts.take ?? 10, 1), 30)
    const mode = opts.mode === "following" ? "following" : "forYou"
    const where: Prisma.PostWhereInput = {}

    if (opts.categoryIds?.length) {
      where.categoryId = { in: opts.categoryIds }
    }
    if (opts.days) {
      const from = new Date(Date.now() - opts.days * 24 * 60 * 60 * 1000)
      where.createdAt = { gte: from }
    }

    if (mode === "following") {
      if (!opts.userId) {
        return { items: [], nextCursor: null }
      }
      const follows = await this.prisma.follow.findMany({
        where: { followerId: opts.userId },
        select: { followingId: true },
      })
      const authorIds = [...new Set([opts.userId, ...follows.map((f) => f.followingId)])]
      where.authorId = { in: authorIds }
    }

    if (opts.cursor) {
      where.id = { lt: opts.cursor }
    }

    const rows = await this.prisma.post.findMany({
      where,
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take,
      include: postAuthorCategoryInclude,
    })

    const nextCursor = rows.length === take ? rows[rows.length - 1].id : null
    return { items: rows, nextCursor }
  }

  async listByAuthorId(authorId: string) {
    return this.prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: "desc" },
      include: postAuthorCategoryInclude,
    })
  }

  async getBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug },
      include: postAuthorCategoryInclude,
    })
    if (!post) throw new NotFoundException("Post not found")
    return post
  }

  async create(userId: string, dto: CreatePostDto) {
    if (dto.categoryId != null) {
      await this.assertCategoryExists(dto.categoryId)
    }

    const baseSlug = slugify(dto.title)
    const slug = await this.resolveUniqueSlug(baseSlug)

    return this.prisma.post.create({
      data: {
        title: dto.title,
        description: dto.description,
        content: dto.content,
        slug,
        authorId: userId,
        imageUrls: dto.imageUrls ?? null,
        videoUrls: dto.videoUrls ?? null,
        categoryId: dto.categoryId ?? null,
      },
      include: postAuthorCategoryInclude,
    })
  }

  async update(userId: string, id: number, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } })
    if (!post) throw new NotFoundException("Post not found")

    const admin = await this.isAdminUser(userId)
    if (!this.canModeratePost(post.authorId, userId, admin)) {
      throw new ForbiddenException("Not allowed")
    }

    if (dto.categoryId !== undefined) {
      await this.assertCategoryExists(dto.categoryId)
    }

    // Unchecked input includes scalar `categoryId`; some Prisma versions omit `category` on PostUpdateInput.
    const data: Prisma.PostUncheckedUpdateInput = {}

    if (dto.title !== undefined) data.title = dto.title
    if (dto.description !== undefined) data.description = dto.description
    if (dto.content !== undefined) data.content = dto.content
    if (dto.imageUrls !== undefined) data.imageUrls = dto.imageUrls
    if (dto.videoUrls !== undefined) data.videoUrls = dto.videoUrls
    if (dto.categoryId !== undefined) {
      data.categoryId = dto.categoryId
    }

    if (dto.title !== undefined && dto.title !== post.title) {
      const baseSlug = slugify(dto.title)
      data.slug = await this.resolveUniqueSlug(baseSlug, id)
    }

    return this.prisma.post.update({
      where: { id },
      data,
      include: postAuthorCategoryInclude,
    })
  }

  async remove(userId: string, id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } })
    if (!post) throw new NotFoundException("Post not found")

    const admin = await this.isAdminUser(userId)
    if (!this.canModeratePost(post.authorId, userId, admin)) {
      throw new ForbiddenException("Not allowed")
    }

    await this.prisma.post.delete({ where: { id } })
    return { success: true }
  }

  private async buildReactionSummary(postId: number) {
    const groups = await this.prisma.postLike.groupBy({
      by: ["reaction"],
      where: { postId },
      _count: { reaction: true },
    })
    const summary: Partial<Record<ReactionType, number>> = {}
    for (const g of groups) {
      summary[g.reaction] = g._count.reaction
    }
    return summary
  }

  private async reactionResponse(postId: number, userId: string, reaction: ReactionType | null) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { likeCount: true },
    })
    const summary = await this.buildReactionSummary(postId)
    const reactionCount = post?.likeCount ?? 0
    return {
      reaction,
      reactionCount,
      summary,
      liked: reaction != null,
      likeCount: reactionCount,
    }
  }

  private async notifyPostLiked(
    post: { id: number; authorId: string; slug: string; title: string },
    userId: string
  ) {
    const created = await this.notifications.createOrAggregate({
      recipientId: post.authorId,
      actorId: userId,
      type: "POST_LIKED",
      targetKind: "post",
      targetId: String(post.id),
      targetSlug: post.slug,
      meta: { postTitle: post.title },
    })
    if (created?.notif) {
      this.notifGateway.emitNewNotification(post.authorId, created.notif)
      this.notifGateway.emitUnreadCount(post.authorId, created.unread)
    }
  }

  async getReactionStatus(postId: number, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException("Post not found")
    const row = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    })
    return this.reactionResponse(postId, userId, row?.reaction ?? null)
  }

  async listReactions(postId: number, reaction?: ReactionType) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException("Post not found")

    const rows = await this.prisma.postLike.findMany({
      where: {
        postId,
        ...(reaction ? { reaction } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return {
      items: rows.map((r) => ({
        userId: r.userId,
        reaction: r.reaction,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
      })),
    }
  }

  /** @deprecated Use getReactionStatus — kept for old clients. */
  async getLikeStatus(postId: number, userId: string) {
    return this.getReactionStatus(postId, userId)
  }

  async setReaction(postId: number, userId: string, reaction: ReactionType) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException("Post not found")

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    })

    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.postLike.create({ data: { postId, userId, reaction } }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        }),
      ])
      await this.notifyPostLiked(post, userId)
      return this.reactionResponse(postId, userId, reaction)
    }

    if (existing.reaction === reaction) {
      await this.prisma.$transaction([
        this.prisma.postLike.delete({ where: { id: existing.id } }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ])
      return this.reactionResponse(postId, userId, null)
    }

    await this.prisma.postLike.update({
      where: { id: existing.id },
      data: { reaction },
    })
    return this.reactionResponse(postId, userId, reaction)
  }

  async toggleLike(postId: number, userId: string) {
    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    })
    if (existing?.reaction === ReactionType.LIKE) {
      return this.setReaction(postId, userId, ReactionType.LIKE)
    }
    return this.setReaction(postId, userId, ReactionType.LIKE)
  }

  async listComments(postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException("Post not found")
    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: "asc" },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    })
  }

  async createComment(postId: number, userId: string, dto: CreateCommentDto) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException("Post not found")
    const text = dto.content.trim()
    let parentId: number | null = dto.parentId ?? null
    if (parentId != null) {
      const parent = await this.prisma.comment.findFirst({
        where: { id: parentId, postId },
      })
      if (!parent) throw new BadRequestException("Invalid parent comment")
      if (parent.parentId != null) {
        throw new BadRequestException("You can only reply to top-level comments")
      }
    }
    const comment = await this.prisma.$transaction(async (tx) => {
      const comment = await tx.comment.create({
        data: {
          postId,
          authorId: userId,
          content: text,
          ...(parentId != null ? { parentId } : {}),
        },
        include: { author: { select: { id: true, name: true, avatarUrl: true } } },
      })
      await tx.post.update({
        where: { id: postId },
        data: { commentCount: { increment: 1 } },
      })
      return comment
    })

    const created = await this.notifications.createOrAggregate({
      recipientId: post.authorId,
      actorId: userId,
      type: "POST_COMMENTED",
      targetKind: "post",
      targetId: String(post.id),
      targetSlug: post.slug,
      meta: { postTitle: post.title, commentId: comment.id },
    })
    if (created?.notif) {
      this.notifGateway.emitNewNotification(post.authorId, created.notif)
      this.notifGateway.emitUnreadCount(post.authorId, created.unread)
    }

    return comment
  }

  async deleteComment(commentId: number, userId: string) {
    const c = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { select: { authorId: true, id: true } } },
    })
    if (!c) throw new NotFoundException("Comment not found")

    const admin = await this.isAdminUser(userId)
    const isCommentAuthor = c.authorId === userId
    const isPostAuthor = c.post.authorId === userId
    if (!isCommentAuthor && !isPostAuthor && !admin) {
      throw new ForbiddenException("Not allowed")
    }

    await this.prisma.$transaction(async (tx) => {
      const removed = await this.countCommentSubtree(tx, commentId)
      await tx.comment.delete({ where: { id: commentId } })
      await tx.post.update({
        where: { id: c.postId },
        data: { commentCount: { decrement: removed } },
      })
    })
    return { success: true }
  }

  private async countCommentSubtree(tx: Prisma.TransactionClient, rootId: number): Promise<number> {
    const children = await tx.comment.findMany({
      where: { parentId: rootId },
      select: { id: true },
    })
    let total = 1
    for (const ch of children) {
      total += await this.countCommentSubtree(tx, ch.id)
    }
    return total
  }
}
