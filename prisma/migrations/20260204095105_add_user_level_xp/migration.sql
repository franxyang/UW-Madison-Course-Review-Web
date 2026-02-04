/*
  Warnings:

  - Made the column `type` on table `School` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "Course_searchVector_idx";

-- DropIndex
DROP INDEX "School_parentId_idx";

-- AlterTable
ALTER TABLE "School" ALTER COLUMN "type" SET NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "level" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "title" TEXT,
ADD COLUMN     "xp" INTEGER NOT NULL DEFAULT 0;
