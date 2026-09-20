-- CreateTable
CREATE TABLE "password_otps" (
    "id" SERIAL NOT NULL,
    "user_id" VARCHAR(255) NOT NULL,
    "code_hash" VARCHAR(255) NOT NULL,
    "pending_password_hash" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "used_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "password_otps_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "password_otps_user_created_idx" ON "password_otps"("user_id", "created_at" DESC);

-- AddForeignKey
ALTER TABLE "password_otps" ADD CONSTRAINT "password_otps_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE CASCADE;
