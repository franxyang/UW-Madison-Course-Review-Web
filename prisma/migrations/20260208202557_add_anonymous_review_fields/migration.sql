-- DropIndex
DROP INDEX "GradeDistribution_courseId_term_instructorId_key";

-- AlterTable
ALTER TABLE "Review" ADD COLUMN     "isAnonymous" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "showRankWhenAnonymous" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "GradeDistribution_courseId_term_idx" ON "GradeDistribution"("courseId", "term");
