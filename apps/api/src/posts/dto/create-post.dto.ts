import { Allow, IsOptional, IsString, MaxLength, MinLength } from "class-validator"

export class CreatePostDto {
  @IsString()
  @MinLength(3)
  @MaxLength(255)
  title!: string

  @IsString()
  @MinLength(3)
  @MaxLength(255)
  description!: string

  @IsString()
  @MinLength(1)
  content!: string

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
}

