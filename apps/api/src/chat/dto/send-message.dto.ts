import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from "class-validator"

export class SendMessageDto {
  @IsInt()
  @Min(1)
  conversationId!: number

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  content?: string

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  imageUrl?: string

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  videoUrl?: string

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  audioUrl?: string

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  audioDurationSec?: number
}
