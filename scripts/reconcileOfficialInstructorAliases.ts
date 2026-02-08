import { PrismaClient } from '@prisma/client'
import { normalizeInstructorName } from '../lib/instructorName'

const prisma = new PrismaClient()
const BATCH_SIZE = 500
const CONCURRENCY = 20

type InstructorRow = {
  id: string
  name: string
  nameKey: string | null
}

async function runWithConcurrency<T>(
  items: T[],
  limit: number,
  worker: (item: T) => Promise<void>,
) {
  let index = 0

  const runners = Array.from({ length: Math.max(1, limit) }, async () => {
    while (true) {
      const currentIndex = index
      index += 1
      if (currentIndex >= items.length) return
      await worker(items[currentIndex])
    }
  })

  await Promise.all(runners)
}

async function main() {
  const totalInstructors = await prisma.instructor.count()
  let processed = 0
  let cursorId: string | undefined

  let updatedNameKeys = 0
  let upsertedAliases = 0
  let failed = 0
  const sampleFailures: Array<{ id: string; reason: string }> = []

  while (processed < totalInstructors) {
    const instructors: InstructorRow[] = await prisma.instructor.findMany({
      ...(cursorId
        ? {
            cursor: { id: cursorId },
            skip: 1,
          }
        : {}),
      take: BATCH_SIZE,
      orderBy: { id: 'asc' },
      select: {
        id: true,
        name: true,
        nameKey: true,
      },
    })

    if (instructors.length === 0) break

    await runWithConcurrency(instructors, CONCURRENCY, async (instructor) => {
      try {
        const normalized = normalizeInstructorName(instructor.name)
        if (!normalized.key) return

        if (instructor.nameKey !== normalized.key) {
          await prisma.instructor.update({
            where: { id: instructor.id },
            data: { nameKey: normalized.key },
          })
          updatedNameKeys += 1
        }

        await prisma.instructorAlias.upsert({
          where: {
            aliasKey_instructorId: {
              aliasKey: normalized.key,
              instructorId: instructor.id,
            },
          },
          update: {
            aliasRaw: instructor.name,
            source: 'official',
          },
          create: {
            aliasRaw: instructor.name,
            aliasKey: normalized.key,
            source: 'official',
            instructorId: instructor.id,
          },
        })
        upsertedAliases += 1
      } catch (error) {
        failed += 1
        if (sampleFailures.length < 20) {
          sampleFailures.push({
            id: instructor.id,
            reason: error instanceof Error ? error.message : String(error),
          })
        }
      }
    })

    processed += instructors.length
    cursorId = instructors[instructors.length - 1]?.id

    console.log(
      JSON.stringify({
        progress: `${processed}/${totalInstructors}`,
        updatedNameKeys,
        upsertedAliases,
        failed,
      }),
    )
  }

  const withNameKey = await prisma.instructor.count({
    where: { nameKey: { not: null } },
  })
  const aliasCount = await prisma.instructorAlias.count()

  console.log(
    JSON.stringify(
      {
        instructorsScanned: processed,
        totalInstructors,
        withNameKey,
        aliasCount,
        updatedNameKeys,
        upsertedAliases,
        failed,
        sampleFailures,
      },
      null,
      2,
    ),
  )
}

main()
  .catch(async (error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
