-- CreateEnum
CREATE TYPE "RequestStatus" AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED');

-- CreateEnum
CREATE TYPE "RequestType" AS ENUM ('BIRTH_CERTIFICATE', 'COPY_CERTIFICATE', 'CORRECTION');

-- AlterTable
ALTER TABLE "Birth" ADD COLUMN     "parentPhoneNumber" TEXT;

-- CreateTable
CREATE TABLE "Request" (
    "id" TEXT NOT NULL,
    "citizenId" TEXT NOT NULL,
    "type" "RequestType" NOT NULL,
    "status" "RequestStatus" NOT NULL DEFAULT 'PENDING',
    "birthId" TEXT,
    "childName" TEXT,
    "deliveryMethod" TEXT NOT NULL DEFAULT 'DIGITAL',
    "phoneNumber" TEXT,
    "email" TEXT,
    "address" TEXT,
    "documents" TEXT,
    "notes" TEXT,
    "processedAt" TIMESTAMP(3),
    "processedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Request_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Request_citizenId_idx" ON "Request"("citizenId");

-- CreateIndex
CREATE INDEX "Request_status_idx" ON "Request"("status");

-- CreateIndex
CREATE INDEX "Request_createdAt_idx" ON "Request"("createdAt");

-- CreateIndex
CREATE INDEX "Birth_parentPhoneNumber_idx" ON "Birth"("parentPhoneNumber");

-- AddForeignKey
ALTER TABLE "Request" ADD CONSTRAINT "Request_citizenId_fkey" FOREIGN KEY ("citizenId") REFERENCES "Citizen"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
