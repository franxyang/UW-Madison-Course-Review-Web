import { router } from './trpc/trpc'
import { courseRouter } from './routers/course'
import { reviewRouter } from './routers/review'
import { commentRouter } from './routers/comment'
import { instructorRouter } from './routers/instructor'
import { userRouter } from './routers/user'
import { adminRouter } from './routers/admin'
import { authRouter } from './routers/auth'
import { siteRouter } from './routers/site'

export const appRouter = router({
  course: courseRouter,
  review: reviewRouter,
  comment: commentRouter,
  instructor: instructorRouter,
  user: userRouter,
  admin: adminRouter,
  auth: authRouter,
  site: siteRouter,
})

export type AppRouter = typeof appRouter
