import { Module } from "@nestjs/common"
import { HealthController } from "./health.controller.js"
import { ConfigModule } from "@nestjs/config"
import { PrismaModule } from "../prisma/prisma.module.js"
import { AuthModule } from "../auth/auth.module.js"
import { PostsModule } from "../posts/posts.module.js"
import { UploadModule } from "../upload/upload.module.js"

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    PostsModule,
    UploadModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}

