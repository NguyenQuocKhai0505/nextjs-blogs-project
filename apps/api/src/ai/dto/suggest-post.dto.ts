import { IsArray, IsIn, IsOptional, IsString, MaxLength, MinLength } from "class-validator"

export class SuggestPostDto {
  @IsString()
  @MinLength(5)
  @MaxLength(2000)
  brief!: string

  @IsOptional()
  @IsIn(["en", "ko", "vi"])
  locale?: "en" | "ko" | "vi"

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(80, { each: true })
  categoryNames?: string[]
}
