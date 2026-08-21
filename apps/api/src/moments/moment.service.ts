import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"
import { CreateMomentDto } from "./dto/create-moment.dto.js"
import { areMutualFriends } from "../users/follow.helpers.js"

@Injectable()
export class MomentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, dto: CreateMomentDto) {
    const imageUrl = dto.imageUrl?.trim()
    if (!imageUrl) throw new BadRequestException("Image URL is required")

    const caption = dto.caption?.trim() || null
    const row = await this.prisma.moment.create({
      data: { authorId: userId, imageUrl, caption },
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return {
      id: row.id,
      imageUrl: row.imageUrl,
      caption: row.caption,
      createdAt: row.createdAt.toISOString(),
      author: row.author,
    }
  }

  async getFeed(viewerId: string) {
    const owners = await this.prisma.closeFriend.findMany({
      where: { friendId: viewerId },
      select: { userId: true },
    })
    const authorIds = [...new Set([viewerId, ...owners.map((o) => o.userId)])]

    const rows = await this.prisma.moment.findMany({
      where: { authorId: { in: authorIds } },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        author: { select: { id: true, name: true, avatarUrl: true } },
        views: {
          where: { viewerId },
          select: { id: true },
          take: 1,
        },
      },
    })

    return rows.map((r) => ({
      id: r.id,
      imageUrl: r.imageUrl,
      caption: r.caption,
      createdAt: r.createdAt.toISOString(),
      author: r.author,
      viewed: r.views.length > 0,
    }))
  }

  async markView(momentId: number, viewerId: string) {
    const moment = await this.prisma.moment.findUnique({ where: { id: momentId } })
    if (!moment) throw new NotFoundException("Moment not found")
    if (moment.authorId === viewerId) return { ok: true }

    await this.prisma.momentView.upsert({
      where: { momentId_viewerId: { momentId, viewerId } },
      create: { momentId, viewerId },
      update: {},
    })
    return { ok: true }
  }

  async listViewers(momentId: number, userId: string) {
    const moment = await this.prisma.moment.findUnique({ where: { id: momentId } })
    if (!moment) throw new NotFoundException("Moment not found")
    if (moment.authorId !== userId) {
      throw new ForbiddenException("Only the author can list viewers")
    }

    const rows = await this.prisma.momentView.findMany({
      where: { momentId },
      orderBy: { viewedAt: "desc" },
      include: {
        viewer: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return {
      items: rows.map((r) => ({
        viewedAt: r.viewedAt.toISOString(),
        user: r.viewer,
      })),
    }
  }

  async remove(momentId: number, userId: string) {
    const moment = await this.prisma.moment.findUnique({ where: { id: momentId } })
    if (!moment) throw new NotFoundException("Moment not found")
    if (moment.authorId !== userId) {
      throw new ForbiddenException("You are not the owner of this moment")
    }
    await this.prisma.moment.delete({ where: { id: momentId } })
    return { ok: true }
  }

  async listCloseFriends(userId: string) {
    const rows = await this.prisma.closeFriend.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        friend: { select: { id: true, name: true, avatarUrl: true } },
      },
    })

    return {
      items: rows.map((r) => ({
        id: r.friend.id,
        name: r.friend.name,
        avatarUrl: r.friend.avatarUrl,
        addedAt: r.createdAt.toISOString(),
      })),
    }
  }

  async addCloseFriend(userId: string, friendId: string) {
    if (userId === friendId) {
      throw new BadRequestException("You cannot add yourself as a close friend")
    }

    const ok = await areMutualFriends(this.prisma, userId, friendId)
    if (!ok) {
      throw new ForbiddenException("Only mutual friends can be close friends")
    }

    const friend = await this.prisma.user.findUnique({ where: { id: friendId } })
    if (!friend) throw new NotFoundException("User not found")

    await this.prisma.closeFriend.upsert({
      where: { userId_friendId: { userId, friendId } },
      create: { userId, friendId },
      update: {},
    })
    return { ok: true }
  }

  async removeCloseFriend(userId: string, friendId: string) {
    await this.prisma.closeFriend.deleteMany({
      where: { userId, friendId },
    })
    return { ok: true }
  }
}
