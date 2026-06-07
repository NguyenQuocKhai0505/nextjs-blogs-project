-- CreateEnum
CREATE TYPE "reaction_type" AS ENUM ('LIKE', 'LOVE', 'HAHA', 'WOW', 'SAD', 'ANGRY');

-- AlterTable
ALTER TABLE "post_likes" ADD COLUMN "reaction" "reaction_type" NOT NULL DEFAULT 'LIKE';
