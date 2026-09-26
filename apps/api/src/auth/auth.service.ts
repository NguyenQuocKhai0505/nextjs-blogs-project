import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { OtpPurpose, UserRole } from "@prisma/client"
import { PrismaService } from "../prisma/prisma.service.js"
import { RegisterDto } from "./dto/register.dto.js"
import { LoginDto } from "./dto/login.dto.js"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"
import { ChangePasswordDto, ConfirmChangePasswordDto } from "./dto/change-password.dto.js"
import { MailService } from "../mail/email.service.js"
import { ForgotPasswordDto, ResetPasswordDto } from "./dto/forgot-password.dto.js"

const MAX_OTP_ATTEMPTS = 5

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly mail: MailService
  ) {}

  async register(dto: RegisterDto) {
    const email = dto.email.trim().toLowerCase()

    const existing = await this.prisma.user.findUnique({ where: { email } })
    if (existing) throw new BadRequestException("Email already exists")

    const userId = randomUUID()
    const passwordHash = await bcrypt.hash(dto.password, 10)

    await this.prisma.user.create({
      data: {
        id: userId,
        name: dto.name.trim(),
        email,
        emailVerified: false,
        role: UserRole.USER,
        accounts: {
          create: {
            id: randomUUID(),
            accountId: email,
            providerId: "credentials",
            password: passwordHash,
          },
        },
      },
    })

    return this.issueTokens(userId)
  }

  async login(dto: LoginDto) {
    const email = dto.email.trim().toLowerCase()

    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { accounts: true },
    })
    if (!user) {
      throw new UnauthorizedException("Account does not exist")
    }

    const account =
      user.accounts.find(
        (a: { providerId: string }) => a.providerId === "credentials"
      ) ?? null
    if (!account) {
      throw new UnauthorizedException(
        "This account has no password login. Use Google/Facebook, or contact support."
      )
    }
    if (!account.password) {
      throw new UnauthorizedException(
        "Password login not available for this account. Use Google/Facebook login."
      )
    }

    const ok = await bcrypt.compare(dto.password, account.password)
    if (!ok) {
      throw new UnauthorizedException("Incorrect password")
    }

    return this.issueTokens(user.id)
  }
  async requestChangePassword(userId: string, dto: ChangePasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(
        "New password and confirm password do not match"
      )
    }

    if (dto.currentPassword === dto.newPassword) {
      throw new BadRequestException(
        "New password cannot be the same as the current password"
      )
    }

    const account = await this.prisma.account.findFirst({
      where: { userId, providerId: "credentials" },
    })
    if (!account?.password) {
      throw new BadRequestException(
        "This account has no password login. Use Google/Facebook."
      )
    }

    const ok = await bcrypt.compare(dto.currentPassword, account.password)
    if (!ok) {
      throw new UnauthorizedException("Incorrect password")
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (!user?.email) {
      throw new BadRequestException("User email not found")
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000))
    const codeHash = await bcrypt.hash(otp, 10)
    const pendingPasswordHash = await bcrypt.hash(dto.newPassword, 10)

    await this.prisma.passwordOtp.updateMany({
      where: { userId,purpose: OtpPurpose.CHANGE_PASSWORD, usedAt: null },
      data: { usedAt: new Date() },
    })

    await this.prisma.passwordOtp.create({
      data: {
        userId,
        purpose: OtpPurpose.CHANGE_PASSWORD,
        codeHash,
        pendingPasswordHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    })

    await this.mail.sendMail({
      to: user.email,
      subject: "Ksocial password change code",
      html: `<p>Your verification code is <b>${otp}</b>.</p>
             <p>This code is valid for 10 minutes.</p>
             <p>If you did not request this, ignore this email.</p>`,
    })

    return { message: "OTP sent to your email" }
  }

  async confirmChangePassword(userId: string, dto: ConfirmChangePasswordDto) {
    const otpRow = await this.prisma.passwordOtp.findFirst({
      where: {
        userId,
        purpose: OtpPurpose.CHANGE_PASSWORD,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
    })
    if (!otpRow?.pendingPasswordHash) {
      throw new BadRequestException("OTP expired or not found. Request a new one.")
    }

    const otpOk = await bcrypt.compare(dto.otp.trim(), otpRow.codeHash)
    if (!otpOk) {
      throw new UnauthorizedException("Invalid OTP")
    }

    const account = await this.prisma.account.findFirst({
      where: { userId, providerId: "credentials" },
    })
    if (!account) {
      throw new BadRequestException(
        "This account has no password login. Use Google/Facebook."
      )
    }

    await this.prisma.account.update({
      where: { id: account.id },
      data: { password: otpRow.pendingPasswordHash },
    })

    await this.prisma.passwordOtp.update({
      where: { id: otpRow.id },
      data: { usedAt: new Date() },
    })

    const user = await this.prisma.user.findUnique({ where: { id: userId } })
    if (user?.email) {
      await this.mail.sendMail({
        to: user.email,
        subject: "Your Ksocial password was changed",
        html: `<p>Your account password was changed successfully.</p>
               <p>If this wasn't you, reset your password or contact support immediately.</p>
               <p>Time: ${new Date().toISOString()}</p>`,
      })
    }

    return { message: "Password changed successfully" }
  }

  async forgotPassword(dto: ForgotPasswordDto){
    const email = dto.email.trim().toLowerCase()
    const response = {
      message: "If this email is registered, a reset code has been sent to your email"
    }
    const user = await this.prisma.user.findUnique({where: {email}})
    if(!user) return response

    const account = await this.prisma.account.findFirst({where:{userId: user.id, providerId: "credentials"}})
    if(!account) return response 

    const otp = String(Math.floor(100000 + Math.random()*900000))
    const codeHash = await bcrypt.hash(otp,10)

    await this.prisma.passwordOtp.updateMany({
      where:{userId: user.id, purpose: OtpPurpose.RESET_PASSWORD,usedAt: null},
      data: {usedAt: new Date()}
    })
    await this.prisma.passwordOtp.create({
      data:{
        userId: user.id ,
        purpose: OtpPurpose.RESET_PASSWORD,
        codeHash,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      }
    })

    await this.mail.sendMail({
      to: user.email,
      subject: "Ksocial password reset code",
      html: `<p>Your verification code is <b>${otp}</b>.</p>
             <p>This code is valid for 10 minutes.</p>
             <p>If you did not request this, ignore this email.</p>`,
    })
    return response
  }

  async resetPassword(dto: ResetPasswordDto){
    if(dto.newPassword !== dto.confirmPassword){
      throw new BadRequestException("New Password and Confirm Password do not match")
    }
    const email =dto. email.trim().toLowerCase()
    const invalidCode = new BadRequestException("Invalid or expired code")

    const user = await this.prisma.user.findUnique({where: {email}})
    if(!user) throw  invalidCode

    const otpRow = await this.prisma.passwordOtp.findFirst({where:{userId: user.id, purpose: OtpPurpose.RESET_PASSWORD, usedAt: null, expiresAt: {gt: new Date()}}, orderBy: {createdAt: "desc"}})
    if(!otpRow) throw invalidCode

    if (otpRow.attempts >= MAX_OTP_ATTEMPTS) {
      await this.prisma.passwordOtp.update({
        where: { id: otpRow.id },
        data: { usedAt: new Date() },
      })
      throw new BadRequestException("Too many attempts. Request a new code.")
    }
    
    const otpOk = await bcrypt.compare(dto.otp.trim(), otpRow.codeHash)
    if (!otpOk) {
      await this.prisma.passwordOtp.update({
        where: { id: otpRow.id },
        data: { attempts: { increment: 1 } },
      })
      throw invalidCode
    }

    const account = await this.prisma.account.findFirst({
      where:{userId: user.id, providerId: "credentials"}
    })

    if(!account) throw invalidCode
    const passwordHash = await bcrypt.hash(dto.newPassword,10)

    await this.prisma.$transaction([
      this.prisma.account.update({
        where: {id: account.id},
        data: {password: passwordHash},
      }),
      this.prisma.passwordOtp.update({
        where: {id: otpRow.id},
        data: {usedAt: new Date()}
      })
    ])

    await this.mail.sendMail({
      to: user.email,
      subject: "Your Ksocial password was reset",
      html: `<p>Your account password was reset successfully.</p>
             <p>If this wasn't you, contact support immediately.</p>
             <p>Time: ${new Date().toISOString()}</p>`,
    })
    
    return { message: "Password reset successfully" }
  }

  issueSocketToken(userId: string) {
    return {
      token: this.jwt.sign(
        { sub: userId, typ: "socket" },
        {
          secret: process.env.JWT_SOCKET_SECRET ?? "dev_socket_secret",
          expiresIn: "60s",
        }
      ),
    }
  }

  private issueTokens(userId: string) {
    const accessToken = this.jwt.sign(
      { sub: userId, typ: "access" },
      {
        secret: process.env.JWT_ACCESS_SECRET ?? "dev_access_secret",
        expiresIn: "7d",
      }
    )
    return { accessToken }
  }
  async loginWithOAuth(payload: {
    provider: "google" | "facebook"
    providerAccountId: string
    email: string | null
    name: string
    avatarUrl: string | null
  }) {
    // 1) Nếu đã có account OAuth => login luôn
    const existingAccount = await this.prisma.account.findFirst({
      where: {
        providerId: payload.provider,
        accountId: payload.providerAccountId,
      },
      include: { user: true },
    })
  
    if (existingAccount?.user) {
      return this.issueTokens(existingAccount.user.id)
    }
  
    // 2) Nếu chưa có account => tìm user theo email (nếu có)
    let user = payload.email
      ? await this.prisma.user.findUnique({ where: { email: payload.email } })
      : null
  
    // 3) Nếu chưa có user => tạo mới
    if (!user) {
      user = await this.prisma.user.create({
        data: {
          id: randomUUID(),
          name: payload.name,
          email:
            payload.email ??
            `${payload.provider}-${payload.providerAccountId}@local.invalid`,
          avatarUrl: payload.avatarUrl,
          emailVerified: payload.email ? true : false,
          role: UserRole.USER,
        },
      })
    }
  
    // 4) Tạo account OAuth (password = null)
    await this.prisma.account.create({
      data: {
        id: randomUUID(),
        userId: user.id,
        providerId: payload.provider,
        accountId: payload.providerAccountId,
        password: "",
      },
    })
  
    return this.issueTokens(user.id)
  }

}

