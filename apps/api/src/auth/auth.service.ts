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

    const account = user.accounts.find((a: { providerId: string }) => a.providerId === "credentials") ?? null
    if (!account) throw new UnauthorizedException("Invalid credentials")

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
}

