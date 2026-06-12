import { IsString, IsNotEmpty, IsOptional, IsUrl,MaxLength } from "class-validator"

export class CreateReelDto{
    @IsString()
    @IsUrl()
    videoUrl!: string

    @IsOptional()
    @IsString()
    @MaxLength(500)
    caption?: string
}

