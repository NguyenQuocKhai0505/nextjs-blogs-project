import { ReactionType } from "@prisma/client"
import { IsEnum } from "class-validator"

export class SetStoryReactionDto {
  @IsEnum(ReactionType)
  reaction!: ReactionType
}
