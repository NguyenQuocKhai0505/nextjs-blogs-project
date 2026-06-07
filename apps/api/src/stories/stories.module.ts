import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { StoriesController } from "./stories.controller.js"
import { StoriesService } from "./stories.service.js"

@Module({
  imports: [JwtModule.register({})],
  controllers: [StoriesController],
  providers: [StoriesService],
})
export class StoriesModule {}
