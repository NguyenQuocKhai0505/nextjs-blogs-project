import { IsString, Length, Matches, MaxLength } from "class-validator"

export class LoginTwoFactorDto {
  @IsString()
  @MaxLength(2048)
  challengeToken!: string

  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  otp!: string
}

export class TwoFactorCodeDto {
  @IsString()
  @Length(6, 6)
  @Matches(/^\d{6}$/)
  otp!: string
}