import { IsString, Length, MaxLength, MinLength } from "class-validator"

export class ChangePasswordDto {
  @IsString()
  @MinLength(6)
  @MaxLength(72)
  currentPassword!: string

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  newPassword!: string

  @IsString()
  @MinLength(6)
  @MaxLength(72)
  confirmPassword!: string
}

export class ConfirmChangePasswordDto {
  @IsString()
  @Length(6, 6)
  otp!: string
}
