-- CreateTable
CREATE TABLE "reels" (
    "id" SERIAL NOT NULL,
    "author_id" VARCHAR(255) NOT NULL,
    "video_url" TEXT NOT NULL,
    "caption" VARCHAR(500),
    "view_count" INTEGER NOT NULL DEFAULT 0,
    "like_count" INTEGER NOT NULL DEFAULT 0,
    "comment_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "reels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reel_likes" (
    "id" SERIAL NOT NULL,
    "reel_id" INTEGER NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "reaction" "reaction_type" NOT NULL DEFAULT 'LIKE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reel_likes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reel_views" (
    "id" SERIAL NOT NULL,
    "reel_id" INTEGER NOT NULL,
    "viewer_id" VARCHAR(255) NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reel_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reels_author_created_idx" ON "reels"("author_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "reels_created_idx" ON "reels"("created_at" DESC);

-- CreateIndex
CREATE UNIQUE INDEX "reel_likes_reel_user_unique" ON "reel_likes"("reel_id", "user_id");

-- CreateIndex
CREATE INDEX "reel_views_viewer_idx" ON "reel_views"("viewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "reel_views_reel_viewer_unique" ON "reel_views"("reel_id", "viewer_id");

-- AddForeignKey
ALTER TABLE "reels" ADD CONSTRAINT "reels_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reel_likes" ADD CONSTRAINT "reel_likes_reel_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "reels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reel_likes" ADD CONSTRAINT "reel_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reel_views" ADD CONSTRAINT "reel_views_reel_id_fkey" FOREIGN KEY ("reel_id") REFERENCES "reels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reel_views" ADD CONSTRAINT "reel_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
