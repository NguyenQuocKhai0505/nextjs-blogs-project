-- CreateEnum
CREATE TYPE "story_media_type" AS ENUM ('IMAGE', 'VIDEO', 'TEXT');

-- CreateTable
CREATE TABLE "stories" (
    "id" SERIAL NOT NULL,
    "author_id" VARCHAR(255) NOT NULL,
    "media_type" "story_media_type" NOT NULL,
    "image_url" TEXT,
    "video_url" TEXT,
    "text_content" TEXT,
    "background_color" VARCHAR(32),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "stories_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "story_views" (
    "id" SERIAL NOT NULL,
    "story_id" INTEGER NOT NULL,
    "viewer_id" VARCHAR(255) NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "stories_author_expires_idx" ON "stories"("author_id", "expires_at");

-- CreateIndex
CREATE INDEX "stories_expires_idx" ON "stories"("expires_at");

-- CreateIndex
CREATE INDEX "story_views_viewer_idx" ON "story_views"("viewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "story_views_story_viewer_unique" ON "story_views"("story_id", "viewer_id");

-- AddForeignKey
ALTER TABLE "stories" ADD CONSTRAINT "stories_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_views" ADD CONSTRAINT "story_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
