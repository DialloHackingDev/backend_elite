-- CreateEnum
CREATE TYPE "ValidationStatus" AS ENUM ('PENDING', 'APPROVED', 'REJECTED');

-- AlterTable
ALTER TABLE "Birth" ADD COLUMN     "isLateRegistration" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "validationStatus" "ValidationStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN     "witness1Cni" TEXT,
ADD COLUMN     "witness1FullName" TEXT,
ADD COLUMN     "witness2Cni" TEXT,
ADD COLUMN     "witness2FullName" TEXT;

-- CreateIndex
CREATE INDEX "Birth_nationalId_idx" ON "Birth"("nationalId");

-- CreateIndex
CREATE INDEX "Birth_status_idx" ON "Birth"("status");

-- CreateIndex
CREATE INDEX "Birth_createdAt_idx" ON "Birth"("createdAt");

-- CreateIndex
CREATE INDEX "Birth_validationStatus_idx" ON "Birth"("validationStatus");
