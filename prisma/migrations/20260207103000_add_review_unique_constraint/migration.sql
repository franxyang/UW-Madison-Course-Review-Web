-- Enforce one review per user per course+instructor
CREATE UNIQUE INDEX "Review_authorId_courseId_instructorId_key"
ON "Review"("authorId", "courseId", "instructorId");
