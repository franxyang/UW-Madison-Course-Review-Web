-- Canonical Madgrades rebuild support:
-- 1) Add course code alias table
-- 2) Tighten GradeDistribution constraints in a safe/idempotent way
-- 3) Introduce partial unique indexes when data quality allows

-- 1) Course code alias mapping table
CREATE TABLE IF NOT EXISTS "CourseCodeAlias" (
  "id" TEXT NOT NULL,
  "sourceCode" TEXT NOT NULL,
  "canonicalCourseId" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'madgrades-extractor',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "CourseCodeAlias_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "CourseCodeAlias_sourceCode_key"
  ON "CourseCodeAlias"("sourceCode");

CREATE INDEX IF NOT EXISTS "CourseCodeAlias_canonicalCourseId_idx"
  ON "CourseCodeAlias"("canonicalCourseId");

ALTER TABLE "CourseCodeAlias" DROP CONSTRAINT IF EXISTS "CourseCodeAlias_canonicalCourseId_fkey";
ALTER TABLE "CourseCodeAlias"
  ADD CONSTRAINT "CourseCodeAlias_canonicalCourseId_fkey"
  FOREIGN KEY ("canonicalCourseId") REFERENCES "Course"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;

-- 2) GradeDistribution checks.
-- Use NOT VALID so migration can apply even before cleanup; the rebuild script validates.
ALTER TABLE "GradeDistribution" DROP CONSTRAINT IF EXISTS "GradeDistribution_totalGraded_positive";
ALTER TABLE "GradeDistribution"
  ADD CONSTRAINT "GradeDistribution_totalGraded_positive"
  CHECK ("totalGraded" > 0)
  NOT VALID;

ALTER TABLE "GradeDistribution" DROP CONSTRAINT IF EXISTS "GradeDistribution_grade_sum_matches_total";
ALTER TABLE "GradeDistribution"
  ADD CONSTRAINT "GradeDistribution_grade_sum_matches_total"
  CHECK (
    "aCount" + "abCount" + "bCount" + "bcCount" + "cCount" + "dCount" + "fCount" = "totalGraded"
  )
  NOT VALID;

-- 3) Partial unique indexes.
-- Keep existing composite unique index in place for now; it protects non-null tuples and is harmless.
-- Create stricter partial indexes when possible.

-- Non-null instructor uniqueness is always safe and should match existing data semantics.
CREATE UNIQUE INDEX IF NOT EXISTS "GradeDistribution_courseId_term_instructor_not_null_uidx"
  ON "GradeDistribution"("courseId", "term", "instructorId")
  WHERE "instructorId" IS NOT NULL;

-- Null-instructor uniqueness can fail on dirty historical data.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_indexes
    WHERE schemaname = 'public'
      AND indexname = 'GradeDistribution_courseId_term_instructor_null_uidx'
  ) THEN
    IF EXISTS (
      SELECT 1
      FROM "GradeDistribution"
      WHERE "instructorId" IS NULL
      GROUP BY "courseId", term
      HAVING COUNT(*) > 1
      LIMIT 1
    ) THEN
      RAISE NOTICE 'Skipping GradeDistribution_courseId_term_instructor_null_uidx creation: duplicate NULL-instructor rows exist. Run canonical rebuild first.';
    ELSE
      EXECUTE 'CREATE UNIQUE INDEX "GradeDistribution_courseId_term_instructor_null_uidx" ON "GradeDistribution"("courseId", term) WHERE "instructorId" IS NULL';
    END IF;
  END IF;
END $$;
