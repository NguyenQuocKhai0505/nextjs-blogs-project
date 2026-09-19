import { Injectable } from "@nestjs/common"
import { ReportStatus } from "@prisma/client"

import { PrismaService } from "../../prisma/prisma.service.js"

const SERIES_DAYS = 7

function startOfUtcDay(d: Date) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function dayKey(d: Date) {
  return startOfUtcDay(d).toISOString().slice(0, 10)
}

function buildEmptySeries(days: number) {
  const labels: string[] = []
  const now = startOfUtcDay(new Date())
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now)
    d.setUTCDate(d.getUTCDate() - i)
    labels.push(dayKey(d))
  }
  return labels
}

function countByDay(dates: Date[], labels: string[]) {
  const map = new Map(labels.map((l) => [l, 0]))
  for (const dt of dates) {
    const key = dayKey(dt)
    if (map.has(key)) map.set(key, (map.get(key) ?? 0) + 1)
  }
  return labels.map((l) => map.get(l) ?? 0)
}

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const labels = buildEmptySeries(SERIES_DAYS)
    const since = new Date(labels[0] + "T00:00:00.000Z")

    const [
      users,
      posts,
      categories,
      pendingReports,
      recentUsers,
      recentPosts,
      recentReports,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.category.count(),
      this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.post.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
      this.prisma.report.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ])

    return {
      users,
      posts,
      categories,
      pendingReports,
      series: {
        days: labels,
        users: countByDay(
          recentUsers.map((u) => u.createdAt),
          labels
        ),
        posts: countByDay(
          recentPosts.map((p) => p.createdAt),
          labels
        ),
        reports: countByDay(
          recentReports.map((r) => r.createdAt),
          labels
        ),
      },
    }
  }
}
