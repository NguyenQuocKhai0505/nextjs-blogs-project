import { IsOptional, IsString, MaxLength } from "class-validator"

export class CreateStoryDto {
  @IsOptional()
  @IsString()
  imageUrl?: string

  @IsOptional()
  @IsString()
  videoUrl?: string

  @IsOptional()
  @IsString()
  @MaxLength(500)
  textContent?: string

  @IsOptional()
  @IsString()
  @MaxLength(32)
  backgroundColor?: string
}
