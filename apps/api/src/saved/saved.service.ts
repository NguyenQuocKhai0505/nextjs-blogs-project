import { Injectable, NotFoundException } from "@nestjs/common"
import type { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"

const postInclude = {
  author: { select: { id: true, name: true, avatarUrl: true } },
  category: { select: { id: true, name: true, slug: true } },
} satisfies Prisma.PostInclude

@Injectable()
export class SavedService {
  constructor(private readonly prisma: PrismaService) {}

  async getSavedStatus(postId: number, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException("Post not found")

    const row = await this.prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    })
    return { saved: row != null }
  }

  async toggleSaved(postId: number, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException("Post not found")

    const existing = await this.prisma.savedPost.findUnique({
      where: { userId_postId: { userId, postId } },
    })

    if (existing) {
      await this.prisma.savedPost.delete({
        where: { userId_postId: { userId, postId } },
      })
      return { saved: false }
    }

    await this.prisma.savedPost.create({ data: { userId, postId } })
    return { saved: true }
  }

  async listSaved(userId: string) {
    const rows = await this.prisma.savedPost.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        post: { include: postInclude },
      },
    })
    return {
      items: rows.map((r) => ({
        savedAt: r.createdAt.toISOString(),
        post: r.post,
      })),
    }
  }
}
