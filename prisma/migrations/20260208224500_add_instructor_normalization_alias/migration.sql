-- Add normalized key for robust instructor matching
ALTER TABLE "Instructor"
ADD COLUMN "nameKey" TEXT;

CREATE INDEX "Instructor_nameKey_idx" ON "Instructor"("nameKey");

-- Track observed instructor aliases from reviews and imports
CREATE TABLE "InstructorAlias" (
  "id" TEXT NOT NULL,
  "aliasRaw" TEXT NOT NULL,
  "aliasKey" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'review',
  "courseId" TEXT,
  "term" TEXT,
  "instructorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "InstructorAlias_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "InstructorAlias_aliasKey_idx" ON "InstructorAlias"("aliasKey");
CREATE INDEX "InstructorAlias_courseId_term_idx" ON "InstructorAlias"("courseId", "term");
CREATE INDEX "InstructorAlias_instructorId_idx" ON "InstructorAlias"("instructorId");
CREATE UNIQUE INDEX "InstructorAlias_aliasKey_instructorId_key" ON "InstructorAlias"("aliasKey", "instructorId");

ALTER TABLE "InstructorAlias"
ADD CONSTRAINT "InstructorAlias_instructorId_fkey"
FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
