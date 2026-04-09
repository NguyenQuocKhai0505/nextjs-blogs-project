import { Type } from "class-transformer"
import { IsInt, IsOptional, IsString, MaxLength, Min, MinLength } from "class-validator"

export class CreateCommentDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  content!: string

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  parentId?: number
}
