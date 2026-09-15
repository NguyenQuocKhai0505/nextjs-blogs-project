import { Injectable } from "@nestjs/common"
import { Prisma, UserRole } from "@prisma/client"
import { PrismaService } from "../../prisma/prisma.service.js"


@Injectable()
export class AdminUsersService{
    constructor(private readonly prisma: PrismaService){}
    async listUser(opts:{
        q?:string,
        role?:string 
        page?:number
        limit?:number 
    }){
        // Pagination: page>=1, limit 1...50
        const page = Math.max(1,Number.isFinite(opts.page) ? Number(opts.page) : 1 )
        const rawLimit = Number.isFinite(opts.limit) ? Number(opts.limit) : 20
        const limit = Math.min(50, Math.max(1, rawLimit))

        const q = opts.q?.trim() || undefined 

        //Only recieve enum values, if wrong -> throw filter
        const roleFilter =
        opts.role === UserRole.USER || opts.role === UserRole.ADMIN
        ? (opts.role as UserRole)
        : undefined 

        //Prisma where: type safe 
        const where: Prisma.UserWhereInput = {
            ...(roleFilter ? { role: roleFilter } : {}),
            ...(q
              ? {
                  OR: [
                    { name: { contains: q, mode: "insensitive" } },
                    { email: { contains: q, mode: "insensitive" } },
                  ],
                }
              : {}),
          }
        const [total, rows] = await Promise.all([
            this.prisma.user.count({where}),
            this.prisma.user.findMany({
                where,
                orderBy: { createdAt: "desc" },
                skip: (page - 1)* limit,
                take: limit,
                select:{
                    id: true,
                    name: true,
                    email:true,
                    role: true,
                    avatarUrl: true,
                    createdAt: true,
                    lastSeenAt: true,
                    _count: {select: {posts: true}}
                }
            })
        ])
        return {
            items: rows.map((u)=>({
                userId: u.id,
                name: u.name,
                email: u.email,
                role: u.role,
                avatarUrl: u.avatarUrl,
                createdAt: u.createdAt,
                lastSeenAt: u.lastSeenAt,
                postCount: u._count.posts,
            })),
            page,
            limit,
            total, 
            totalPages: Math.max(1, Math.ceil(total/limit)),
        }
        }
}