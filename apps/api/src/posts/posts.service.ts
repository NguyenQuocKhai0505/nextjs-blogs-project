import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"
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

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    })
  }

  async listByAuthorId(authorId: string) {
    return this.prisma.post.findMany({
      where: { authorId },
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    })
  }

  async getBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    })
    if (!post) throw new NotFoundException("Post not found")
    return post
  }

  async create(userId: string, dto: CreatePostDto) {
    const baseSlug = slugify(dto.title)
    let slug = baseSlug
    let i = 1
    // ensure uniqueness without DB constraint
    while (await this.prisma.post.findFirst({ where: { slug } })) {
      i += 1
      slug = `${baseSlug}-${i}`
    }

    return this.prisma.post.create({
      data: {
        title: dto.title,
        description: dto.description,
        content: dto.content,
        slug,
        authorId: userId,
        imageUrls: dto.imageUrls ?? null,
        videoUrls: dto.videoUrls ?? null,
      },
    })
  }

  async update(userId: string, id: number, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } })
    if (!post) throw new NotFoundException("Post not found")
    if (post.authorId !== userId) throw new ForbiddenException("Not allowed")

    const data: Record<string, unknown> = {
      ...dto,
    }

    // Ensure nullable fields are passed intentionally
    if (dto.imageUrls !== undefined) data.imageUrls = dto.imageUrls
    if (dto.videoUrls !== undefined) data.videoUrls = dto.videoUrls

    if (dto.title && dto.title !== post.title) {
      const baseSlug = slugify(dto.title)
      let slug = baseSlug
      let i = 1
      while (await this.prisma.post.findFirst({ where: { slug } })) {
        i += 1
        slug = `${baseSlug}-${i}`
      }
      data.slug = slug
    }

    return this.prisma.post.update({
      where: { id },
      data,
    })
  }

  async remove(userId: string, id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } })
    if (!post) throw new NotFoundException("Post not found")
    if (post.authorId !== userId) throw new ForbiddenException("Not allowed")
    await this.prisma.post.delete({ where: { id } })
    return { success: true }
  }

  async getLikeStatus(postId: number, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException("Post not found")
    const row = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    })
    return { liked: !!row, likeCount: post.likeCount }
  }

  async toggleLike(postId: number, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException("Post not found")

    const existing = await this.prisma.postLike.findUnique({
      where: { postId_userId: { postId, userId } },
    })

    if (existing) {
      await this.prisma.$transaction([
        this.prisma.postLike.delete({ where: { id: existing.id } }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { decrement: 1 } },
        }),
      ])
    } else {
      await this.prisma.$transaction([
        this.prisma.postLike.create({ data: { postId, userId } }),
        this.prisma.post.update({
          where: { id: postId },
          data: { likeCount: { increment: 1 } },
        }),
      ])
    }

    const updated = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { likeCount: true },
    })
    const liked = !existing
    return { liked, likeCount: updated?.likeCount ?? 0 }
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
    return this.prisma.$transaction(async (tx) => {
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
  }

  async deleteComment(commentId: number, userId: string) {
    const c = await this.prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: { select: { authorId: true, id: true } } },
    })
    if (!c) throw new NotFoundException("Comment not found")
    if (c.authorId !== userId && c.post.authorId !== userId) {
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

