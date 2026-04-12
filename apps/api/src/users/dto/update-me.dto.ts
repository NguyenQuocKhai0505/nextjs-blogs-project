import { IsEmail, IsOptional, IsString, MaxLength } from "class-validator"

export class UpdateMeDto {
  @IsOptional()
  @IsString()
  @MaxLength(120)
  name?: string

  @IsOptional()
  @IsEmail()
  @MaxLength(255)
  email?: string

  @IsOptional()
  @IsString()
  @MaxLength(5000)
  avatarUrl?: string | null

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  bio?: string | null
}

