import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import type { Prisma } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"
import { NotificationsGateway } from "../notifications/notifications.gateway.js"
import { NotificationsService } from "../notifications/notifications.service.js"
import { UpdateMeDto } from "./dto/update-me.dto.js"
import { getMutualFriendIds } from "./follow.helpers.js"

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
    private readonly notifGateway: NotificationsGateway
  ) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      // Cast to avoid TS server stale Prisma types in some editors.
      select: {
        id: true,
        name: true,
        email: true,
        avatarUrl: true,
        createdAt: true,
        role: true,
      } as Prisma.UserSelect,
    })
    if (!user) throw new NotFoundException("User not found")
    return user
  }

  async updateMe(userId: string, dto: UpdateMeDto) {
    if (dto.email) {
      const email = dto.email.trim().toLowerCase()
      const existing = await this.prisma.user.findUnique({ where: { email } })
      if (existing && existing.id !== userId) {
        throw new BadRequestException("Email already exists")
      }
      dto.email = email
    }

    return this.prisma.user.update({
      where: { id: userId },
      data: {
        ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
        ...(dto.email !== undefined ? { email: dto.email } : {}),
        ...(dto.avatarUrl !== undefined ? { avatarUrl: dto.avatarUrl } : {}),
      },
      select: { id: true, name: true, email: true, avatarUrl: true, createdAt: true },
    })
  }

  async getUserPublic(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, avatarUrl: true, createdAt: true, role: true },
    })
    if (!user) throw new NotFoundException("User not found")
    return user
  }

  async searchUsers(q: string, limit: number) {
    const query = q.trim()
    if (!query) return []
    const take = Math.min(Math.max(limit || 10, 1), 20)

    return this.prisma.user.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: "insensitive" } },
          { email: { contains: query, mode: "insensitive" } },
        ],
      },
      take,
      orderBy: { name: "asc" },
      select: { id: true, name: true, email: true, avatarUrl: true },
    })
  }

  /**
   * Browse + search for the discover page: empty `q` returns up to `limit` users (name asc).
   * Does not expose email (public directory).
   */
  async discoverUsers(q: string, limit: number) {
    const take = Math.min(Math.max(limit || 50, 1), 100)
    const query = q.trim()
    const where: Prisma.UserWhereInput =
      query.length > 0
        ? {
            OR: [
              { name: { contains: query, mode: "insensitive" } },
              { email: { contains: query, mode: "insensitive" } },
            ],
          }
        : {}

    return this.prisma.user.findMany({
      where,
      take,
      orderBy: { name: "asc" },
      select: { id: true, name: true, avatarUrl: true, role: true },
    })
  }

  async follow(viewerId: string, targetId: string) {
    if (viewerId === targetId) {
      throw new BadRequestException("Cannot follow yourself")
    }
    const target = await this.prisma.user.findUnique({ where: { id: targetId } })
    if (!target) throw new NotFoundException("User not found")
    await this.prisma.follow.upsert({
      where: {
        followerId_followingId: { followerId: viewerId, followingId: targetId },
      },
      create: { followerId: viewerId, followingId: targetId },
      update: {},
    })

    const created = await this.notifications.createOrAggregate({
      recipientId: targetId,
      actorId: viewerId,
      type: "FOLLOWED",
      targetKind: "user",
      targetId: targetId,
      meta: {},
    })
    if (created?.notif) {
      this.notifGateway.emitNewNotification(targetId, created.notif)
      this.notifGateway.emitUnreadCount(targetId, created.unread)
    }

    return { success: true }
  }

  async unfollow(viewerId: string, targetId: string) {
    await this.prisma.follow.deleteMany({
      where: { followerId: viewerId, followingId: targetId },
    })
    return { success: true }
  }

  async getRelationship(viewerId: string, targetId: string) {
    if (viewerId === targetId) {
      return {
        youFollow: false,
        followsYou: false,
        mutual: false,
        isSelf: true,
      }
    }
    const [out, inc] = await Promise.all([
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: viewerId, followingId: targetId },
        },
      }),
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: { followerId: targetId, followingId: viewerId },
        },
      }),
    ])
    const youFollow = !!out
    const followsYou = !!inc
    return {
      youFollow,
      followsYou,
      mutual: youFollow && followsYou,
      isSelf: false,
    }
  }

  async listMutualFriends(viewerId: string, q: string) {
    const mutual = await getMutualFriendIds(this.prisma, viewerId)
    const ids = [...mutual]
    if (ids.length === 0) return []

    const query = q.trim()
    return this.prisma.user.findMany({
      where: {
        id: { in: ids },
        ...(query
          ? {
              OR: [
                { name: { contains: query, mode: "insensitive" } },
                { email: { contains: query, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { name: "asc" },
      take: 40,
      select: { id: true, name: true, email: true, avatarUrl: true },
    })
  }
}

