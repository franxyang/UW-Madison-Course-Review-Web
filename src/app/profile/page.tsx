"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { User, PenSquare, Heart, Settings, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const { data: myReviews, isLoading } = trpc.reviews.getMyReviews.useQuery(
    undefined,
    { enabled: !!session }
  );

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
              Please sign in to view your profile.
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">My Profile</h1>
        <p className="text-muted-foreground">
          Manage your account and reviews
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* User Info Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <User className="mr-2 h-5 w-5" />
              Account
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <div className="text-sm text-muted-foreground">Name</div>
                <div className="font-medium">
                  {session.user?.name || "Anonymous"}
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Email</div>
                <div className="font-medium">{session.user?.email}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PenSquare className="mr-2 h-5 w-5" />
              My Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold">
              {isLoading ? "..." : myReviews?.length || 0}
            </div>
            <p className="text-sm text-muted-foreground">reviews written</p>
            <Link href="/profile/reviews">
              <Button variant="outline" size="sm" className="mt-4">
                View All
              </Button>
            </Link>
          </CardContent>
        </Card>

        {/* Quick Links */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Links</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <Link href="/profile/reviews" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <PenSquare className="mr-2 h-4 w-4" />
                My Reviews
              </Button>
            </Link>
            <Link href="/courses" className="block">
              <Button variant="ghost" className="w-full justify-start">
                <Heart className="mr-2 h-4 w-4" />
                Browse Courses
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
