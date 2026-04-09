import { BadRequestException, Injectable, UnauthorizedException } from "@nestjs/common"
import { JwtService } from "@nestjs/jwt"
import { PrismaService } from "../prisma/prisma.service.js"
import { RegisterDto } from "./dto/register.dto.js"
import { LoginDto } from "./dto/login.dto.js"
import bcrypt from "bcryptjs"
import { randomUUID } from "crypto"

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService
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
    if (!user) throw new UnauthorizedException("Invalid credentials")

    const account =
      user.accounts.find(
        (a: { providerId: string }) => a.providerId === "credentials"
      ) ?? null
    if (!account) throw new UnauthorizedException("Invalid credentials")
    if (!account.password) {
      throw new UnauthorizedException(
        "Password login not available for this account. Use Google/Facebook login."
      )
    }

    const ok = await bcrypt.compare(dto.password, account.password)
    if (!ok) throw new UnauthorizedException("Invalid credentials")

    return this.issueTokens(user.id)
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

