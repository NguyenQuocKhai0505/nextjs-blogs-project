import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { ReportsController } from "./reports.controller.js"
import { ReportsService } from "./reports.service.js"

@Module({
  imports: [JwtModule.register({})],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
