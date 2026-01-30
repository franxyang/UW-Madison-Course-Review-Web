"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { ArrowLeft, PenSquare, Trash2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge, GradeBadge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { formatTerm } from "@/lib/utils";

export default function MyReviewsPage() {
  const { data: session, status } = useSession();
  const utils = trpc.useUtils();

  const { data: reviews, isLoading } = trpc.reviews.getMyReviews.useQuery(
    undefined,
    { enabled: !!session }
  );

  const deleteReview = trpc.reviews.delete.useMutation({
    onSuccess: () => {
      utils.reviews.getMyReviews.invalidate();
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm("Are you sure you want to delete this review?")) {
      await deleteReview.mutateAsync({ id });
    }
  };

  if (status === "loading" || isLoading) {
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
              Please sign in to view your reviews.
            </p>
            <Link href="/auth/signin">
              <Button className="mt-4">Sign In</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8">
      {/* Back Button */}
      <Link
        href="/profile"
        className="mb-4 inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Profile
      </Link>

      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Reviews</h1>
          <p className="text-muted-foreground">
            {reviews?.length || 0} reviews written
          </p>
        </div>
        <Link href="/courses">
          <Button>
            <PenSquare className="mr-2 h-4 w-4" />
            Write a Review
          </Button>
        </Link>
      </div>

      {reviews?.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-lg font-medium">No reviews yet</p>
            <p className="text-muted-foreground">
              Share your experience with courses you've taken!
            </p>
            <Link href="/courses">
              <Button className="mt-4">Browse Courses</Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reviews?.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    {/* Course Info */}
                    <Link
                      href={`/courses/${review.course.code.replace(" ", "-")}`}
                      className="text-lg font-semibold hover:text-primary"
                    >
                      {review.course.code} - {review.course.name}
                    </Link>

                    {/* Meta */}
                    <div className="mt-1 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                      <span>{formatTerm(review.term)}</span>
                      {review.instructor && (
                        <>
                          <span>•</span>
                          <span>{review.instructor.name}</span>
                        </>
                      )}
                      {review.gradeReceived && (
                        <>
                          <span>•</span>
                          <span>Grade: {review.gradeReceived}</span>
                        </>
                      )}
                    </div>

                    {/* Ratings */}
                    <div className="mt-3 flex flex-wrap gap-3">
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">
                          Content:
                        </span>
                        <GradeBadge grade={review.contentRating} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">
                          Teaching:
                        </span>
                        <GradeBadge grade={review.teachingRating} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">
                          Grading:
                        </span>
                        <GradeBadge grade={review.gradingRating} />
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-sm text-muted-foreground">
                          Workload:
                        </span>
                        <GradeBadge grade={review.workloadRating} />
                      </div>
                    </div>

                    {/* Comment Preview */}
                    {review.overallComment && (
                      <p className="mt-3 text-sm line-clamp-2">
                        {review.overallComment}
                      </p>
                    )}

                    {/* Date */}
                    <p className="mt-2 text-xs text-muted-foreground">
                      Posted {new Date(review.createdAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(review.id)}
                      disabled={deleteReview.isPending}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
