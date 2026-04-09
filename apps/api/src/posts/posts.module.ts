import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { PostsController } from "./posts.controller.js"
import { PostsService } from "./posts.service.js"

@Module({
  imports: [JwtModule.register({})],
  controllers: [PostsController],
  providers: [PostsService],
})
export class PostsModule {}

