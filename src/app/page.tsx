"use client";

import Link from "next/link";
import { Search } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, GradeBadge } from "@/components/ui/badge";
import { getPopularCourses, getTopRatedCourses } from "@/lib/mock-data";

export default function HomePage() {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  // Use mock data for now
  const popularCourses = getPopularCourses(4);
  const topRatedCourses = getTopRatedCourses(4);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/courses?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-b from-badger-red/5 to-background py-20 lg:py-32">
        <div className="container flex flex-col items-center text-center">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Find Your Next{" "}
            <span className="text-badger-red">Course</span>
          </h1>
          <p className="mt-4 max-w-[600px] text-lg text-muted-foreground">
            Real reviews from UW Madison students. Grade distributions, workload
            ratings, and tips to help you succeed.
          </p>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="mt-8 flex w-full max-w-md items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by course code or name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button type="submit">Search</Button>
          </form>

          {/* Quick Links */}
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <span className="text-sm text-muted-foreground">Popular:</span>
            {["CS 577", "CS 400", "ECON 101", "MATH 222"].map((code) => (
              <Link key={code} href={`/courses/${code.replace(" ", "-")}`}>
                <Badge variant="outline" className="cursor-pointer hover:bg-accent">
                  {code}
                </Badge>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Course Sections */}
      <section className="container py-12">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Popular Courses */}
          <div>
            <h2 className="mb-4 flex items-center text-2xl font-bold">
              <span className="mr-2">🔥</span> Most Reviewed
            </h2>
            <div className="space-y-3">
              {popularCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>

          {/* Top Rated Courses */}
          <div>
            <h2 className="mb-4 flex items-center text-2xl font-bold">
              <span className="mr-2">⭐</span> Top Rated
            </h2>
            <div className="space-y-3">
              {topRatedCourses.map((course) => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="border-t bg-muted/50 py-12">
        <div className="container text-center">
          <h2 className="text-2xl font-bold">Share Your Experience</h2>
          <p className="mt-2 text-muted-foreground">
            Help fellow Badgers by writing reviews for courses you've taken.
          </p>
          <Link href="/courses">
            <Button className="mt-4" size="lg">
              Browse Courses
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}

// Course Card Component
interface CourseCardProps {
  course: {
    id: string;
    code: string;
    name: string;
    credits: number;
    department: string;
    avgRating: number | null;
    reviewCount: number;
  };
}

function CourseCard({ course }: CourseCardProps) {
  const gpaToGrade = (gpa: number | null) => {
    if (!gpa) return null;
    if (gpa >= 3.75) return "A";
    if (gpa >= 3.25) return "AB";
    if (gpa >= 2.75) return "B";
    if (gpa >= 2.25) return "BC";
    if (gpa >= 1.75) return "C";
    if (gpa >= 0.75) return "D";
    return "F";
  };

  const ratingGrade = gpaToGrade(course.avgRating);

  return (
    <Link href={`/courses/${course.code.replace(" ", "-")}`}>
      <Card className="transition-colors hover:bg-accent/50">
        <CardContent className="flex items-center justify-between p-4">
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <span className="font-semibold">{course.code}</span>
              <Badge variant="outline" className="text-xs">
                {course.credits} cr
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-1">
              {course.name}
            </p>
          </div>
          <div className="flex items-center gap-3 text-right">
            {ratingGrade && <GradeBadge grade={ratingGrade} />}
            <span className="text-sm text-muted-foreground">
              {course.reviewCount} reviews
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
