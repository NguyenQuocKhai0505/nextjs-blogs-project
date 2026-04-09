import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"

import { PrismaModule } from "../prisma/prisma.module.js"
import { CategoriesController } from "./categories.controller.js"
import { CategoriesService } from "./categories.service.js"

@Module({
  imports: [PrismaModule, JwtModule.register({})],
  controllers: [CategoriesController],
  providers: [CategoriesService],
})
export class CategoriesModule {}
