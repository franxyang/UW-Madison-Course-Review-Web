-- Add tsvector column for full-text search
ALTER TABLE "Course" ADD COLUMN IF NOT EXISTS "searchVector" tsvector;

-- Populate searchVector from existing data
UPDATE "Course" SET "searchVector" = 
  setweight(to_tsvector('english', COALESCE("code", '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("name", '')), 'A') ||
  setweight(to_tsvector('english', COALESCE("description", '')), 'B');

-- Create GIN index for fast full-text search
CREATE INDEX IF NOT EXISTS "Course_searchVector_idx" ON "Course" USING GIN ("searchVector");

-- Create trigger function to auto-update searchVector
CREATE OR REPLACE FUNCTION course_search_vector_update() RETURNS trigger AS $$
BEGIN
  NEW."searchVector" :=
    setweight(to_tsvector('english', COALESCE(NEW."code", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."name", '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(NEW."description", '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS course_search_vector_trigger ON "Course";
CREATE TRIGGER course_search_vector_trigger
  BEFORE INSERT OR UPDATE OF "code", "name", "description"
  ON "Course"
  FOR EACH ROW
  EXECUTE FUNCTION course_search_vector_update();
