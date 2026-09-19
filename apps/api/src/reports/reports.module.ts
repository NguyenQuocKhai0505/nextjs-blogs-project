import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { AiModule } from "../ai/ai.module.js"
import { ReportsController } from "./reports.controller.js"
import { ReportsService } from "./reports.service.js"

@Module({
  imports: [JwtModule.register({}), AiModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}