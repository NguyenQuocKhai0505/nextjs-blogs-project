import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"
import { CurrentSessionId } from "../common/decorators/current-session-id.decorator.js"
import { SessionsService } from "./session.service.js"

@Controller("auth")
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessions: SessionsService) {}

  @Get("sessions")
  list(@CurrentUserId() userId: string, @CurrentSessionId() sessionId: string) {
    return this.sessions.listActive(userId, sessionId)
  }

  @Delete("sessions/:id")
  async revokeOne(
    @CurrentUserId() userId: string,
    @CurrentSessionId() currentSessionId: string,
    @Param("id") id: string
  ) {
    if (id === currentSessionId) {
      throw new BadRequestException("Use logout to sign out of this device")
    }

    const revoked = await this.sessions.revoke(userId, id)
    if (!revoked) throw new NotFoundException("Session not found")
    return { message: "Session revoked" }
  }

  @Delete("sessions")
  async revokeOthers(
    @CurrentUserId() userId: string,
    @CurrentSessionId() currentSessionId: string
  ) {
    const count = await this.sessions.revokeOthers(userId, currentSessionId)
    return { message: `Signed out of ${count} other device(s)`, count }
  }

  @Post("logout")
  @HttpCode(200)
  async logout(@CurrentUserId() userId: string, @CurrentSessionId() sessionId: string) {
    await this.sessions.revoke(userId, sessionId)
    return { message: "Signed out" }
  }
}
