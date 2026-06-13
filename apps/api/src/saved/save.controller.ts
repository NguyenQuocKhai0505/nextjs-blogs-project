import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  UseGuards,
} from "@nestjs/common"
import { SavedService } from "./saved.service.js"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"

@Controller()
export class SavedController {
  constructor(private readonly saved: SavedService) {}

  @Get("saved")
  @UseGuards(JwtAuthGuard)
  list(@CurrentUserId() userId: string) {
    return this.saved.listSaved(userId)
  }

  @Get("posts/id/:postId/saved")
  @UseGuards(JwtAuthGuard)
  status(
    @CurrentUserId() userId: string,
    @Param("postId", ParseIntPipe) postId: number
  ) {
    return this.saved.getSavedStatus(postId, userId)
  }

  @Post("posts/id/:postId/save")
  @UseGuards(JwtAuthGuard)
  toggle(
    @CurrentUserId() userId: string,
    @Param("postId", ParseIntPipe) postId: number
  ) {
    return this.saved.toggleSaved(postId, userId)
  }
}
