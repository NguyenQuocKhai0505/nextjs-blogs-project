import { ReportReason, ReportTargetKind } from "@prisma/client"
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator"

export class CreateReportDto {
  @IsEnum(ReportTargetKind)
  targetKind!: ReportTargetKind

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  targetId!: string

  @IsEnum(ReportReason)
  reason!: ReportReason

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  details?: string
}
