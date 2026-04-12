import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"

import { PrismaService } from "../prisma/prisma.service.js"
import { CreateCategoryDto } from "./dto/create-category.dto.js"
import { UpdateCategoryDto } from "./dto/update-category.dto.js"

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return (this.prisma as any).category.findMany({
      orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    })
  }

  /**
   * Categories with the most posts in the last `days` (for sidebar “trending”).
   */
  async findTrending(days = 7, limit = 5) {
    const d = Math.min(Math.max(Math.floor(days), 1), 90)
    const l = Math.min(Math.max(Math.floor(limit), 1), 20)
    const since = new Date()
    since.setTime(since.getTime() - d * 86_400_000)

    const grouped = await this.prisma.post.groupBy({
      by: ["categoryId"],
      where: {
        categoryId: { not: null },
        createdAt: { gte: since },
      },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: l,
    })

    const ids = grouped
      .map((g) => g.categoryId)
      .filter((id): id is number => id != null)
    if (ids.length === 0) return []

    const cats = await this.prisma.category.findMany({
      where: { id: { in: ids } },
      select: { id: true, name: true, slug: true },
    })
    const byId = new Map(cats.map((c) => [c.id, c]))

    return grouped
      .map((g) => {
        if (g.categoryId == null) return null
        const c = byId.get(g.categoryId)
        if (!c) return null
        return {
          id: c.id,
          name: c.name,
          slug: c.slug,
          postCount: g._count.id,
        }
      })
      .filter((row): row is { id: number; name: string; slug: string; postCount: number } => row != null)
  }

  private async assertAdmin(userId: string) {
    const u = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true } as any,
    })
    if ((u as any)?.role !== "ADMIN") throw new ForbiddenException("Admin only")
  }

  private async assertUniqueSlug(slug: string, excludeId?: number) {
    const found = await (this.prisma as any).category.findFirst({
      where: {
        slug,
        ...(excludeId != null ? { NOT: { id: excludeId } } : {}),
      },
      select: { id: true },
    })
    if (found) throw new BadRequestException("Category slug already exists")
  }

  async create(userId: string, dto: CreateCategoryDto) {
    await this.assertAdmin(userId)
    const name = dto.name.trim()
    const slug = (dto.slug?.trim() ? dto.slug.trim() : slugify(name)).slice(0, 100)
    if (!slug) throw new BadRequestException("Invalid slug")
    await this.assertUniqueSlug(slug)
    return (this.prisma as any).category.create({
      data: {
        name,
        slug,
        sortOrder: dto.sortOrder ?? 0,
      },
    })
  }

  async update(userId: string, id: number, dto: UpdateCategoryDto) {
    await this.assertAdmin(userId)
    const existing = await (this.prisma as any).category.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException("Category not found")

    const nextName = dto.name !== undefined ? dto.name.trim() : undefined
    const nextSlugRaw =
      dto.slug !== undefined ? dto.slug.trim() : nextName ? slugify(nextName) : undefined
    const nextSlug = nextSlugRaw ? nextSlugRaw.slice(0, 100) : undefined
    if (nextSlug !== undefined) {
      if (!nextSlug) throw new BadRequestException("Invalid slug")
      await this.assertUniqueSlug(nextSlug, id)
    }

    return (this.prisma as any).category.update({
      where: { id },
      data: {
        ...(nextName !== undefined ? { name: nextName } : {}),
        ...(nextSlug !== undefined ? { slug: nextSlug } : {}),
        ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
      },
    })
  }

  async remove(userId: string, id: number) {
    await this.assertAdmin(userId)
    const existing = await (this.prisma as any).category.findUnique({ where: { id } })
    if (!existing) throw new NotFoundException("Category not found")
    await (this.prisma as any).category.delete({ where: { id } })
    return { success: true }
  }
}
