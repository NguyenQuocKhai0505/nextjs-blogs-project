import { Type } from "class-transformer"
import { Allow, IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator"

export class UpdatePostDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title?: string

  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  description?: string

  @IsOptional()
  @IsString()
  @MinLength(1)
  content?: string

  @IsOptional()
  @Allow()
  @IsString()
  @MaxLength(20000)
  imageUrls?: string | null

  @IsOptional()
  @Allow()
  @IsString()
  @MaxLength(20000)
  videoUrls?: string | null

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  categoryId?: number
}

