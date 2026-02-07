import { router } from './trpc/trpc'
import { courseRouter } from './routers/course'
import { reviewRouter } from './routers/review'
import { commentRouter } from './routers/comment'
import { instructorRouter } from './routers/instructor'
import { userRouter } from './routers/user'

export const appRouter = router({
  course: courseRouter,
  review: reviewRouter,
  comment: commentRouter,
  instructor: instructorRouter,
  user: userRouter,
})

export type AppRouter = typeof appRouter
