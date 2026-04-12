-- CreateEnum
CREATE TYPE "conversation_kind" AS ENUM ('DIRECT', 'GROUP');

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_user1_id_fkey";

-- DropForeignKey
ALTER TABLE "conversations" DROP CONSTRAINT "conversations_user2_id_fkey";

-- DropIndex
DROP INDEX "conversations_user1_user2_unique";

-- AlterTable
ALTER TABLE "conversations" ADD COLUMN     "kind" "conversation_kind" NOT NULL DEFAULT 'DIRECT',
ADD COLUMN     "title" VARCHAR(255),
ALTER COLUMN "user1_id" DROP NOT NULL,
ALTER COLUMN "user2_id" DROP NOT NULL;

-- CreateTable
CREATE TABLE "conversation_members" (
    "id" SERIAL NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_members_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "conversation_members_conv_user_unique" ON "conversation_members"("conversation_id", "user_id");

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversations" ADD CONSTRAINT "conversations_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_members" ADD CONSTRAINT "conversation_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- One direct conversation per ordered pair (Prisma upsert replaced by findFirst+create using this index)
CREATE UNIQUE INDEX "conversations_direct_pair_unique" ON "conversations" ("user1_id", "user2_id") WHERE kind = 'DIRECT' AND "user1_id" IS NOT NULL AND "user2_id" IS NOT NULL;
