import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { Prisma, ReportStatus, ReportTargetKind, UserRole } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"
import { CreateReportDto } from "./dto/create-report.dto.js"
import { UpdateReportStatusDto } from "./dto/update-report-status.dto.js"

const reporterSelect = {
  id: true,
  name: true,
  email: true,
  avatarUrl: true,
} satisfies Prisma.UserSelect

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertAdmin(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true },
    })
    if (u?.role !== UserRole.ADMIN) {
      throw new ForbiddenException("Admin only")
    }
  }

  private async assertTargetExists(dto: CreateReportDto) {
    switch (dto.targetKind) {
      case ReportTargetKind.POST: {
        const id = Number(dto.targetId)
        if (!Number.isFinite(id) || id <= 0) {
          throw new BadRequestException("Invalid post id")
        }
        const post = await this.prisma.post.findUnique({ where: { id } })
        if (!post) throw new NotFoundException("Post not found")
        return
      }
      case ReportTargetKind.COMMENT: {
        const id = Number(dto.targetId)
        if (!Number.isFinite(id) || id <= 0) {
          throw new BadRequestException("Invalid comment id")
        }
        const comment = await this.prisma.comment.findUnique({ where: { id } })
        if (!comment) throw new NotFoundException("Comment not found")
        return
      }
      case ReportTargetKind.USER: {
        const user = await this.prisma.user.findUnique({
          where: { id: dto.targetId },
        })
        if (!user) throw new NotFoundException("User not found")
        return
      }
      case ReportTargetKind.REEL: {
        const id = Number(dto.targetId)
        if (!Number.isFinite(id) || id <= 0) {
          throw new BadRequestException("Invalid reel id")
        }
        const reel = await this.prisma.reel.findUnique({ where: { id } })
        if (!reel) throw new NotFoundException("Reel not found")
        return
      }
      default:
        throw new BadRequestException("Unsupported target kind")
    }
  }

  async create(reporterId: string, dto: CreateReportDto) {
    if (dto.targetKind === ReportTargetKind.USER && dto.targetId === reporterId) {
      throw new BadRequestException("Cannot report yourself")
    }

    await this.assertTargetExists(dto)

    if (dto.targetKind === ReportTargetKind.POST) {
      const post = await this.prisma.post.findUnique({
        where: { id: Number(dto.targetId) },
        select: { authorId: true },
      })
      if (post?.authorId === reporterId) {
        throw new BadRequestException("Cannot report your own post")
      }
    }

    try {
      const row = await this.prisma.report.create({
        data: {
          reporterId,
          targetKind: dto.targetKind,
          targetId: dto.targetId,
          reason: dto.reason,
          details: dto.details?.trim() || null,
        },
      })
      return {
        id: row.id,
        status: row.status,
        createdAt: row.createdAt.toISOString(),
      }
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === "P2002"
      ) {
        throw new ConflictException("You already reported this content")
      }
      throw e
    }
  }

  async listForAdmin(adminId: string, status?: ReportStatus) {
    await this.assertAdmin(adminId)

    const rows = await this.prisma.report.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: reporterSelect },
      },
    })

    const postIds = rows
      .filter((r) => r.targetKind === ReportTargetKind.POST)
      .map((r) => Number(r.targetId))
      .filter((id) => Number.isFinite(id) && id > 0)

    const posts =
      postIds.length > 0
        ? await this.prisma.post.findMany({
            where: { id: { in: postIds } },
            select: { id: true, slug: true, title: true },
          })
        : []
    const postById = new Map(posts.map((p) => [p.id, p]))

    return {
      items: rows.map((r) => {
        const postMeta =
          r.targetKind === ReportTargetKind.POST
            ? postById.get(Number(r.targetId)) ?? null
            : null
        return {
          id: r.id,
          targetKind: r.targetKind,
          targetId: r.targetId,
          targetSlug: postMeta?.slug ?? null,
          targetTitle: postMeta?.title ?? null,
          reason: r.reason,
          details: r.details,
          status: r.status,
          createdAt: r.createdAt.toISOString(),
          reviewedAt: r.reviewedAt?.toISOString() ?? null,
          reporter: r.reporter,
        }
      }),
    }
  }

  async updateStatus(
    adminId: string,
    reportId: number,
    dto: UpdateReportStatusDto
  ) {
    await this.assertAdmin(adminId)

    const existing = await this.prisma.report.findUnique({
      where: { id: reportId },
    })
    if (!existing) throw new NotFoundException("Report not found")

    if (dto.status === ReportStatus.PENDING) {
      throw new BadRequestException("Cannot revert to pending")
    }

    const row = await this.prisma.report.update({
      where: { id: reportId },
      data: {
        status: dto.status,
        reviewedAt: new Date(),
      },
    })

    return {
      id: row.id,
      status: row.status,
      reviewedAt: row.reviewedAt?.toISOString() ?? null,
    }
  }
}
