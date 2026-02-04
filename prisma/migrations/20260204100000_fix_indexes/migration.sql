-- Recreate indexes that were dropped by previous migration but manually restored
-- This migration aligns the migration history with the actual DB state

-- CreateIndex (these already exist in the DB, but need to be in migration history)
CREATE INDEX IF NOT EXISTS "Course_searchVector_idx" ON "Course" USING GIN ("searchVector");
CREATE INDEX IF NOT EXISTS "School_parentId_idx" ON "School"("parentId");
