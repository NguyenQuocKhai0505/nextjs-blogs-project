-- CreateEnum
CREATE TYPE "report_reason" AS ENUM ('SPAM', 'HARASSMENT', 'HATE_SPEECH', 'VIOLENCE', 'NUDITY', 'OTHER');

-- CreateEnum
CREATE TYPE "report_target_kind" AS ENUM ('POST', 'COMMENT', 'USER', 'REEL');

-- CreateEnum
CREATE TYPE "report_status" AS ENUM ('PENDING', 'REVIEWED', 'DISMISSED');

-- AlterTable
ALTER TABLE "posts" ADD COLUMN     "share_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "post_reposts" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "post_id" INTEGER NOT NULL,
    "caption" VARCHAR(500),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "post_reposts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "reporter_id" VARCHAR(255) NOT NULL,
    "target_kind" "report_target_kind" NOT NULL,
    "target_id" VARCHAR(255) NOT NULL,
    "reason" "report_reason" NOT NULL,
    "details" VARCHAR(1000),
    "status" "report_status" NOT NULL DEFAULT 'PENDING',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "reviewed_at" TIMESTAMP(3),

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "post_reposts_user_created_idx" ON "post_reposts"("user_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "post_reposts_post_idx" ON "post_reposts"("post_id");

-- CreateIndex
CREATE UNIQUE INDEX "post_reposts_user_post_unique" ON "post_reposts"("user_id", "post_id");

-- CreateIndex
CREATE INDEX "reports_status_created_idx" ON "reports"("status", "created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "reports_reporter_target_unique" ON "reports"("reporter_id", "target_kind", "target_id");

-- AddForeignKey
ALTER TABLE "post_reposts" ADD CONSTRAINT "post_reposts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "post_reposts" ADD CONSTRAINT "post_reposts_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_reporter_id_fkey" FOREIGN KEY ("reporter_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
