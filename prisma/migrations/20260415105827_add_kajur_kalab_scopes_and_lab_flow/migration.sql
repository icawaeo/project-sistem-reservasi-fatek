-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'ADMIN', 'ADMIN_DEKAN', 'ADMIN_WD2', 'KAJUR', 'KEPALA_LAB', 'SUPERADMIN');

-- CreateEnum
CREATE TYPE "LabProgram" AS ENUM ('IT', 'ELEKTRO', 'ARSITEKTUR', 'PWK', 'SIPIL', 'LINGKUNGAN', 'MESIN');

-- CreateEnum
CREATE TYPE "LabDepartment" AS ENUM ('ELEKTRO', 'ARSITEKTUR', 'SIPIL', 'MESIN');

-- CreateEnum
CREATE TYPE "ReservationFlow" AS ENUM ('GENERAL', 'LAB_SKRIPSI', 'LAB_LAINNYA');

-- AlterTable
ALTER TABLE "Building" ALTER COLUMN "operational_days" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Reservation" ADD COLUMN     "res_decisionAt" TIMESTAMP(3),
ADD COLUMN     "res_flow" "ReservationFlow" NOT NULL DEFAULT 'GENERAL',
ADD COLUMN     "res_labDepartment" "LabDepartment",
ADD COLUMN     "res_labProgram" "LabProgram",
ADD COLUMN     "res_waitingDekanAt" TIMESTAMP(3),
ADD COLUMN     "res_waitingKajurAt" TIMESTAMP(3),
ADD COLUMN     "res_waitingKepalaLabAt" TIMESTAMP(3),
ADD COLUMN     "res_waitingWd2At" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "Room" ADD COLUMN     "labDepartment" "LabDepartment",
ADD COLUMN     "labProgram" "LabProgram";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "departmentScope" "LabDepartment",
ADD COLUMN     "programScope" "LabProgram",
ADD COLUMN     "role" "UserRole" NOT NULL DEFAULT 'USER',
ADD COLUMN     "signatureUrl" TEXT;

-- CreateTable
CREATE TABLE "PasswordSetupToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PasswordSetupToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EmailChangeToken" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "newEmail" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "usedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "EmailChangeToken_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PasswordSetupToken_tokenHash_key" ON "PasswordSetupToken"("tokenHash");

-- CreateIndex
CREATE INDEX "PasswordSetupToken_userId_idx" ON "PasswordSetupToken"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "EmailChangeToken_tokenHash_key" ON "EmailChangeToken"("tokenHash");

-- CreateIndex
CREATE INDEX "EmailChangeToken_userId_idx" ON "EmailChangeToken"("userId");

-- CreateIndex
CREATE INDEX "EmailChangeToken_newEmail_idx" ON "EmailChangeToken"("newEmail");

-- AddForeignKey
ALTER TABLE "PasswordSetupToken" ADD CONSTRAINT "PasswordSetupToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "EmailChangeToken" ADD CONSTRAINT "EmailChangeToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;
