import { Type } from "class-transformer"
import { ArrayMaxSize, IsArray, IsIn, IsString, MaxLength, ValidateNested } from "class-validator"

export class ChatMessageDto {
  @IsIn(["user", "assistant"])
  role!: "user" | "assistant"

  @IsString()
  @MaxLength(8000)
  content!: string
}

export class ChatDto {
  @IsArray()
  @ArrayMaxSize(40)
  @ValidateNested({ each: true })
  @Type(() => ChatMessageDto)
  messages!: ChatMessageDto[]
}
