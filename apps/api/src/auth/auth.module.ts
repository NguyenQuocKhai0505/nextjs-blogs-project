import { Module } from "@nestjs/common"
import { JwtModule } from "@nestjs/jwt"
import { PassportModule } from "@nestjs/passport"
import { AuthController } from "./auth.controller.js"
import { AuthService } from "./auth.service.js"
import { GoogleStrategy } from "./strategies/google.strategies.js"
import { MailModule } from "../mail/email.module.js"

@Module({
  imports: [
    JwtModule.register({}),
    PassportModule.register({ session: false }),
    MailModule,
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
