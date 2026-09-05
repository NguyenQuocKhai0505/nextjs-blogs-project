import "dotenv/config"
import { PrismaClient } from "@prisma/client"
import { PrismaPg } from "@prisma/adapter-pg"
import pg from "pg"

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL })
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) })

try {
  const cols = await prisma.$queryRaw`
    SELECT column_name, udt_name, column_default
    FROM information_schema.columns
    WHERE table_name = 'user' AND column_name = 'role'
  `
  const byRole = await prisma.user.groupBy({
    by: ["role"],
    _count: true,
  })
  const users = await prisma.user.findMany({
    select: { id: true, email: true, name: true, role: true },
    take: 50,
    orderBy: { createdAt: "asc" },
  })
  console.log("ROLE_COL", JSON.stringify(cols, null, 2))
  console.log("BY_ROLE", JSON.stringify(byRole, null, 2))
  console.log("USERS", JSON.stringify(users, null, 2))
} finally {
  await prisma.$disconnect()
  await pool.end()
}
