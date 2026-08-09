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

    //CREATE A NEW MOMENT 
    async create(userId:string, dto:CreateMomentDto){
        const imageUrl = dto.imageUrl?.trim()

        if(!imageUrl){
            throw new BadRequestException("Image URL is required")
        }
        const caption = dto.caption?.trim() || null
        const row = await this.prisma.moment.create({
            data:{authorId: userId, imageUrl,caption},
            include:{
                author: true
            }
        })

        return {
            id: row.id,
            imageUrl: row.imageUrl,
            caption: row.caption,
            createdAt: row.createdAt,
            author: row.authorId
        }
    }

    //GET ALL MOMENTS
    async getFeed(viewerId:string){
        const owners = await this.prisma.closeFriend.findMany({
            where:{friendId: viewerId},
            select:{
                userId: true
            }
        })
        const authorIds = [...new Set([viewerId, ...owners.map((o) => o.userId)])]

        const rows = await this.prisma.moment.findMany({
            where:{authorId: {in:authorIds}},
            orderBy:{createdAt: "desc"},
            take: 50,
            include:{
                author: {select: {id: true, name: true, avatarUrl: true}},
                views:{
                    where:{viewerId: viewerId},
                    select:{id:true},
                    take:1,
                }
            }
        })
        return rows.map((r)=>({
            id: r.id,
            imageUrl: r.imageUrl,
            caption: r.caption,
            createdAt: r.createdAt,
            author: r.author,
            views: r.views.length > 0 ? r.views[0].id : null
        }))
    }
    //MARK VIEW 
    async 
    

  }