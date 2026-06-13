import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { ReactionType } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"
import { CreateReelDto } from "./dto/create-reel.dto.js"

@Injectable()
export class ReelsService {
  constructor(private readonly prisma: PrismaService) {}

  async createReel(userId: string, dto: CreateReelDto) {
    return this.prisma.reel.create({
      data: {
        authorId: userId,
        videoUrl: dto.videoUrl.trim(),
        caption: dto.caption?.trim() || null,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    })
  }

  async getFeed(opts?: { cursor?: number; take?: number }) {
    const take = Math.min(Math.max(opts?.take ?? 10, 1), 30)

    const rows = await this.prisma.reel.findMany({
      where: opts?.cursor ? { id: { lt: opts.cursor } } : undefined,
      orderBy: { createdAt: "desc" },
      take,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    const nextCursor = rows.length === take ? rows[rows.length - 1].id : null
    return { items: rows, nextCursor }
  }

  async getReactionStatus(reelId: number, userId: string) {
    const reel = await this.prisma.reel.findUnique({ where: { id: reelId } })
    if (!reel) throw new NotFoundException("Reel not found")

    const row = await this.prisma.reelLike.findUnique({
      where: { reelId_userId: { reelId, userId } },
    })
    return this.reactionResponse(reelId, userId, row?.reaction ?? null)
  }

  async listReactions(reelId: number, reaction?: ReactionType) {
    const reel = await this.prisma.reel.findUnique({ where: { id: reelId } })
    if (!reel) throw new NotFoundException("Reel not found")

    const rows = await this.prisma.reelLike.findMany({
      where: {
        reelId,
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

  async setReaction(reelId: number, userId: string, reaction: ReactionType) {
    const reel = await this.prisma.reel.findUnique({ where: { id: reelId } })
    if (!reel) throw new NotFoundException("Reel not found")

    const existing = await this.prisma.reelLike.findUnique({
      where: { reelId_userId: { reelId, userId } },
    })

    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.reelLike.create({ data: { reelId, userId, reaction } }),
        this.prisma.reel.update({
          where: { id: reelId },
          data: { likeCount: { increment: 1 } },
        }),
      ])
      return this.reactionResponse(reelId, userId, reaction)
    }

    if (existing.reaction === reaction) {
      await this.prisma.$transaction([
        this.prisma.reelLike.delete({ where: { id: existing.id } }),
        this.prisma.reel.update({
          where: { id: reelId },
          data: { likeCount: { decrement: 1 } },
        }),
      ])
      return this.reactionResponse(reelId, userId, null)
    }

    await this.prisma.reelLike.update({
      where: { id: existing.id },
      data: { reaction },
    })
    return this.reactionResponse(reelId, userId, reaction)
  }

  async markViewed(reelId: number, viewerId: string) {
    const reel = await this.prisma.reel.findUnique({ where: { id: reelId } })
    if (!reel) throw new NotFoundException("Reel not found")
    if (reel.authorId === viewerId) return { ok: true }

    const existing = await this.prisma.reelView.findUnique({
      where: { reelId_viewerId: { reelId, viewerId } },
    })

    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.reelView.create({ data: { reelId, viewerId } }),
        this.prisma.reel.update({
          where: { id: reelId },
          data: { viewCount: { increment: 1 } },
        }),
      ])
    } else {
      await this.prisma.reelView.update({
        where: { id: existing.id },
        data: { viewedAt: new Date() },
      })
    }

    return { ok: true }
  }

  async remove(reelId: number, userId: string) {
    const reel = await this.prisma.reel.findUnique({ where: { id: reelId } })
    if (!reel) throw new NotFoundException("Reel not found")
    if (reel.authorId !== userId) {
      throw new ForbiddenException("You can only delete your own reels")
    }

    await this.prisma.reel.delete({ where: { id: reelId } })
    return { ok: true }
  }

  private async buildReactionSummary(reelId: number) {
    const groups = await this.prisma.reelLike.groupBy({
      by: ["reaction"],
      where: { reelId },
      _count: { reaction: true },
    })
    const summary: Partial<Record<ReactionType, number>> = {}
    for (const g of groups) {
      summary[g.reaction] = g._count.reaction
    }
    return summary
  }

  private async reactionResponse(reelId: number, userId: string, reaction: ReactionType | null) {
    const reel = await this.prisma.reel.findUnique({
      where: { id: reelId },
      select: { likeCount: true },
    })
    const summary = await this.buildReactionSummary(reelId)
    const reactionCount = reel?.likeCount ?? 0
    return {
      reaction,
      reactionCount,
      summary,
      liked: reaction != null,
      likeCount: reactionCount,
    }
  }
}
