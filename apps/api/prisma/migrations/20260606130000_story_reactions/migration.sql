-- AlterTable
ALTER TABLE "stories" ADD COLUMN "reaction_count" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "story_likes" (
    "id" SERIAL NOT NULL,
    "story_id" INTEGER NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "reaction" "ReactionType" NOT NULL DEFAULT 'LIKE',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "story_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "story_likes_story_user_unique" ON "story_likes"("story_id", "user_id");

-- AddForeignKey
ALTER TABLE "story_likes" ADD CONSTRAINT "story_likes_story_id_fkey" FOREIGN KEY ("story_id") REFERENCES "stories"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "story_likes" ADD CONSTRAINT "story_likes_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
