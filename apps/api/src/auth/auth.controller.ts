import { Body, Controller, Post, UseGuards } from "@nestjs/common"
import { AuthService } from "./auth.service.js"
import { RegisterDto } from "./dto/register.dto.js"
import { LoginDto } from "./dto/login.dto.js"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto)
  }

  @Post("login")
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto)
  }

  @Post("socket-token")
  @UseGuards(JwtAuthGuard)
  socketToken(@CurrentUserId() userId: string) {
    return this.auth.issueSocketToken(userId)
  }
}

