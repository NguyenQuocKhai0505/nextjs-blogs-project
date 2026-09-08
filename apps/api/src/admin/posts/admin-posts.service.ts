import {
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import {
  NotificationTargetKind,
  NotificationType,
  ReportStatus,
  ReportTargetKind,
} from "@prisma/client"

import { NotificationsService } from "../../notifications/notifications.service.js"
import { PrismaService } from "../../prisma/prisma.service.js"

@Injectable()
export class AdminPostsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService
  ) {}

  /** Distinct posts (per author) that have ≥1 PENDING POST report. */
  private async pendingReportedPostCountsByAuthor(
    userIds: string[]
  ): Promise<Map<string, number>> {
    const result = new Map<string, number>()
    if (userIds.length === 0) return result

    const posts = await this.prisma.post.findMany({
      where: { authorId: { in: userIds } },
      select: { id: true, authorId: true },
    })
    if (posts.length === 0) return result

    const postIdToAuthor = new Map(posts.map((p) => [String(p.id), p.authorId]))
    const reports = await this.prisma.report.findMany({
      where: {
        targetKind: ReportTargetKind.POST,
        status: ReportStatus.PENDING,
        targetId: { in: [...postIdToAuthor.keys()] },
      },
      select: { targetId: true },
    })

    const reportedPostsByAuthor = new Map<string, Set<string>>()
    for (const r of reports) {
      const authorId = postIdToAuthor.get(r.targetId)
      if (!authorId) continue
      let set = reportedPostsByAuthor.get(authorId)
      if (!set) {
        set = new Set()
        reportedPostsByAuthor.set(authorId, set)
      }
      set.add(r.targetId)
    }

    for (const uid of userIds) {
      result.set(uid, reportedPostsByAuthor.get(uid)?.size ?? 0)
    }
    return result
  }

  private async pendingReportCountByPostIds(
    postIds: number[]
  ): Promise<Map<number, number>> {
    const result = new Map<number, number>()
    if (postIds.length === 0) return result

    const reports = await this.prisma.report.groupBy({
      by: ["targetId"],
      where: {
        targetKind: ReportTargetKind.POST,
        status: ReportStatus.PENDING,
        targetId: { in: postIds.map(String) },
      },
      _count: { _all: true },
    })

    for (const row of reports) {
      const id = Number(row.targetId)
      if (Number.isFinite(id)) result.set(id, row._count._all)
    }
    return result
  }

  async listAuthors(opts: { q?: string; page?: number; limit?: number }) {
    const page = Math.max(1, Number.isFinite(opts.page) ? Number(opts.page) : 1)
    const rawLimit = Number.isFinite(opts.limit) ? Number(opts.limit) : 20
    const limit = Math.min(50, Math.max(1, rawLimit))
    const q = opts.q?.trim() || undefined

    const where = {
      posts: { some: {} },
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: "insensitive" as const } },
              { email: { contains: q, mode: "insensitive" as const } },
            ],
          }
        : {}),
    }

    const [total, rows] = await Promise.all([
      this.prisma.user.count({ where }),
      this.prisma.user.findMany({
        where,
        orderBy: { name: "asc" },
        skip: (page - 1) * limit,
        take: limit,
        select: {
          id: true,
          name: true,
          email: true,
          avatarUrl: true,
          _count: { select: { posts: true } },
        },
      }),
    ])

    const badgeMap = await this.pendingReportedPostCountsByAuthor(
      rows.map((u) => u.id)
    )

    return {
      items: rows.map((u) => ({
        userId: u.id,
        name: u.name,
        email: u.email,
        avatarUrl: u.avatarUrl,
        postCount: u._count.posts,
        pendingReportedPostCount: badgeMap.get(u.id) ?? 0,
      })),
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    }
  }

  async getAuthorPosts(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        _count: { select: { posts: true } },
      },
    })
    if (!user) throw new NotFoundException("User not found")

    const posts = await this.prisma.post.findMany({
      where: { authorId: userId },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        content: true,
        slug: true,
        createdAt: true,
      },
    })

    const reportCounts = await this.pendingReportCountByPostIds(
      posts.map((p) => p.id)
    )
    const pendingReportedPostCount = [...reportCounts.values()].filter(
      (n) => n > 0
    ).length

    return {
      user: {
        userId: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        postCount: user._count.posts,
        pendingReportedPostCount,
      },
      posts: posts.map((p) => ({
        id: p.id,
        title: p.title,
        description: p.description,
        content: p.content,
        slug: p.slug,
        createdAt: p.createdAt.toISOString(),
        pendingReportCount: reportCounts.get(p.id) ?? 0,
      })),
    }
  }

  async removePost(postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } })
    if (!post) throw new NotFoundException("Post not found")
    await this.prisma.post.delete({ where: { id: postId } })
    return { success: true }
  }

  async warnUser(adminId: string, userId: string, message?: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    })
    if (!user) throw new NotFoundException("User not found")

    const text =
      message?.trim() ||
      "Your content may violate community guidelines. Please review our rules."

    await this.notifications.createOrAggregate({
      recipientId: userId,
      actorId: adminId,
      type: NotificationType.SYSTEM,
      targetKind: NotificationTargetKind.user,
      targetId: userId,
      meta: { message: text, kind: "admin_warn" },
    })

    return { success: true }
  }
}
