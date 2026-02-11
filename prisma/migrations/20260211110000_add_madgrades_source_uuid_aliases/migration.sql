-- Add source-level metadata to CourseCodeAlias and anchor cross-list groups by Madgrades course UUID.

ALTER TABLE "CourseCodeAlias"
  ADD COLUMN IF NOT EXISTS "sourceCourseUuid" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceSubjectCode" TEXT,
  ADD COLUMN IF NOT EXISTS "sourceSubjectAbbr" TEXT,
  ADD COLUMN IF NOT EXISTS "lastSeenAt" TIMESTAMP(3);

CREATE INDEX IF NOT EXISTS "CourseCodeAlias_sourceCourseUuid_idx"
  ON "CourseCodeAlias"("sourceCourseUuid");

CREATE INDEX IF NOT EXISTS "CourseCodeAlias_sourceSubjectAbbr_sourceCode_idx"
  ON "CourseCodeAlias"("sourceSubjectAbbr", "sourceCode");

ALTER TABLE "CrossListGroup"
  ADD COLUMN IF NOT EXISTS "sourceCourseUuid" TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS "CrossListGroup_sourceCourseUuid_key"
  ON "CrossListGroup"("sourceCourseUuid");
