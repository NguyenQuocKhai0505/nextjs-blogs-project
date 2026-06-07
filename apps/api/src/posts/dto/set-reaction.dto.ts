import { ReactionType } from "@prisma/client"
import { IsEnum } from "class-validator"

export class SetReactionDto {
  @IsEnum(ReactionType)
  reaction!: ReactionType
}
