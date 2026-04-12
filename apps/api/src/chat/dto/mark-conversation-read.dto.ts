import { IsInt, IsOptional, Min } from "class-validator"

export class MarkConversationReadDto {
  /** If omitted, marks up to the latest message in the conversation. */
  @IsOptional()
  @IsInt()
  @Min(1)
  lastReadMessageId?: number
}
