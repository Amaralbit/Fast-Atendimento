-- AlterTable
ALTER TABLE "doctor_settings" ADD COLUMN     "plan" TEXT NOT NULL DEFAULT 'free',
ADD COLUMN     "plan_expires_at" TIMESTAMP(3);
