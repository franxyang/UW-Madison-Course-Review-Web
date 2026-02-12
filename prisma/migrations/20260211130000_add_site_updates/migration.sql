-- Add SiteUpdate model for About/Updates publishing.

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'SiteUpdateStatus') THEN
    CREATE TYPE "SiteUpdateStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS "SiteUpdate" (
  "id" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "summary" TEXT,
  "content" TEXT NOT NULL,
  "versionTag" TEXT,
  "status" "SiteUpdateStatus" NOT NULL DEFAULT 'DRAFT',
  "publishedAt" TIMESTAMP(3),
  "authorId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteUpdate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "SiteUpdate_status_publishedAt_idx"
  ON "SiteUpdate"("status", "publishedAt");

CREATE INDEX IF NOT EXISTS "SiteUpdate_authorId_createdAt_idx"
  ON "SiteUpdate"("authorId", "createdAt");

CREATE INDEX IF NOT EXISTS "SiteUpdate_publishedAt_idx"
  ON "SiteUpdate"("publishedAt");

ALTER TABLE "SiteUpdate" DROP CONSTRAINT IF EXISTS "SiteUpdate_authorId_fkey";
ALTER TABLE "SiteUpdate"
  ADD CONSTRAINT "SiteUpdate_authorId_fkey"
  FOREIGN KEY ("authorId") REFERENCES "User"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
