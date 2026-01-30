"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Heart,
  PenSquare,
  BookOpen,
  Users,
  BarChart3,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, GradeBadge } from "@/components/ui/badge";
import { getCourseByCode, getGradeDistribution, getReviewsByCourse, mockInstructors } from "@/lib/mock-data";
import { gpaToGrade, formatTerm } from "@/lib/utils";

// Grade distribution chart component
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PageProps {
  params: Promise<{ code: string }>;
}

export default function CourseDetailPage({ params }: PageProps) {
  const { code } = use(params);
  const courseCode = code.replace("-", " ");

  // Get course data from mock
  const course = getCourseByCode(courseCode);
  const grades = course ? getGradeDistribution(course.id) : [];
  const reviews = course ? getReviewsByCourse(course.id) : [];

  // Aggregate grade data
  const aggregatedGrades = useMemo(() => {
    if (grades.length === 0) return null;

    const totals = grades.reduce(
      (acc, g) => ({
        a: acc.a + g.aCount,
        ab: acc.ab + g.abCount,
        b: acc.b + g.bCount,
        bc: acc.bc + g.bcCount,
        c: acc.c + g.cCount,
        d: acc.d + g.dCount,
        f: acc.f + g.fCount,
        total: acc.total + g.totalStudents,
      }),
      { a: 0, ab: 0, b: 0, bc: 0, c: 0, d: 0, f: 0, total: 0 }
    );

    return totals;
  }, [grades]);

  // Get instructors for this course
  const courseInstructors = useMemo(() => {
    if (!course) return [];
    // Map some instructors to courses
    const mapping: Record<string, string[]> = {
      cs577: ['dieter'],
      cs400: ['beck', 'deppeler'],
      cs540: ['jerry'],
    };
    const instructorIds = mapping[course.id] || [];
    return mockInstructors.filter(i => instructorIds.includes(i.id));
  }, [course]);

  if (!course) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold">Course Not Found</h2>
            <p className="mt-2 text-muted-foreground">
              We couldn't find a course with code "{courseCode}"
            </p>
            <Link href="/courses">
              <Button className="mt-4">Browse Courses</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare grade distribution data for chart
  const gradeData = aggregatedGrades
    ? [
        { grade: "A", count: aggregatedGrades.a, color: "#22c55e" },
        { grade: "AB", count: aggregatedGrades.ab, color: "#4ade80" },
        { grade: "B", count: aggregatedGrades.b, color: "#3b82f6" },
        { grade: "BC", count: aggregatedGrades.bc, color: "#60a5fa" },
        { grade: "C", count: aggregatedGrades.c, color: "#eab308" },
        { grade: "D", count: aggregatedGrades.d, color: "#f97316" },
        { grade: "F", count: aggregatedGrades.f, color: "#ef4444" },
      ]
    : [];

  const totalStudents = aggregatedGrades?.total || 0;

  return (
    <div className="container py-8">
      {/* Back Button */}
      <Link
        href="/courses"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to courses
      </Link>

      {/* Course Header */}
      <div className="mb-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">
              {course.code} - {course.name}
            </h1>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge variant="outline">{course.department}</Badge>
              <Badge variant="outline">{course.school}</Badge>
              <Badge variant="secondary">{course.credits} credits</Badge>
            </div>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Heart className="mr-2 h-4 w-4" />
              Save
            </Button>
            <Link href={`/courses/${code}/review`}>
              <Button size="sm">
                <PenSquare className="mr-2 h-4 w-4" />
                Write Review
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          {course.description && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Course Description
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">{course.description}</p>
                {course.prerequisites && (
                  <div className="mt-4">
                    <h4 className="font-medium">Prerequisites</h4>
                    <p className="text-sm text-muted-foreground">
                      {course.prerequisites}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Grade Distribution */}
          {totalStudents > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Grade Distribution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="mb-4 text-sm text-muted-foreground">
                  Based on {totalStudents.toLocaleString()} students across{" "}
                  {grades.length} semesters
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={gradeData}>
                      <XAxis dataKey="grade" />
                      <YAxis />
                      <Tooltip
                        formatter={(value: number) => [
                          `${value} students (${((value / totalStudents) * 100).toFixed(1)}%)`,
                          "Count",
                        ]}
                      />
                      <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                        {gradeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {course.avgGPA && (
                  <div className="mt-4 text-center">
                    <span className="text-lg font-semibold">
                      Average GPA: {course.avgGPA.toFixed(2)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Reviews */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Student Reviews ({reviews.length})
                </span>
                {course.avgRating && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      Average:
                    </span>
                    <GradeBadge grade={gpaToGrade(course.avgRating)} />
                  </div>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {reviews.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-muted-foreground">
                    No reviews yet. Be the first to review this course!
                  </p>
                  <Link href={`/courses/${code}/review`}>
                    <Button className="mt-4">Write a Review</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <ReviewCard key={review.id} review={review} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Credits</span>
                <span className="font-medium">{course.credits}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Level</span>
                <span className="font-medium">{course.level}-level</span>
              </div>
              {course.avgGPA && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg GPA</span>
                  <span className="font-medium">{course.avgGPA.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reviews</span>
                <span className="font-medium">{course.reviewCount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Instructors */}
          {courseInstructors.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Instructors</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {courseInstructors.map((instructor) => (
                    <li key={instructor.id} className="text-sm">
                      {instructor.name}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {/* GenEd */}
          {(course.genEds.length > 0 || course.breadths.length > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Requirements</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {course.genEds.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      General Education
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {course.genEds.map((g) => (
                        <Badge key={g} variant="secondary" className="text-xs">
                          {g}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                {course.breadths.length > 0 && (
                  <div>
                    <div className="text-sm text-muted-foreground mb-1">
                      Breadth
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {course.breadths.map((b) => (
                        <Badge key={b} variant="secondary" className="text-xs">
                          {b}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

// Review Card Component
interface ReviewCardProps {
  review: {
    id: string;
    term: string;
    gradeReceived: string | null;
    contentRating: string;
    teachingRating: string;
    gradingRating: string;
    workloadRating: string;
    contentComment: string | null;
    teachingComment: string | null;
    overallComment: string | null;
    tips: string | null;
    hasHomework: boolean;
    hasMidterm: boolean;
    hasFinal: boolean;
    hasProject: boolean;
    hasQuiz: boolean;
    hasEssay: boolean;
    hasPresentation: boolean;
    createdAt: Date;
    author: {
      id: string;
      name: string | null;
      email?: string;
    };
    instructor: {
      id: string;
      name: string;
    } | null;
  };
}

function ReviewCard({ review }: ReviewCardProps) {
  const assessments = [
    { label: "Homework", has: review.hasHomework },
    { label: "Midterm", has: review.hasMidterm },
    { label: "Final", has: review.hasFinal },
    { label: "Project", has: review.hasProject },
    { label: "Quiz", has: review.hasQuiz },
    { label: "Essay", has: review.hasEssay },
    { label: "Presentation", has: review.hasPresentation },
  ];

  return (
    <div className="border-b pb-4 last:border-0 last:pb-0">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="font-medium">
            {formatTerm(review.term)}
          </span>
          {review.instructor && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">
                {review.instructor.name}
              </span>
            </>
          )}
          {review.gradeReceived && (
            <>
              <span className="text-muted-foreground">•</span>
              <span className="text-sm">
                Grade: <GradeBadge grade={review.gradeReceived} className="ml-1" />
              </span>
            </>
          )}
        </div>
        <span className="text-xs text-muted-foreground">
          {new Date(review.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Ratings */}
      <div className="flex flex-wrap gap-3 mb-3">
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Content:</span>
          <GradeBadge grade={review.contentRating} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Teaching:</span>
          <GradeBadge grade={review.teachingRating} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Grading:</span>
          <GradeBadge grade={review.gradingRating} />
        </div>
        <div className="flex items-center gap-1">
          <span className="text-sm text-muted-foreground">Workload:</span>
          <GradeBadge grade={review.workloadRating} />
        </div>
      </div>

      {/* Assessments */}
      <div className="flex flex-wrap gap-2 mb-3">
        {assessments.map((a) =>
          a.has ? (
            <Badge key={a.label} variant="outline" className="text-xs gap-1">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              {a.label}
            </Badge>
          ) : null
        )}
      </div>

      {/* Comments */}
      {(review.overallComment || review.contentComment || review.teachingComment) && (
        <div className="space-y-2 text-sm">
          {review.overallComment && <p>{review.overallComment}</p>}
          {review.contentComment && (
            <p>
              <span className="font-medium">Content: </span>
              {review.contentComment}
            </p>
          )}
          {review.teachingComment && (
            <p>
              <span className="font-medium">Teaching: </span>
              {review.teachingComment}
            </p>
          )}
        </div>
      )}

      {/* Tips */}
      {review.tips && (
        <div className="mt-3 rounded-md bg-muted p-3">
          <div className="text-xs font-medium text-muted-foreground mb-1">
            💡 Tips for future students
          </div>
          <p className="text-sm">{review.tips}</p>
        </div>
      )}
    </div>
  );
}
