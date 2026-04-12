-- AlterTable
ALTER TABLE "user" ADD COLUMN "last_seen_at" TIMESTAMP(3);

CREATE INDEX "user_last_seen_at_idx" ON "user"("last_seen_at");
