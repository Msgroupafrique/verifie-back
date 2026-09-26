/*
  Warnings:

  - A unique constraint covering the columns `[resetPasswordToken]` on the table `auth_identities` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "auth_identities" ADD COLUMN     "resetPasswordExpires" TIMESTAMP(3),
ADD COLUMN     "resetPasswordToken" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "auth_identities_resetPasswordToken_key" ON "auth_identities"("resetPasswordToken");
