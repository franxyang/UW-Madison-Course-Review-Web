import { router } from './trpc/trpc'
import { courseRouter } from './routers/course'
import { reviewRouter } from './routers/review'
import { commentRouter } from './routers/comment'

export const appRouter = router({
  course: courseRouter,
  review: reviewRouter,
  comment: commentRouter,
})

export type AppRouter = typeof appRouter
