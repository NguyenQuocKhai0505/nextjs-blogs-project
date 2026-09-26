import { IsEmail, IsString, Length, MaxLength, MinLength } from "class-validator"

export class ForgotPasswordDto {
  @IsEmail()
  @MaxLength(254)
  email!: string
}

export class ResetPasswordDto {
  @IsEmail()
  @MaxLength(254)
  email!: string

  @IsString()
  @Length(6, 6)
  otp!: string

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  newPassword!: string

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  confirmPassword!: string
}
