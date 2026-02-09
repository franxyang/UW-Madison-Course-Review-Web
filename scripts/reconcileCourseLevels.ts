/**
 * Reconcile Course.level with level inferred from course code number.
 *
 * Rules:
 * - < 300 => Elementary
 * - 300-499 => Intermediate
 * - >= 500 => Advanced
 *
 * Usage:
 *   npx tsx scripts/reconcileCourseLevels.ts           # dry run
 *   npx tsx scripts/reconcileCourseLevels.ts --commit  # apply updates
 */

import { prisma } from '../lib/prisma'
import { inferCourseLevelFromCode } from '../lib/courseLevel'

const COMMIT = process.argv.includes('--commit')
const CHUNK_SIZE = 500

async function main() {
  console.log(`\n🔎 Course Level Reconcile ${COMMIT ? '(COMMIT MODE)' : '(DRY RUN)'}\n`)

  const courses = await prisma.course.findMany({
    select: { id: true, code: true, level: true },
  })

  const mismatches: Array<{
    id: string
    code: string
    currentLevel: string
    expectedLevel: 'Elementary' | 'Intermediate' | 'Advanced'
  }> = []

  for (const course of courses) {
    const expected = inferCourseLevelFromCode(course.code)
    if (!expected) continue
    if (course.level !== expected) {
      mismatches.push({
        id: course.id,
        code: course.code,
        currentLevel: course.level,
        expectedLevel: expected,
      })
    }
  }

  const byTarget = mismatches.reduce<Record<string, number>>((acc, row) => {
    const key = `${row.currentLevel} -> ${row.expectedLevel}`
    acc[key] = (acc[key] || 0) + 1
    return acc
  }, {})

  console.log(`Total courses: ${courses.length}`)
  console.log(`Mismatched levels: ${mismatches.length}`)
  console.log('Mismatch breakdown:', byTarget)
  if (mismatches.length > 0) {
    console.log('Sample:', mismatches.slice(0, 20))
  }

  if (!COMMIT) {
    console.log('\nDry run only. Re-run with --commit to apply updates.')
    return
  }

  if (mismatches.length === 0) {
    console.log('\nNo updates needed.')
    return
  }

  const byExpected = {
    Elementary: [] as string[],
    Intermediate: [] as string[],
    Advanced: [] as string[],
  }

  for (const row of mismatches) {
    byExpected[row.expectedLevel].push(row.id)
  }

  let updated = 0
  for (const [level, ids] of Object.entries(byExpected) as Array<
    ['Elementary' | 'Intermediate' | 'Advanced', string[]]
  >) {
    for (let i = 0; i < ids.length; i += CHUNK_SIZE) {
      const batch = ids.slice(i, i + CHUNK_SIZE)
      if (batch.length === 0) continue
      const result = await prisma.course.updateMany({
        where: { id: { in: batch } },
        data: { level },
      })
      updated += result.count
    }
  }

  const remaining = await prisma.course.count({
    where: {
      OR: mismatches.map((m) => ({
        id: m.id,
        level: { not: m.expectedLevel },
      })),
    },
  })

  console.log(`\nUpdated rows: ${updated}`)
  console.log(`Remaining mismatches in touched rows: ${remaining}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
