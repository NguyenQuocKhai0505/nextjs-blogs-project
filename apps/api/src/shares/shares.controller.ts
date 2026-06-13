import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common"
import { SharesService } from "./shares.service.js"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"
import { ToggleShareDto } from "./dto/toggle-share.dto.js"

@Controller()
export class SharesController {
  constructor(private readonly shares: SharesService) {}

  @Get("shared")
  @UseGuards(JwtAuthGuard)
  list(@CurrentUserId() userId: string) {
    return this.shares.listShared(userId)
  }

  @Get("posts/id/:postId/shared")
  @UseGuards(JwtAuthGuard)
  status(
    @CurrentUserId() userId: string,
    @Param("postId", ParseIntPipe) postId: number
  ) {
    return this.shares.getShareStatus(postId, userId)
  }

  @Post("posts/id/:postId/share")
  @UseGuards(JwtAuthGuard)
  toggle(
    @CurrentUserId() userId: string,
    @Param("postId", ParseIntPipe) postId: number,
    @Body() dto: ToggleShareDto
  ) {
    return this.shares.toggleShare(postId, userId, dto.caption)
  }
}
