-- Reconcile schema drift caused by previously manual/schema-only changes.
-- This migration is intentionally idempotent so it can be applied to DBs that
-- already contain part or all of these changes.

-- 1) Cross-listed course grouping
CREATE TABLE IF NOT EXISTS "CrossListGroup" (
    "id" TEXT NOT NULL,
    "displayCode" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CrossListGroup_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "crossListGroupId" TEXT;

CREATE INDEX IF NOT EXISTS "Course_crossListGroupId_idx" ON "Course"("crossListGroupId");

ALTER TABLE "Course" DROP CONSTRAINT IF EXISTS "Course_crossListGroupId_fkey";
ALTER TABLE "Course"
  ADD CONSTRAINT "Course_crossListGroupId_fkey"
  FOREIGN KEY ("crossListGroupId")
  REFERENCES "CrossListGroup"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

-- 2) GradeDistribution model upgrade (many-to-many -> per-instructor records)
ALTER TABLE "GradeDistribution" ADD COLUMN IF NOT EXISTS "instructorId" TEXT;

DROP INDEX IF EXISTS "GradeDistribution_courseId_term_key";
CREATE INDEX IF NOT EXISTS "GradeDistribution_courseId_idx" ON "GradeDistribution"("courseId");
CREATE INDEX IF NOT EXISTS "GradeDistribution_instructorId_idx" ON "GradeDistribution"("instructorId");
CREATE UNIQUE INDEX IF NOT EXISTS "GradeDistribution_courseId_term_instructorId_key"
  ON "GradeDistribution"("courseId", "term", "instructorId");

ALTER TABLE "GradeDistribution" DROP CONSTRAINT IF EXISTS "GradeDistribution_instructorId_fkey";
ALTER TABLE "GradeDistribution"
  ADD CONSTRAINT "GradeDistribution_instructorId_fkey"
  FOREIGN KEY ("instructorId")
  REFERENCES "Instructor"("id")
  ON DELETE SET NULL
  ON UPDATE CASCADE;

DROP TABLE IF EXISTS "GradeDistributionInstructor";

-- 3) Review schema updates
ALTER TABLE "Review" ADD COLUMN IF NOT EXISTS "recommendInstructor" TEXT;
ALTER TABLE "Review" ALTER COLUMN "gradeReceived" DROP NOT NULL;
