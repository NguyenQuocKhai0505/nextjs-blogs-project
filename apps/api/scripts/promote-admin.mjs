/**
 * Promote an existing user to ADMIN, or create credentials admin.
 *
 * Usage (from apps/api):
 *   node scripts/promote-admin.mjs you@email.com
 *   node scripts/promote-admin.mjs you@email.com YourPassword123
 *
 * If the email does not exist and a password is provided, creates a new ADMIN user.
 */
import "dotenv/config"
import { randomUUID } from "node:crypto"
import bcrypt from "bcryptjs"
import { PrismaClient, UserRole } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const emailArg = process.argv[2]?.trim().toLowerCase()
const passwordArg = process.argv[3]
const email = emailArg || process.env.ADMIN_EMAIL?.trim().toLowerCase()
const password = passwordArg || process.env.ADMIN_PASSWORD

if (!email) {
  console.error(
    "Usage: node scripts/promote-admin.mjs <email> [password]\n" +
      "   or set ADMIN_EMAIL (+ optional ADMIN_PASSWORD to create if missing)"
  )
  process.exit(1)
}

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

try {
  let user = await prisma.user.findUnique({
    where: { email },
    include: { accounts: true },
  })

  if (!user) {
    if (!password) {
      console.error(
        `User ${email} not found. Pass a password to create a new ADMIN account.`
      )
      process.exit(1)
    }
    const userId = randomUUID()
    const passwordHash = await bcrypt.hash(password, 10)
    user = await prisma.user.create({
      data: {
        id: userId,
        name: "Admin",
        email,
        emailVerified: true,
        role: UserRole.ADMIN,
        accounts: {
          create: {
            id: randomUUID(),
            accountId: email,
            providerId: "credentials",
            password: passwordHash,
          },
        },
      },
      include: { accounts: true },
    })
    console.log(`Created ADMIN user: ${email}`)
  } else {
    await prisma.user.update({
      where: { id: user.id },
      data: { role: UserRole.ADMIN, updatedAt: new Date() },
    })
    console.log(`Promoted to ADMIN: ${email} (id=${user.id})`)
  }

  console.log("Done. Login on web or apps/admin with this email.")
} finally {
  await prisma.$disconnect()
  await pool.end()
}
