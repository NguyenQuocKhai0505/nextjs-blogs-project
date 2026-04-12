-- CreateTable
CREATE TABLE "conversation_read_states" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "conversation_id" INTEGER NOT NULL,
    "last_read_message_id" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "conversation_read_states_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "conversation_read_state_conv_idx" ON "conversation_read_states"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "conversation_read_state_user_conv_unique" ON "conversation_read_states"("user_id", "conversation_id");

-- AddForeignKey
ALTER TABLE "conversation_read_states" ADD CONSTRAINT "conversation_read_states_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "conversation_read_states" ADD CONSTRAINT "conversation_read_states_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
