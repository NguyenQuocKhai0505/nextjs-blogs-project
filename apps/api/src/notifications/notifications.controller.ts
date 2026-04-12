import { Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js";
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js";
import { NotificationsService } from "./notifications.service.js";

@UseGuards(JwtAuthGuard)
@Controller("app-notifications")
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  async list(
    @CurrentUserId() userId: string,
    @Query("cursor") cursor?: string,
    @Query("take") take?: string,
  ) {
    return this.notifications.listForUser(userId, {
      cursor: cursor ? Number(cursor) : undefined,
      take: take ? Math.min(50, Math.max(1, Number(take))) : 20,
    });
  }

  @Get("unread-count")
  async unreadCount(@CurrentUserId() userId: string) {
    return this.notifications.getUnreadCount(userId);
  }

  @Post("mark-all-read")
  async markAllRead(@CurrentUserId() userId: string) {
    return this.notifications.markAllRead(userId);
  }
}