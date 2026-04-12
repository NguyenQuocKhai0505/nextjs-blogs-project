-- AlterTable
ALTER TABLE "messages" ADD COLUMN "revoked_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "conversation_hides" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "hidden_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "conversation_hides_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "conversation_hides_user_conv_unique" ON "conversation_hides"("user_id", "conversation_id");

CREATE INDEX "conversation_hides_conv_idx" ON "conversation_hides"("conversation_id");

ALTER TABLE "conversation_hides" ADD CONSTRAINT "conversation_hides_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "conversation_hides" ADD CONSTRAINT "conversation_hides_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
