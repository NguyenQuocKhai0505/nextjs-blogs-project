import {
  Body,
  Controller,
  Get,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common"
import { AuthService } from "./auth.service.js"
import { RegisterDto } from "./dto/register.dto.js"
import { LoginDto } from "./dto/login.dto.js"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard.js"
import { CurrentUserId } from "../common/decorators/current-user-id.decorator.js"
import { GoogleAuthGuard } from "./google-auth.guard.js"
import type { Request, Response } from "express"
@Controller("auth")
export class AuthController {
  private readonly auth: AuthService

  // NOTE: Don't rely on TS parameter properties here.
  // Some TS runtime transpilers can fail to emit assignments for them,
  // causing `this.auth` to be undefined at runtime.
  constructor(auth: AuthService) {
    this.auth = auth
  }

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

  @Get("google")
  @UseGuards(GoogleAuthGuard)
  googleAuth() {
    return
  }

  @Get("google/callback")
  @UseGuards(GoogleAuthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const oauthUser = req.user as unknown
    if (!oauthUser) {
      throw new UnauthorizedException(
        "Google OAuth failed: missing user payload. Check GOOGLE_* env and callback URL."
      )
    }
    const { accessToken } = await this.auth.loginWithOAuth(
      oauthUser as {
        provider: "google"
        providerAccountId: string
        email: string | null
        name: string
        avatarUrl: string | null
      }
    )
    const redirectUrl =
      process.env.WEB_AUTH_CALLBACK_URL ?? "http://localhost:3000/auth/callback"
    return res.redirect(`${redirectUrl}?token=${encodeURIComponent(accessToken)}`)
  }
}

