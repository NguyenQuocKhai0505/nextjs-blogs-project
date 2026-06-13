import { IsIn, IsString, MaxLength } from "class-validator"

export class TranslateDto {
  @IsString()
  @MaxLength(4000)
  text!: string

  @IsIn(["en", "ko", "vi"])
  targetLanguage!: "en" | "ko" | "vi"
}
