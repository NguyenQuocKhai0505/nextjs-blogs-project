import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"

import { AiController } from "./ai.controller.js"
import { AiService } from "./ai.service.js"

@Module({
  imports: [JwtModule.register({})],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
