-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('POST_LIKED', 'POST_COMMENTED', 'FOLLOWED', 'SYSTEM');

-- CreateEnum
CREATE TYPE "NotificationTargetKind" AS ENUM ('post', 'comment', 'user', 'system');

-- CreateTable
CREATE TABLE "app_notifications" (
    "id" SERIAL NOT NULL,
    "recipient_id" VARCHAR(255) NOT NULL,
    "actor_ids" JSONB NOT NULL DEFAULT '[]',
    "actor_count" INTEGER NOT NULL DEFAULT 0,
    "type" "NotificationType" NOT NULL,
    "target_kind" "NotificationTargetKind" NOT NULL,
    "target_id" VARCHAR(255) NOT NULL,
    "target_slug" VARCHAR(255),
    "meta" JSONB NOT NULL DEFAULT '{}',
    "read_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_notifications_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_notification_counters" (
    "user_id" VARCHAR(255) NOT NULL,
    "unread" INTEGER NOT NULL DEFAULT 0,
    "last_read_at" TIMESTAMP(3),
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "app_notification_counters_pkey" PRIMARY KEY ("user_id")
);

-- CreateIndex
CREATE INDEX "app_notif_recipient_created_idx" ON "app_notifications"("recipient_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "app_notif_recipient_read_updated_idx" ON "app_notifications"("recipient_id", "read_at", "updated_at" DESC);

-- CreateIndex
CREATE INDEX "app_notif_agg_lookup_idx" ON "app_notifications"("recipient_id", "type", "target_kind", "target_id", "read_at");
