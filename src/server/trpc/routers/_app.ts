import { createTRPCRouter } from "@/server/trpc";
import { coursesRouter } from "./courses";
import { reviewsRouter } from "./reviews";

/**
 * This is the primary router for your server.
 *
 * All routers added in /server/trpc/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  courses: coursesRouter,
  reviews: reviewsRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
