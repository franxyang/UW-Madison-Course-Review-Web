import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "@/server/trpc";

export const coursesRouter = createTRPCRouter({
  /**
   * Search courses with filters
   */
  search: publicProcedure
    .input(
      z.object({
        query: z.string().optional(),
        department: z.string().optional(),
        school: z.string().optional(),
        level: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().default(20),
        sortBy: z
          .enum(["relevance", "rating", "gpa", "reviews", "code"])
          .default("relevance"),
      })
    )
    .query(async ({ ctx, input }) => {
      const { query, department, school, level, page, limit, sortBy } = input;
      const skip = (page - 1) * limit;

      // Build where clause
      const where: any = {};

      if (query) {
        where.OR = [
          { code: { contains: query, mode: "insensitive" } },
          { name: { contains: query, mode: "insensitive" } },
          { description: { contains: query, mode: "insensitive" } },
        ];
      }

      if (department) {
        where.department = department;
      }

      if (school) {
        where.school = school;
      }

      if (level) {
        where.level = level;
      }

      // Build orderBy
      let orderBy: any = { code: "asc" };
      switch (sortBy) {
        case "rating":
          orderBy = { avgRating: "desc" };
          break;
        case "gpa":
          orderBy = { avgGPA: "desc" };
          break;
        case "reviews":
          orderBy = { reviewCount: "desc" };
          break;
        case "code":
          orderBy = { code: "asc" };
          break;
      }

      const [courses, total] = await Promise.all([
        ctx.db.course.findMany({
          where,
          orderBy,
          skip,
          take: limit,
          select: {
            id: true,
            code: true,
            name: true,
            credits: true,
            department: true,
            school: true,
            level: true,
            avgGPA: true,
            avgRating: true,
            reviewCount: true,
          },
        }),
        ctx.db.course.count({ where }),
      ]);

      return {
        courses,
        total,
        page,
        totalPages: Math.ceil(total / limit),
      };
    }),

  /**
   * Get course by code with full details
   */
  getByCode: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ ctx, input }) => {
      const course = await ctx.db.course.findUnique({
        where: { code: input.code },
        include: {
          grades: {
            orderBy: { term: "desc" },
            take: 10,
          },
          reviews: {
            where: { status: "PUBLISHED" },
            orderBy: { createdAt: "desc" },
            take: 10,
            include: {
              author: {
                select: { id: true, name: true, image: true },
              },
              instructor: {
                select: { id: true, name: true },
              },
            },
          },
          instructors: {
            include: {
              instructor: {
                select: { id: true, name: true },
              },
            },
          },
        },
      });

      if (!course) {
        return null;
      }

      // Calculate aggregated grade distribution
      const totalGrades = course.grades.reduce(
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

      return {
        ...course,
        aggregatedGrades: totalGrades,
      };
    }),

  /**
   * Get popular courses (most reviewed)
   */
  getPopular: publicProcedure
    .input(z.object({ limit: z.number().default(8) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.course.findMany({
        where: { reviewCount: { gt: 0 } },
        orderBy: { reviewCount: "desc" },
        take: input.limit,
        select: {
          id: true,
          code: true,
          name: true,
          credits: true,
          department: true,
          avgRating: true,
          reviewCount: true,
        },
      });
    }),

  /**
   * Get top rated courses
   */
  getTopRated: publicProcedure
    .input(z.object({ limit: z.number().default(8), minReviews: z.number().default(3) }))
    .query(async ({ ctx, input }) => {
      return ctx.db.course.findMany({
        where: {
          reviewCount: { gte: input.minReviews },
          avgRating: { not: null },
        },
        orderBy: { avgRating: "desc" },
        take: input.limit,
        select: {
          id: true,
          code: true,
          name: true,
          credits: true,
          department: true,
          avgRating: true,
          reviewCount: true,
        },
      });
    }),

  /**
   * Get all departments (for filter dropdown)
   */
  getDepartments: publicProcedure.query(async ({ ctx }) => {
    const departments = await ctx.db.course.findMany({
      select: { department: true, school: true },
      distinct: ["department"],
      orderBy: { department: "asc" },
    });

    return departments;
  }),
});
