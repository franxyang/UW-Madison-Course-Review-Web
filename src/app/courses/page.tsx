"use client";

import { useState, useEffect, useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge, GradeBadge } from "@/components/ui/badge";
import { searchCourses, mockCourses, mockDepartments } from "@/lib/mock-data";
import { gpaToGrade } from "@/lib/utils";

export default function CoursesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get initial values from URL
  const initialQuery = searchParams.get("q") || "";
  const initialDept = searchParams.get("dept") || "";
  const initialLevel = searchParams.get("level") || "";

  const [query, setQuery] = useState(initialQuery);
  const [department, setDepartment] = useState(initialDept);
  const [level, setLevel] = useState(initialLevel);
  const [showFilters, setShowFilters] = useState(false);

  // Filter courses using mock data
  const filteredCourses = useMemo(() => {
    let results = searchCourses(query, department || undefined);

    // Apply level filter
    if (level) {
      results = results.filter(course => course.level === level);
    }

    return results;
  }, [query, department, level]);

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams();
    if (query) params.set("q", query);
    if (department) params.set("dept", department);
    if (level) params.set("level", level);
    router.replace(`/courses?${params.toString()}`, { scroll: false });
  }, [query, department, level, router]);

  const clearFilters = () => {
    setQuery("");
    setDepartment("");
    setLevel("");
  };

  const hasActiveFilters = query || department || level;

  const levels = ["100", "200", "300", "400", "500", "600"];

  return (
    <div className="container py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Course Catalog</h1>
        <p className="text-muted-foreground">
          Browse and search through {mockCourses.length} courses
        </p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 space-y-4">
        {/* Search Bar */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search by course code or name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className={showFilters ? "bg-accent" : ""}
          >
            <Filter className="mr-2 h-4 w-4" />
            Filters
          </Button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <Card>
            <CardContent className="p-4">
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {/* Department Filter */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Department
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">All Departments</option>
                    {mockDepartments.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Level Filter */}
                <div>
                  <label className="mb-2 block text-sm font-medium">
                    Course Level
                  </label>
                  <select
                    value={level}
                    onChange={(e) => setLevel(e.target.value)}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                  >
                    <option value="">All Levels</option>
                    {levels.map((l) => (
                      <option key={l} value={l}>
                        {l}-level
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Clear Filters */}
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  <X className="mr-2 h-4 w-4" />
                  Clear all filters
                </Button>
              )}
            </CardContent>
          </Card>
        )}

        {/* Active Filters Tags */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {query && (
              <Badge variant="secondary" className="gap-1">
                Search: {query}
                <button onClick={() => setQuery("")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {department && (
              <Badge variant="secondary" className="gap-1">
                {department}
                <button onClick={() => setDepartment("")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
            {level && (
              <Badge variant="secondary" className="gap-1">
                {level}-level
                <button onClick={() => setLevel("")}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        {filteredCourses.length === 0 ? (
          // No results
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-lg font-medium">No courses found</p>
              <p className="text-muted-foreground">
                Try adjusting your search or filters
              </p>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  onClick={clearFilters}
                  className="mt-4"
                >
                  Clear filters
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          // Course list
          <>
            <p className="text-sm text-muted-foreground mb-4">
              Showing {filteredCourses.length} course{filteredCourses.length !== 1 ? 's' : ''}
            </p>
            {filteredCourses.map((course) => (
              <CourseListItem key={course.id} course={course} />
            ))}
          </>
        )}
      </div>
    </div>
  );
}

// Course List Item Component
interface CourseListItemProps {
  course: {
    id: string;
    code: string;
    name: string;
    credits: number;
    department: string;
    school: string;
    level: string;
    avgGPA: number | null;
    avgRating: number | null;
    reviewCount: number;
  };
}

function CourseListItem({ course }: CourseListItemProps) {
  const ratingGrade = course.avgRating ? gpaToGrade(course.avgRating) : null;

  return (
    <Link href={`/courses/${course.code.replace(" ", "-")}`}>
      <Card className="transition-all hover:border-primary/50 hover:shadow-md">
        <CardContent className="flex items-center gap-4 p-4">
          {/* Course Code */}
          <div className="w-24 shrink-0">
            <span className="text-lg font-bold">{course.code}</span>
          </div>

          {/* Course Info */}
          <div className="flex-1 min-w-0">
            <h3 className="font-medium line-clamp-1">{course.name}</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>{course.department}</span>
              <span>•</span>
              <span>{course.credits} credits</span>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Average GPA */}
            {course.avgGPA && (
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Avg GPA</div>
                <div className="font-semibold">{course.avgGPA.toFixed(2)}</div>
              </div>
            )}

            {/* Rating */}
            {ratingGrade && (
              <div className="text-center">
                <div className="text-sm text-muted-foreground">Rating</div>
                <GradeBadge grade={ratingGrade} />
              </div>
            )}

            {/* Review Count */}
            <div className="text-center min-w-[60px]">
              <div className="text-sm text-muted-foreground">Reviews</div>
              <div className="font-semibold">{course.reviewCount}</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
