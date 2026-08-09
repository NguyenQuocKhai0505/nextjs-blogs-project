import { IsOptional, IsString, MaxLength, MinLength } from "class-validator";

export class CreateMomentDto{
    @IsString()
    @MinLength(1)
    imageUrl!:string

    @IsOptional()
    @IsString()
    @MinLength(1)
    @MaxLength(300)
    caption?:string
}