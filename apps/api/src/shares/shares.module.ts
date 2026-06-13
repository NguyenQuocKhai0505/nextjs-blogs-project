import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { SharesController } from "./shares.controller.js"
import { SharesService } from "./shares.service.js"

@Module({
  imports: [JwtModule.register({})],
  controllers: [SharesController],
  providers: [SharesService],
})
export class SharesModule {}
