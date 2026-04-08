import { IsString, MaxLength, MinLength } from "class-validator"

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
}

