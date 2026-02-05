-- CreateTable
CREATE TABLE "GradeDistributionInstructor" (
    "gradeDistributionId" TEXT NOT NULL,
    "instructorId" TEXT NOT NULL,

    CONSTRAINT "GradeDistributionInstructor_pkey" PRIMARY KEY ("gradeDistributionId","instructorId")
);

-- AddForeignKey
ALTER TABLE "GradeDistributionInstructor" ADD CONSTRAINT "GradeDistributionInstructor_gradeDistributionId_fkey" FOREIGN KEY ("gradeDistributionId") REFERENCES "GradeDistribution"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GradeDistributionInstructor" ADD CONSTRAINT "GradeDistributionInstructor_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "Instructor"("id") ON DELETE CASCADE ON UPDATE CASCADE;
