import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { ReelsController } from "./reel.controller.js"
import { ReelsService } from "./reel.service.js"

@Module({
  imports: [JwtModule.register({})],
  controllers: [ReelsController],
  providers: [ReelsService],
})
export class ReelsModule {}
