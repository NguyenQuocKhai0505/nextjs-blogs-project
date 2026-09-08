import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"

import { CategoriesModule } from "../categories/categories.module.js"
import { NotificationsModule } from "../notifications/notifications.module.js"
import { AdminCategoriesController } from "./categories/admin-categories.controller.js"
import { AdminDashboardController } from "./dashboard/admin-dashboard.controller.js"
import { AdminDashboardService } from "./dashboard/admin-dashboard.service.js"
import { AdminPostsController } from "./posts/admin-posts.controller.js"
import { AdminPostsService } from "./posts/admin-posts.service.js"

/**
 * Admin BFF surface inside the API monolith.
 * Feature folders (dashboard / categories / posts) keep boundaries clear
 * so they can later be split into separate services if needed.
 */
@Module({
  imports: [
    CategoriesModule,
    NotificationsModule,
    JwtModule.register({}),
  ],
  controllers: [
    AdminDashboardController,
    AdminCategoriesController,
    AdminPostsController,
  ],
  providers: [AdminDashboardService, AdminPostsService],
})
export class AdminModule {}
