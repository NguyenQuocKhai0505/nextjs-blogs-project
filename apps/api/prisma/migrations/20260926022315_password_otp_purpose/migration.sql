-- CreateEnum
CREATE TYPE "opt_purpose" AS ENUM ('CHANGE_PASSWORD', 'RESET_PASSWOPRD');

-- AlterTable
ALTER TABLE "password_otps" ADD COLUMN     "attempts" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "purpose" "opt_purpose" NOT NULL DEFAULT 'CHANGE_PASSWORD',
ALTER COLUMN "pending_password_hash" DROP NOT NULL;
