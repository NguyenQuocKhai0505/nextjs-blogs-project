import { ReactionType } from "@prisma/client"
import { IsEnum } from "class-validator"

export class SetReelReactionDto {
  @IsEnum(ReactionType)
  reaction!: ReactionType
}