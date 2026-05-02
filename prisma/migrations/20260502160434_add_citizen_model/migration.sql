-- AlterEnum
ALTER TYPE "Role" ADD VALUE 'CITIZEN';

-- CreateTable
CREATE TABLE "Citizen" (
    "id" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "phoneNumber" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "cniNumber" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL DEFAULT 'Conakry',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Citizen_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_phoneNumber_key" ON "Citizen"("phoneNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Citizen_cniNumber_key" ON "Citizen"("cniNumber");

-- CreateIndex
CREATE INDEX "Citizen_phoneNumber_idx" ON "Citizen"("phoneNumber");

-- CreateIndex
CREATE INDEX "Citizen_cniNumber_idx" ON "Citizen"("cniNumber");
