-- CreateEnum
CREATE TYPE "Role" AS ENUM ('AGENT', 'ADMIN', 'MINISTRY', 'JUSTICE');

-- CreateEnum
CREATE TYPE "Status" AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');

-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "nationalAgentId" TEXT NOT NULL,
    "firstName" TEXT NOT NULL,
    "lastName" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'AGENT',
    "status" "Status" NOT NULL DEFAULT 'ACTIVE',
    "prefectureAssignment" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "twoFactorSecret" TEXT,
    "twoFactorEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastLogin" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Establishment" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "prefecture" TEXT NOT NULL,
    "subPrefecture" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,

    CONSTRAINT "Establishment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Birth" (
    "id" TEXT NOT NULL,
    "nationalId" TEXT NOT NULL,
    "blockchainHash" TEXT,
    "ipfsCid" TEXT,
    "status" TEXT NOT NULL DEFAULT 'PENDING_SYNC',
    "childFirstName" TEXT NOT NULL,
    "childLastName" TEXT NOT NULL,
    "childGender" TEXT NOT NULL,
    "dateOfBirth" TIMESTAMP(3) NOT NULL,
    "timeOfBirth" TEXT,
    "placeOfBirth" TEXT NOT NULL,
    "motherFullName" TEXT NOT NULL,
    "motherDob" TIMESTAMP(3) NOT NULL,
    "motherCni" TEXT,
    "motherPrefecture" TEXT NOT NULL,
    "fatherFullName" TEXT,
    "fatherDob" TIMESTAMP(3),
    "fatherCni" TEXT,
    "agentId" TEXT NOT NULL,
    "establishmentId" TEXT NOT NULL,
    "gpsCoordinates" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Birth_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "birthId" TEXT NOT NULL,
    "verifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ipAddress" TEXT,
    "verifierType" TEXT NOT NULL,
    "result" TEXT NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Agent_nationalAgentId_key" ON "Agent"("nationalAgentId");

-- CreateIndex
CREATE UNIQUE INDEX "Establishment_code_key" ON "Establishment"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Birth_nationalId_key" ON "Birth"("nationalId");

-- CreateIndex
CREATE UNIQUE INDEX "Birth_blockchainHash_key" ON "Birth"("blockchainHash");

-- AddForeignKey
ALTER TABLE "Birth" ADD CONSTRAINT "Birth_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Agent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Birth" ADD CONSTRAINT "Birth_establishmentId_fkey" FOREIGN KEY ("establishmentId") REFERENCES "Establishment"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Verification" ADD CONSTRAINT "Verification_birthId_fkey" FOREIGN KEY ("birthId") REFERENCES "Birth"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
