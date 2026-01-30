"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { generateTermOptions } from "@/lib/utils";

interface PageProps {
  params: Promise<{ code: string }>;
}

const GRADES = ["A", "AB", "B", "BC", "C", "D", "F"] as const;
type Grade = (typeof GRADES)[number];

export default function WriteReviewPage({ params }: PageProps) {
  const { code } = use(params);
  const courseCode = code.replace("-", " ");
  const router = useRouter();
  const { data: session, status } = useSession();

  const { data: course } = trpc.courses.getByCode.useQuery({ code: courseCode });
  const createReview = trpc.reviews.create.useMutation({
    onSuccess: () => {
      router.push(`/courses/${code}`);
    },
  });

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    term: "",
    instructorId: "",
    gradeReceived: "" as Grade | "",
    contentRating: "" as Grade | "",
    teachingRating: "" as Grade | "",
    gradingRating: "" as Grade | "",
    workloadRating: "" as Grade | "",
    contentComment: "",
    teachingComment: "",
    gradingComment: "",
    workloadComment: "",
    overallComment: "",
    tips: "",
    hasHomework: false,
    hasMidterm: false,
    hasFinal: false,
    hasProject: false,
    hasQuiz: false,
    hasEssay: false,
    hasPresentation: false,
  });

  const termOptions = generateTermOptions(3);

  // Redirect if not authenticated
  if (status === "loading") {
    return (
      <div className="container flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="container py-8">
        <Card>
          <CardContent className="py-12 text-center">
            <h2 className="text-2xl font-bold">Sign in Required</h2>
            <p className="mt-2 text-muted-foreground">
              You need to sign in with your @wisc.edu email to write reviews.
            </p>
            <Link href="/auth/signin">
              <Button className="mt-4">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!course) return;

    try {
      await createReview.mutateAsync({
        courseId: course.id,
        term: formData.term,
        instructorId: formData.instructorId || undefined,
        gradeReceived: formData.gradeReceived || undefined,
        contentRating: formData.contentRating as Grade,
        teachingRating: formData.teachingRating as Grade,
        gradingRating: formData.gradingRating as Grade,
        workloadRating: formData.workloadRating as Grade,
        contentComment: formData.contentComment || undefined,
        teachingComment: formData.teachingComment || undefined,
        gradingComment: formData.gradingComment || undefined,
        workloadComment: formData.workloadComment || undefined,
        overallComment: formData.overallComment || undefined,
        tips: formData.tips || undefined,
        hasHomework: formData.hasHomework,
        hasMidterm: formData.hasMidterm,
        hasFinal: formData.hasFinal,
        hasProject: formData.hasProject,
        hasQuiz: formData.hasQuiz,
        hasEssay: formData.hasEssay,
        hasPresentation: formData.hasPresentation,
      });
    } catch (error) {
      console.error("Failed to create review:", error);
    }
  };

  const canProceedStep1 = formData.term !== "";
  const canProceedStep2 =
    formData.contentRating &&
    formData.teachingRating &&
    formData.gradingRating &&
    formData.workloadRating;

  return (
    <div className="container max-w-2xl py-8">
      {/* Back Button */}
      <Link
        href={`/courses/${code}`}
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to {courseCode}
      </Link>

      <h1 className="mb-6 text-2xl font-bold">
        Write a Review for {courseCode}
      </h1>

      {/* Progress Steps */}
      <div className="mb-8 flex items-center justify-between">
        {[1, 2, 3, 4].map((s) => (
          <div
            key={s}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-medium ${
              s <= step
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s}
          </div>
        ))}
      </div>

      {/* Step 1: Basic Info */}
      {step === 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Term */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                When did you take this course? *
              </label>
              <select
                value={formData.term}
                onChange={(e) =>
                  setFormData({ ...formData, term: e.target.value })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2"
              >
                <option value="">Select semester...</option>
                {termOptions.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Instructor */}
            {course?.instructors && course.instructors.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium">
                  Instructor (optional)
                </label>
                <select
                  value={formData.instructorId}
                  onChange={(e) =>
                    setFormData({ ...formData, instructorId: e.target.value })
                  }
                  className="w-full rounded-md border border-input bg-background px-3 py-2"
                >
                  <option value="">Select instructor...</option>
                  {course.instructors.map((ci) => (
                    <option key={ci.instructor.id} value={ci.instructor.id}>
                      {ci.instructor.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Grade Received */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Grade Received (optional)
              </label>
              <div className="flex flex-wrap gap-2">
                {GRADES.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        gradeReceived: formData.gradeReceived === g ? "" : g,
                      })
                    }
                    className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                      formData.gradeReceived === g
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-end pt-4">
              <Button onClick={() => setStep(2)} disabled={!canProceedStep1}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Ratings */}
      {step === 2 && (
        <Card>
          <CardHeader>
            <CardTitle>Rate This Course</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Content Rating */}
            <RatingSelector
              label="Course Content *"
              description="Quality of material, relevance, depth"
              value={formData.contentRating}
              onChange={(v) => setFormData({ ...formData, contentRating: v })}
            />

            {/* Teaching Rating */}
            <RatingSelector
              label="Teaching Quality *"
              description="Clarity, engagement, helpfulness"
              value={formData.teachingRating}
              onChange={(v) => setFormData({ ...formData, teachingRating: v })}
            />

            {/* Grading Rating */}
            <RatingSelector
              label="Grading *"
              description="Fairness, feedback quality"
              value={formData.gradingRating}
              onChange={(v) => setFormData({ ...formData, gradingRating: v })}
            />

            {/* Workload Rating */}
            <RatingSelector
              label="Workload *"
              description="A = Light, F = Very Heavy"
              value={formData.workloadRating}
              onChange={(v) => setFormData({ ...formData, workloadRating: v })}
            />

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(1)}>
                Back
              </Button>
              <Button onClick={() => setStep(3)} disabled={!canProceedStep2}>
                Next
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Assessments & Comments */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Assessment Types */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Assessment Types
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { key: "hasHomework", label: "Homework" },
                  { key: "hasMidterm", label: "Midterm" },
                  { key: "hasFinal", label: "Final" },
                  { key: "hasProject", label: "Project" },
                  { key: "hasQuiz", label: "Quizzes" },
                  { key: "hasEssay", label: "Essays" },
                  { key: "hasPresentation", label: "Presentations" },
                ].map((a) => (
                  <button
                    key={a.key}
                    type="button"
                    onClick={() =>
                      setFormData({
                        ...formData,
                        [a.key]: !formData[a.key as keyof typeof formData],
                      })
                    }
                    className={`rounded-md px-3 py-1.5 text-sm transition-colors ${
                      formData[a.key as keyof typeof formData]
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted hover:bg-muted/80"
                    }`}
                  >
                    {a.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Overall Comment */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Overall Review
              </label>
              <textarea
                value={formData.overallComment}
                onChange={(e) =>
                  setFormData({ ...formData, overallComment: e.target.value })
                }
                placeholder="Share your overall experience with this course..."
                className="min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            {/* Tips */}
            <div>
              <label className="mb-2 block text-sm font-medium">
                Tips for Future Students
              </label>
              <textarea
                value={formData.tips}
                onChange={(e) =>
                  setFormData({ ...formData, tips: e.target.value })
                }
                placeholder="Any advice for students taking this course?"
                className="min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </div>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(2)}>
                Back
              </Button>
              <Button onClick={() => setStep(4)}>Next</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Review & Submit */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Review & Submit</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Course</span>
                <span className="font-medium">{courseCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Term</span>
                <span className="font-medium">{formData.term}</span>
              </div>
              {formData.gradeReceived && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Grade</span>
                  <Badge>{formData.gradeReceived}</Badge>
                </div>
              )}
              <div className="border-t pt-3">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>Content: <Badge variant="outline">{formData.contentRating}</Badge></div>
                  <div>Teaching: <Badge variant="outline">{formData.teachingRating}</Badge></div>
                  <div>Grading: <Badge variant="outline">{formData.gradingRating}</Badge></div>
                  <div>Workload: <Badge variant="outline">{formData.workloadRating}</Badge></div>
                </div>
              </div>
              {formData.overallComment && (
                <div className="border-t pt-3">
                  <p className="text-sm">{formData.overallComment}</p>
                </div>
              )}
            </div>

            <p className="text-sm text-muted-foreground">
              By submitting, you confirm this review is based on your genuine
              experience as a student in this course.
            </p>

            <div className="flex justify-between pt-4">
              <Button variant="outline" onClick={() => setStep(3)}>
                Back
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={createReview.isPending}
              >
                {createReview.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Review"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Rating Selector Component
interface RatingSelectorProps {
  label: string;
  description: string;
  value: Grade | "";
  onChange: (value: Grade) => void;
}

function RatingSelector({
  label,
  description,
  value,
  onChange,
}: RatingSelectorProps) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">{label}</label>
      <p className="mb-2 text-xs text-muted-foreground">{description}</p>
      <div className="flex gap-2">
        {GRADES.map((g) => (
          <button
            key={g}
            type="button"
            onClick={() => onChange(g)}
            className={`flex-1 rounded-md py-2 text-sm font-medium transition-colors ${
              value === g
                ? "bg-primary text-primary-foreground"
                : "bg-muted hover:bg-muted/80"
            }`}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  );
}
