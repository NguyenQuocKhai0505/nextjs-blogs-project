import {
    Body,
    Controller,
    Delete,
    Get,
    Param,
    ParseIntPipe,
    Post,
    UseGuards,
  } from "@nestjs/common"
  import { MomentsService } from "./moment.service.js"
  import { CreateMomentDto } from "./dto/create-moment.dto.js"
  import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
  import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"

  @Controller("moments")
  export class MomentController{
    constructor(private readonly momentsService: MomentsService){}

    //GET
    @Get("feed")
    @UseGuards(JwtAuthGuard)
    feed(@CurrentUserId() userId: string){
        return this.momentsService.getFeed(userId)
    }

    @Get("close-friends")
    @UseGuards(JwtAuthGuard)
    listCloseFriends(@CurrentUserId() userId: string){
        return this.momentsService.listCloseFriends(userId)
    }

    @Post("close-friends/:friendId")
    @UseGuards(JwtAuthGuard)
    addCloseFriend(
        @CurrentUserId() userId: string,
        @Param("friendId") friendId: string,
    ){
        return this.momentsService.addCloseFriend(userId, friendId)
    }

    @Delete("close-friends/:friendId")
    @UseGuards(JwtAuthGuard)
    removeCloseFriend(
        @CurrentUserId() userId: string,
        @Param("friendId") friendId: string,
    ){
        return this.momentsService.removeCloseFriend(userId, friendId)
    }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(@CurrentUserId() userId: string, @Body() dto: CreateMomentDto){
        return this.momentsService.create(userId, dto)
    }

    @Post(":id/view")
    @UseGuards(JwtAuthGuard)
    markView(@CurrentUserId() userId: string, @Param("id", ParseIntPipe) momentId: number){
        return this.momentsService.markView(momentId, userId)
    }

    @Get(":id/viewers")
    @UseGuards(JwtAuthGuard)
    listViewers(@CurrentUserId() userId: string, @Param("id", ParseIntPipe) momentId: number){
        return this.momentsService.listViewers(momentId, userId)
    }

    @Delete(":id")
    @UseGuards(JwtAuthGuard)
    remove(@CurrentUserId() userId: string, @Param("id", ParseIntPipe) momentId: number){
        return this.momentsService.remove(momentId, userId)
    }
  }