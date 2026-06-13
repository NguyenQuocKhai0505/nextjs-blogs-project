import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import type { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"

const postInclude = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.PostInclude

@Injectable()
export class SharesService {
  constructor(private readonly prisma: PrismaService) {}

  async getShareStatus(postId: number, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException("Post not found")

    const row = await this.prisma.postRepost.findUnique({
      where: { userId_postId: { userId, postId } },
    })
    return { shared: row != null, shareCount: post.shareCount }
  }

  async toggleShare(postId: number, userId: string, caption?: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException("Post not found")
    if (post.authorId === userId) {
      throw new BadRequestException("Cannot share your own post")
    }

    const existing = await this.prisma.postRepost.findUnique({
      where: { userId_postId: { userId, postId } },
    })

    if (existing) {
      const [, updated] = await this.prisma.$transaction([
        this.prisma.postRepost.delete({
          where: { userId_postId: { userId, postId } },
        }),
        this.prisma.post.update({
          where: { id: postId },
          data: { shareCount: { decrement: 1 } },
          select: { shareCount: true },
        }),
      ])
      return { shared: false, shareCount: updated.shareCount }
    }

    const [, updated] = await this.prisma.$transaction([
      this.prisma.postRepost.create({
        data: {
          userId,
          postId,
          caption: caption?.trim() || null,
        },
      }),
      this.prisma.post.update({
        where: { id: postId },
        data: { shareCount: { increment: 1 } },
        select: { shareCount: true },
      }),
    ])
    return { shared: true, shareCount: updated.shareCount }
  }

  async listShared(userId: string) {
    const rows = await this.prisma.postRepost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        post: { include: postInclude },
      },
    })
    return {
      items: rows.map((r) => ({
        sharedAt: r.createdAt.toISOString(),
        caption: r.caption,
        post: r.post,
      })),
    }
  }
}
