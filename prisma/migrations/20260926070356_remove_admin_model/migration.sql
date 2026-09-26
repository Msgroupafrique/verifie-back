/*
  Warnings:

  - You are about to drop the column `createdByAdminId` on the `activation_keys` table. All the data in the column will be lost.
  - You are about to drop the `admins` table. If the table is not empty, all the data it contains will be lost.

*/
-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('USER', 'SUPER_ADMIN', 'ADMIN');

-- DropForeignKey
ALTER TABLE "activation_keys" DROP CONSTRAINT "activation_keys_createdByAdminId_fkey";

-- DropForeignKey
ALTER TABLE "admins" DROP CONSTRAINT "admins_userId_fkey";

-- AlterTable
ALTER TABLE "activation_keys" DROP COLUMN "createdByAdminId";

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "userRole" "UserRole" NOT NULL DEFAULT 'USER';

-- DropTable
DROP TABLE "admins";

-- DropEnum
DROP TYPE "AdminRole";
