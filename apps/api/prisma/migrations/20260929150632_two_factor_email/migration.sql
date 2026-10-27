-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "otp_purpose" ADD VALUE 'LOGIN_2FA';
ALTER TYPE "otp_purpose" ADD VALUE 'ENABLE_2FA';
ALTER TYPE "otp_purpose" ADD VALUE 'DISABLE_2FA';

-- AlterTable
ALTER TABLE "user" ADD COLUMN     "two_factor_enable" BOOLEAN NOT NULL DEFAULT false;
