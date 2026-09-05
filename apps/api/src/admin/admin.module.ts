import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"

import { CategoriesModule } from "../categories/categories.module.js"
import { AdminCategoriesController } from "./admin-categories.controller.js"
import { AdminController } from "./admin.controller.js"
import { AdminService } from "./admin.service.js"

@Module({
  // JwtModule needed so JwtAuthGuard (used on admin controllers) can inject JwtService
  imports: [CategoriesModule, JwtModule.register({})],
  controllers: [AdminController, AdminCategoriesController],
  providers: [AdminService],
})
export class AdminModule {}
