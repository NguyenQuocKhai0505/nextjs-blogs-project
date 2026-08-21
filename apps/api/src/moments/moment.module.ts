import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { MomentController } from "./moment.controller.js"
import { MomentsService } from "./moment.service.js"

@Module({
  imports: [JwtModule.register({})],
  controllers: [MomentController],
  providers: [MomentsService],
  exports: [MomentsService],
})
export class MomentsModule {}