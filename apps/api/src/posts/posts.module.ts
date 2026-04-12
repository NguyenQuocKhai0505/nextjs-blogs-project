import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { NotificationsModule } from "../notifications/notifications.module.js"
import { PostsController } from "./posts.controller.js"
import { PostsService } from "./posts.service.js"

@Module({
  imports: [JwtModule.register({}), NotificationsModule],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}

