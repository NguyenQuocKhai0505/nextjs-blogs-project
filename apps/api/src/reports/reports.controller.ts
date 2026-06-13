import {
  Body,
  Controller,
  Get,
  Param,
  ParseEnumPipe,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common"
import { ReportStatus } from "@prisma/client"
import { ReportsService } from "./reports.service.js"
import { CreateReportDto } from "./dto/create-report.dto.js"
import { UpdateReportStatusDto } from "./dto/update-report-status.dto.js"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"

@Controller("reports")
export class ReportsController {
  constructor(private readonly reports: ReportsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@CurrentUserId() userId: string, @Body() dto: CreateReportDto) {
    return this.reports.create(userId, dto)
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  list(
    @CurrentUserId() userId: string,
    @Query(
      "status",
      new ParseEnumPipe(ReportStatus, { optional: true })
    )
    status?: ReportStatus
  ) {
    return this.reports.listForAdmin(userId, status)
  }

  @Patch(":id")
  @UseGuards(JwtAuthGuard)
  updateStatus(
    @CurrentUserId() userId: string,
    @Param("id", ParseIntPipe) id: number,
    @Body() dto: UpdateReportStatusDto
  ) {
    return this.reports.updateStatus(userId, id, dto)
  }
}
