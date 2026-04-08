import { ForbiddenException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service.js"
import { CreatePostDto } from "./dto/create-post.dto.js"
import { UpdatePostDto } from "./dto/update-post.dto.js"

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

@Injectable()
export class PostsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    return this.prisma.post.findMany({
      orderBy: { createdAt: "desc" },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    })
  }

  async getBySlug(slug: string) {
    const post = await this.prisma.post.findFirst({
      where: { slug },
      include: { author: { select: { id: true, name: true, avatarUrl: true } } },
    })
    if (!post) throw new NotFoundException("Post not found")
    return post
  }

  async create(userId: string, dto: CreatePostDto) {
    const baseSlug = slugify(dto.title)
    let slug = baseSlug
    let i = 1
    // ensure uniqueness without DB constraint
    while (await this.prisma.post.findFirst({ where: { slug } })) {
      i += 1
      slug = `${baseSlug}-${i}`
    }

    return this.prisma.post.create({
      data: {
        title: dto.title,
        description: dto.description,
        content: dto.content,
        slug,
        authorId: userId,
      },
    })
  }

  async update(userId: string, id: number, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({ where: { id } })
    if (!post) throw new NotFoundException("Post not found")
    if (post.authorId !== userId) throw new ForbiddenException("Not allowed")

    const data: Record<string, unknown> = {
      ...dto,
    }

    if (dto.title && dto.title !== post.title) {
      const baseSlug = slugify(dto.title)
      let slug = baseSlug
      let i = 1
      while (await this.prisma.post.findFirst({ where: { slug } })) {
        i += 1
        slug = `${baseSlug}-${i}`
      }
      data.slug = slug
    }

    return this.prisma.post.update({
      where: { id },
      data,
    })
  }

  async remove(userId: string, id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } })
    if (!post) throw new NotFoundException("Post not found")
    if (post.authorId !== userId) throw new ForbiddenException("Not allowed")
    await this.prisma.post.delete({ where: { id } })
    return { success: true }
  }
}

