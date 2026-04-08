import { IsOptional, IsString, MaxLength, MinLength } from "class-validator"

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
}

