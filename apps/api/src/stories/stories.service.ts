import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { StoryMediaType, ReactionType } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"
import { CreateStoryDto } from "./dto/create-story.dto.js"

const STORY_TTL_MS = 24 * 60 * 60 * 1000

const TEXT_BACKGROUNDS = new Set([
  "#6366f1",
  "#ec4899",
  "#f59e0b",
  "#10b981",
  "#3b82f6",
  "#8b5cf6",
  "#ef4444",
  "#14b8a6",
])

type StoryAuthor = { id: string; name: string; avatarUrl: string | null }

type StoryItem = {
  id: number
  mediaType: StoryMediaType
  imageUrl: string | null
  videoUrl: string | null
  textContent: string | null
  backgroundColor: string | null
  createdAt: string
  expiresAt: string
  viewed: boolean
  reactionCount: number
}

@Injectable()
export class StoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private storyExpiresAt() {
    return new Date(Date.now() + STORY_TTL_MS)
  }

  private mapStory(
    row: {
      id: number
      mediaType: StoryMediaType
      imageUrl: string | null
      videoUrl: string | null
      textContent: string | null
      backgroundColor: string | null
      createdAt: Date
      expiresAt: Date
      reactionCount: number
      views?: { id: number }[]
    },
    viewerId?: string
  ): StoryItem {
    const viewed =
      !viewerId || (row.views?.length ?? 0) > 0
    return {
      id: row.id,
      mediaType: row.mediaType,
      imageUrl: row.imageUrl,
      videoUrl: row.videoUrl,
      textContent: row.textContent,
      backgroundColor: row.backgroundColor,
      createdAt: row.createdAt.toISOString(),
      expiresAt: row.expiresAt.toISOString(),
      viewed,
      reactionCount: row.reactionCount ?? 0,
    }
  }

  private async reactionSummary(storyId: number) {
    const groups = await this.prisma.storyLike.groupBy({
      by: ["reaction"],
      where: { storyId },
      _count: { reaction: true },
    })
    const summary: Partial<Record<ReactionType, number>> = {}
    for (const g of groups) {
      summary[g.reaction as ReactionType] = g._count.reaction
    }
    return summary
  }

  private async reactionResponse(storyId: number, userId: string, reaction: ReactionType | null) {
    const story = await this.prisma.story.findUnique({ where: { id: storyId } })
    const summary = await this.reactionSummary(storyId)
    const reactionCount = story?.reactionCount ?? 0
    return {
      reaction,
      reactionCount,
      summary,
      liked: reaction != null,
      likeCount: reactionCount,
    }
  }

  async create(userId: string, dto: CreateStoryDto) {
    const imageUrl = dto.imageUrl?.trim() || null
    const videoUrl = dto.videoUrl?.trim() || null
    const textContent = dto.textContent?.trim() || null
    const backgroundColor = dto.backgroundColor?.trim() || null

    let mediaType: StoryMediaType
    if (videoUrl) {
      mediaType = StoryMediaType.VIDEO
    } else if (imageUrl) {
      mediaType = StoryMediaType.IMAGE
    } else if (textContent) {
      mediaType = StoryMediaType.TEXT
      if (backgroundColor && !TEXT_BACKGROUNDS.has(backgroundColor.toLowerCase())) {
        throw new BadRequestException("Invalid background color")
      }
    } else {
      throw new BadRequestException("Story must include an image, video, or text")
    }

    const story = await this.prisma.story.create({
      data: {
        authorId: userId,
        mediaType,
        imageUrl,
        videoUrl,
        textContent,
        backgroundColor: mediaType === StoryMediaType.TEXT ? backgroundColor ?? "#6366f1" : null,
        expiresAt: this.storyExpiresAt(),
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return {
      ...this.mapStory({ ...story, views: [], reactionCount: 0 }, userId),
      author: story.author,
    }
  }

  async getFeed(viewerId?: string) {
    const now = new Date()

    let authorFilter: { authorId: { in: string[] } } | undefined
    if (viewerId) {
      const following = await this.prisma.follow.findMany({
        where: { followerId: viewerId },
        select: { followingId: true },
      })
      const authorIds = [viewerId, ...following.map((f) => f.followingId)]
      authorFilter = { authorId: { in: authorIds } }
    }

    const rows = await this.prisma.story.findMany({
      where: {
        expiresAt: { gt: now },
        ...authorFilter,
      },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        views: viewerId
          ? { where: { viewerId }, select: { id: true } }
          : false,
      },
      orderBy: [{ authorId: "asc" }, { createdAt: "asc" }],
    })

    const groupMap = new Map<
      string,
      { user: StoryAuthor; stories: StoryItem[]; isOwn: boolean }
    >()

    for (const row of rows) {
      const key = row.authorId
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          user: row.author,
          stories: [],
          isOwn: viewerId === row.authorId,
        })
      }
      groupMap.get(key)!.stories.push(this.mapStory(row, viewerId))
    }

    const groups = [...groupMap.values()].map((g) => ({
      user: g.user,
      stories: g.stories,
      isOwn: g.isOwn,
      hasUnviewed: viewerId
        ? g.isOwn
          ? g.stories.length > 0
          : g.stories.some((s) => !s.viewed)
        : true,
    }))

    // Own slot first, then unviewed, then viewed
    groups.sort((a, b) => {
      if (a.isOwn !== b.isOwn) return a.isOwn ? -1 : 1
      if (a.hasUnviewed !== b.hasUnviewed) return a.hasUnviewed ? -1 : 1
      return a.user.name.localeCompare(b.user.name)
    })

    return { groups }
  }

  async markViewed(storyId: number, viewerId: string) {
    const story = await this.prisma.story.findFirst({
      where: { id: storyId, expiresAt: { gt: new Date() } },
    })
    if (!story) throw new NotFoundException("Story not found")
    if (story.authorId === viewerId) {
      return { ok: true }
    }

    await this.prisma.storyView.upsert({
      where: {
        storyId_viewerId: { storyId, viewerId },
      },
      create: { storyId, viewerId },
      update: { viewedAt: new Date() },
    })

    return { ok: true }
  }

  async listViewers(storyId: number, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true, expiresAt: true },
    })
    if (!story) throw new NotFoundException("Story not found")
    if (story.authorId !== userId) {
      throw new ForbiddenException("Only the author can see viewers")
    }

    const views = await this.prisma.storyView.findMany({
      where: { storyId },
      include: {
        viewer: { select: { id: true, name: true, avatarUrl: true } },
      },
      orderBy: { viewedAt: "desc" },
    })

    return {
      count: views.length,
      viewers: views.map((v: (typeof views)[number]) => ({
        user: v.viewer,
        viewedAt: v.viewedAt.toISOString(),
      })),
    }
  }

  async remove(storyId: number, userId: string) {
    const story = await this.prisma.story.findUnique({
      where: { id: storyId },
      select: { authorId: true },
    })
    if (!story) throw new NotFoundException("Story not found")
    if (story.authorId !== userId) {
      throw new ForbiddenException("You can only delete your own stories")
    }

    await this.prisma.story.delete({ where: { id: storyId } })
    return { ok: true }
  }

  async getReactionStatus(storyId: number, userId: string) {
    const story = await this.prisma.story.findFirst({
      where: { id: storyId, expiresAt: { gt: new Date() } },
    })
    if (!story) throw new NotFoundException("Story not found")

    const row = await this.prisma.storyLike.findUnique({
      where: { storyId_userId: { storyId, userId } },
    })
    return this.reactionResponse(storyId, userId, row?.reaction ?? null)
  }

  async listReactions(storyId: number, reaction?: ReactionType) {
    const story = await this.prisma.story.findFirst({
      where: { id: storyId, expiresAt: { gt: new Date() } },
    })
    if (!story) throw new NotFoundException("Story not found")

    const rows = await this.prisma.storyLike.findMany({
      where: {
        storyId,
        ...(reaction ? { reaction } : {}),
      },
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return {
      items: rows.map((r: (typeof rows)[number]) => ({
        userId: r.userId,
        reaction: r.reaction,
        createdAt: r.createdAt.toISOString(),
        user: r.user,
      })),
    }
  }

  async setReaction(storyId: number, userId: string, reaction: ReactionType) {
    const story = await this.prisma.story.findFirst({
      where: { id: storyId, expiresAt: { gt: new Date() } },
    })
    if (!story) throw new NotFoundException("Story not found")

    const existing = await this.prisma.storyLike.findUnique({
      where: { storyId_userId: { storyId, userId } },
    })

    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.storyLike.create({ data: { storyId, userId, reaction } }),
        this.prisma.story.update({
          where: { id: storyId },
          data: { reactionCount: { increment: 1 } },
        }),
      ])
      return this.reactionResponse(storyId, userId, reaction)
    }

    if (existing.reaction === reaction) {
      await this.prisma.$transaction([
        this.prisma.storyLike.delete({ where: { id: existing.id } }),
        this.prisma.story.update({
          where: { id: storyId },
          data: { reactionCount: { decrement: 1 } },
        }),
      ])
      return this.reactionResponse(storyId, userId, null)
    }

    await this.prisma.storyLike.update({
      where: { id: existing.id },
      data: { reaction },
    })
    return this.reactionResponse(storyId, userId, reaction)
  }
}
