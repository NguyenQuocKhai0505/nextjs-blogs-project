import { Injectable } from "@nestjs/common"
import { ReportStatus } from "@prisma/client"

import { PrismaService } from "../../prisma/prisma.service.js"

@Injectable()
export class AdminDashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async dashboard() {
    const [users, posts, categories, pendingReports] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.post.count(),
      this.prisma.category.count(),
      this.prisma.report.count({ where: { status: ReportStatus.PENDING } }),
    ])

    return { users, posts, categories, pendingReports }
  }
}
