import { prisma } from '../lib/prisma'

const INSTRUCTOR_NAMES = [
  'Dr. Sarah Johnson',
  'Prof. Michael Chen',
  'Dr. Emily Rodriguez',
  'Prof. David Kim',
  'Dr. Jennifer Lee',
  'Prof. Robert Wilson',
  'Dr. Maria Garcia',
  'Prof. James Anderson',
  'Dr. Lisa Thompson',
  'Prof. Daniel Martinez'
]

const REVIEW_TITLES = [
  'Great content but tough exams',
  'Excellent professor, highly recommend',
  'Challenging but rewarding',
  'Good course for beginners',
  'Heavy workload but learned a lot',
  'Best class I\'ve taken at UW',
  'Interesting material, fair grading',
  'Not what I expected',
  'Perfect intro course',
  'Prepare to work hard'
]

const CONTENT_COMMENTS = [
  'The course material was well-structured and covered all the fundamentals thoroughly.',
  'Content was interesting but sometimes felt rushed. More examples would have helped.',
  'Excellent coverage of both theoretical and practical aspects.',
  'The topics built on each other logically, making it easy to follow.',
  'Some concepts were difficult to grasp without prior background.'
]

const TEACHING_COMMENTS = [
  'Professor was enthusiastic and made lectures engaging.',
  'Clear explanations and always willing to help during office hours.',
  'Teaching style was a bit dry but the material was presented clearly.',
  'Great at breaking down complex concepts into digestible pieces.',
  'Sometimes went too fast through difficult topics.'
]

const GRADING_COMMENTS = [
  'Fair grading with clear rubrics provided for all assignments.',
  'Exams were challenging but reflected the course material well.',
  'Grading was harsh, especially on the midterm.',
  'Partial credit was generous which helped a lot.',
  'Clear expectations and timely feedback on assignments.'
]

const WORKLOAD_COMMENTS = [
  'Manageable workload with weekly assignments.',
  'Heavy reading load but assignments were reasonable.',
  'Expect to spend 10+ hours per week on this course.',
  'Light workload compared to other courses at this level.',
  'Projects were time-consuming but valuable learning experiences.'
]

async function seedSampleReviews() {
  try {
    console.log('🎓 Creating sample instructors and reviews...')

    // Create instructors
    const instructors = []
    for (const name of INSTRUCTOR_NAMES) {
      const instructor = await prisma.instructor.upsert({
        where: { name },
        update: {},
        create: { name }
      })
      instructors.push(instructor)
    }
    console.log(`✅ Created ${instructors.length} instructors`)

    // Get a sample of courses to add reviews to
    const courses = await prisma.course.findMany({
      take: 30,
      orderBy: { code: 'asc' }
    })

    console.log(`📚 Adding reviews to ${courses.length} courses...`)

    const terms = ['Fall 2024', 'Spring 2024', 'Fall 2023']
    const grades = ['A', 'AB', 'B', 'BC', 'C']
    const ratings = ['A', 'B', 'C', 'D']
    const assessments = ['Midterm', 'Final', 'Project', 'Homework', 'Quiz']

    let reviewCount = 0

    for (const course of courses) {
      // Add 1-3 reviews per course
      const numReviews = Math.floor(Math.random() * 3) + 1

      for (let i = 0; i < numReviews; i++) {
        const instructor = instructors[Math.floor(Math.random() * instructors.length)]
        const term = terms[Math.floor(Math.random() * terms.length)]
        const grade = grades[Math.floor(Math.random() * grades.length)]

        // Generate ratings (better courses get better ratings)
        const isGoodCourse = Math.random() > 0.3
        const getRating = () => {
          if (isGoodCourse) {
            return ratings[Math.floor(Math.random() * 2)] // A or B
          } else {
            return ratings[Math.floor(Math.random() * 2) + 2] // C or D
          }
        }

        const review = await prisma.review.create({
          data: {
            courseId: course.id,
            authorId: 'temp-user-id',
            instructorId: instructor.id,
            term,
            title: REVIEW_TITLES[Math.floor(Math.random() * REVIEW_TITLES.length)],
            gradeReceived: grade,
            contentRating: getRating(),
            teachingRating: getRating(),
            gradingRating: getRating(),
            workloadRating: getRating(),
            contentComment: CONTENT_COMMENTS[Math.floor(Math.random() * CONTENT_COMMENTS.length)],
            teachingComment: TEACHING_COMMENTS[Math.floor(Math.random() * TEACHING_COMMENTS.length)],
            gradingComment: GRADING_COMMENTS[Math.floor(Math.random() * GRADING_COMMENTS.length)],
            workloadComment: WORKLOAD_COMMENTS[Math.floor(Math.random() * WORKLOAD_COMMENTS.length)],
            assessments: assessments.filter(() => Math.random() > 0.5),
            resourceLink: Math.random() > 0.7 ? 'https://drive.google.com/example' : null
          }
        })

        // Add 0-2 comments to some reviews
        if (Math.random() > 0.5) {
          const numComments = Math.floor(Math.random() * 3)
          for (let j = 0; j < numComments; j++) {
            await prisma.comment.create({
              data: {
                reviewId: review.id,
                authorId: 'temp-user-id',
                text: [
                  'I had a similar experience in this course.',
                  'Thanks for sharing! This was helpful.',
                  'I disagree, I found the workload much lighter.',
                  'Great review! Exactly matches my experience.',
                  'The professor has improved since this review.'
                ][Math.floor(Math.random() * 5)]
              }
            })
          }
        }

        reviewCount++
      }
    }

    // Update course average ratings
    console.log('📊 Updating course average ratings...')

    for (const course of courses) {
      const reviews = await prisma.review.findMany({
        where: { courseId: course.id }
      })

      if (reviews.length > 0) {
        const avgRating = reviews.reduce((sum, r) => {
          const ratings = [r.contentRating, r.teachingRating, r.gradingRating, r.workloadRating]
          const ratingValues = ratings.map(rating => {
            const map: Record<string, number> = { 'A': 4, 'B': 3, 'C': 2, 'D': 1, 'F': 0 }
            return map[rating] || 0
          })
          return sum + (ratingValues.reduce((a, b) => a + b, 0) / 4)
        }, 0) / reviews.length

        await prisma.course.update({
          where: { id: course.id },
          data: { avgRating }
        })
      }
    }

    console.log(`✅ Successfully created ${reviewCount} reviews with comments!`)
    process.exit(0)
  } catch (error) {
    console.error('❌ Error seeding sample reviews:', error)
    process.exit(1)
  }
}

seedSampleReviews()