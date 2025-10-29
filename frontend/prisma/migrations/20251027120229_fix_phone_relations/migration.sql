/*
  Warnings:

  - Changed the type of `phoneableType` on the `Phone` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "PhoneableType" AS ENUM ('Customer', 'Supplier');

-- AlterTable
ALTER TABLE "Phone" DROP COLUMN "phoneableType",
ADD COLUMN     "phoneableType" "PhoneableType" NOT NULL;
