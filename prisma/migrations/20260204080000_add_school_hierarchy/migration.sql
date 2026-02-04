-- Add type and hierarchy to School
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'school';
ALTER TABLE "School" ADD COLUMN IF NOT EXISTS "parentId" TEXT;

-- Add foreign key for parent-child relationship
ALTER TABLE "School" ADD CONSTRAINT "School_parentId_fkey" 
  FOREIGN KEY ("parentId") REFERENCES "School"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Create index for parent lookup
CREATE INDEX IF NOT EXISTS "School_parentId_idx" ON "School"("parentId");
