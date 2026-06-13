import { IsOptional, IsString, MaxLength } from "class-validator"

export class ToggleShareDto {
  @IsOptional()
  @IsString()
  @MaxLength(500)
  caption?: string
}
