-- CreateTable
CREATE TABLE "close_friends" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "friend_id" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "close_friends_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moments" (
    "id" SERIAL NOT NULL,
    "author_id" VARCHAR(255) NOT NULL,
    "image_url" TEXT NOT NULL,
    "caption" VARCHAR(300),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "moment_views" (
    "id" SERIAL NOT NULL,
    "moment_id" INTEGER NOT NULL,
    "viewer_id" VARCHAR(255) NOT NULL,
    "viewed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "moment_views_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "close_friends_friend_id_idx" ON "close_friends"("friend_id");

-- CreateIndex
CREATE UNIQUE INDEX "close_friends_user_friend_unique" ON "close_friends"("user_id", "friend_id");

-- CreateIndex
CREATE INDEX "moments_author_created_idx" ON "moments"("author_id", "created_at" DESC);

-- CreateIndex
CREATE INDEX "moment_views_viewer_idx" ON "moment_views"("viewer_id");

-- CreateIndex
CREATE UNIQUE INDEX "moment_views_moment_viewer_unique" ON "moment_views"("moment_id", "viewer_id");

-- AddForeignKey
ALTER TABLE "close_friends" ADD CONSTRAINT "close_friends_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "close_friends" ADD CONSTRAINT "close_friends_friend_id_fkey" FOREIGN KEY ("friend_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moments" ADD CONSTRAINT "moments_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_views" ADD CONSTRAINT "moment_views_moment_id_fkey" FOREIGN KEY ("moment_id") REFERENCES "moments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "moment_views" ADD CONSTRAINT "moment_views_viewer_id_fkey" FOREIGN KEY ("viewer_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
