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
