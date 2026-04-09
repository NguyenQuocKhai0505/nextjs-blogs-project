import type { PrismaService } from "../prisma/prisma.service.js"

/** User ids that both follow `userId` and are followed back by `userId` (mutual friends / can chat). */
export async function getMutualFriendIds(
  prisma: PrismaService,
  userId: string
): Promise<Set<string>> {
  const iFollow = await prisma.follow.findMany({
    where: { followerId: userId },
    select: { followingId: true },
  })
  const candidateIds = iFollow.map((f) => f.followingId)
  if (candidateIds.length === 0) return new Set()
  const theyFollowMe = await prisma.follow.findMany({
    where: { followerId: { in: candidateIds }, followingId: userId },
    select: { followerId: true },
  })
  return new Set(theyFollowMe.map((f) => f.followerId))
}

export async function areMutualFriends(
  prisma: PrismaService,
  a: string,
  b: string
): Promise<boolean> {
  if (a === b) return false
  const [ab, ba] = await Promise.all([
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: a, followingId: b } },
    }),
    prisma.follow.findUnique({
      where: { followerId_followingId: { followerId: b, followingId: a } },
    }),
  ])
  return !!ab && !!ba
}
