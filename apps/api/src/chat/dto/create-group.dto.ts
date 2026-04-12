import { ArrayMaxSize, ArrayMinSize, IsArray, IsString, MaxLength, MinLength } from "class-validator"

export class CreateGroupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title!: string

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(40)
  @IsString({ each: true })
  memberIds!: string[]
}
