import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { prisma } from '../lib/prisma'
import { createMadgradesClient, toMadgradesCourseCode, type MadgradesCourse } from './utils/madgradesApi'

type CourseSnapshot = {
  id: string
  code: string
  name: string
  gdCount: number
  reviewCount: number
  aliasCount: number
}

type CanonicalSelection = {
  canonicalCourseId: string | null
  canonicalCode: string | null
}

type CsvRecord = Record<string, string | number | boolean | null | undefined>

const OUTPUT_DIR = resolve(process.cwd(), 'scripts/reports')
const PAGE_LOG_INTERVAL = 20

function parseArgs() {
  const args = process.argv.slice(2)
  let outputDir = OUTPUT_DIR

  for (const arg of args) {
    if (arg.startsWith('--output-dir=')) {
      outputDir = resolve(process.cwd(), arg.split('=')[1])
    }
  }

  return { outputDir }
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

async function writeCsv(filePath: string, rows: CsvRecord[], columns: string[]) {
  const header = columns.join(',')
  const lines = rows.map((row) => columns.map((column) => csvEscape(row[column])).join(','))
  await writeFile(filePath, `${header}\n${lines.join('\n')}\n`, 'utf8')
}

function pickBestCourse(candidates: CourseSnapshot[], sourceOrder: Map<string, number>): CourseSnapshot | null {
  if (candidates.length === 0) return null

  const sorted = [...candidates].sort((a, b) => {
    const aHasGd = a.gdCount > 0 ? 1 : 0
    const bHasGd = b.gdCount > 0 ? 1 : 0
    if (aHasGd !== bHasGd) return bHasGd - aHasGd
    if (a.gdCount !== b.gdCount) return b.gdCount - a.gdCount
    if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount

    const aOrder = sourceOrder.get(a.code) ?? Number.MAX_SAFE_INTEGER
    const bOrder = sourceOrder.get(b.code) ?? Number.MAX_SAFE_INTEGER
    if (aOrder !== bOrder) return aOrder - bOrder

    return a.code.localeCompare(b.code)
  })

  return sorted[0]
}

function chooseCanonicalCourse(
  sourceCodes: string[],
  courseByCode: Map<string, CourseSnapshot>,
  courseById: Map<string, CourseSnapshot>,
  aliasCanonicalBySourceCode: Map<string, string>,
): CanonicalSelection {
  const sourceOrder = new Map(sourceCodes.map((code, index) => [code, index]))

  const candidates = sourceCodes
    .map((code) => courseByCode.get(code))
    .filter((course): course is CourseSnapshot => Boolean(course))

  const aliasedCanonicalCourses = sourceCodes
    .map((code) => aliasCanonicalBySourceCode.get(code))
    .filter((courseId): courseId is string => Boolean(courseId))
    .map((courseId) => courseById.get(courseId))
    .filter((course): course is CourseSnapshot => Boolean(course))

  const canonicalFromAlias = pickBestCourse(aliasedCanonicalCourses, sourceOrder)
  if (canonicalFromAlias) {
    return {
      canonicalCourseId: canonicalFromAlias.id,
      canonicalCode: canonicalFromAlias.code,
    }
  }

  const canonicalFromCandidates = pickBestCourse(candidates, sourceOrder)
  if (canonicalFromCandidates) {
    return {
      canonicalCourseId: canonicalFromCandidates.id,
      canonicalCode: canonicalFromCandidates.code,
    }
  }

  return {
    canonicalCourseId: null,
    canonicalCode: null,
  }
}

function sourceCodesForCourse(course: MadgradesCourse): string[] {
  const unique = new Set<string>()
  for (const subject of course.subjects ?? []) {
    unique.add(toMadgradesCourseCode(subject.abbreviation, course.number))
  }
  return [...unique]
}

async function main() {
  const { outputDir } = parseArgs()

  console.log('🔎 Auditing Madgrades coverage (API -> DB)...\n')

  const [dbCourses, dbAliases] = await Promise.all([
    prisma.course.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        _count: {
          select: {
            gradeDistributions: true,
            reviews: true,
            codeAliases: true,
          },
        },
      },
    }),
    prisma.courseCodeAlias.findMany({
      select: {
        sourceCode: true,
        canonicalCourseId: true,
      },
    }),
  ])

  const courseByCode = new Map<string, CourseSnapshot>()
  const courseById = new Map<string, CourseSnapshot>()

  for (const course of dbCourses) {
    const snapshot: CourseSnapshot = {
      id: course.id,
      code: course.code,
      name: course.name,
      gdCount: course._count.gradeDistributions,
      reviewCount: course._count.reviews,
      aliasCount: course._count.codeAliases,
    }
    courseByCode.set(snapshot.code, snapshot)
    courseById.set(snapshot.id, snapshot)
  }

  const aliasCanonicalBySourceCode = new Map(
    dbAliases.map((alias) => [alias.sourceCode, alias.canonicalCourseId]),
  )

  const client = createMadgradesClient()
  const madgradesCourses = await client.fetchAllCourses(({ page, totalPages }) => {
    if (page % PAGE_LOG_INTERVAL === 0 || page === totalPages) {
      console.log(`   fetched API page ${page}/${totalPages}`)
    }
  })

  const missingRows: CsvRecord[] = []
  const presentNoGdRows: CsvRecord[] = []
  const partialCrosslistRows: CsvRecord[] = []
  const coverageRows: CsvRecord[] = []

  let directMissing = 0
  let directNoGd = 0
  let directHasGd = 0
  let crossListCourseCount = 0
  let effectiveHasGdCourseCount = 0

  for (const mgCourse of madgradesCourses) {
    const sourceCodes = sourceCodesForCourse(mgCourse)
    if (sourceCodes.length === 0) continue

    const canonical = chooseCanonicalCourse(
      sourceCodes,
      courseByCode,
      courseById,
      aliasCanonicalBySourceCode,
    )

    const canonicalCourse = canonical.canonicalCourseId
      ? courseById.get(canonical.canonicalCourseId) ?? null
      : null

    const states = sourceCodes.map((sourceCode) => {
      const dbCourse = courseByCode.get(sourceCode)
      if (!dbCourse) {
        directMissing += 1
        return {
          sourceCode,
          directState: 'missing' as const,
          gdCount: 0,
          reviewCount: 0,
        }
      }

      if (dbCourse.gdCount > 0) {
        directHasGd += 1
        return {
          sourceCode,
          directState: 'has_gd' as const,
          gdCount: dbCourse.gdCount,
          reviewCount: dbCourse.reviewCount,
        }
      }

      directNoGd += 1
      return {
        sourceCode,
        directState: 'no_gd' as const,
        gdCount: 0,
        reviewCount: dbCourse.reviewCount,
      }
    })

    const sourceCodesLabel = sourceCodes.join(' | ')
    const dbGdRowsByCode = states.map((entry) => `${entry.sourceCode}:${entry.gdCount}`).join(' | ')

    coverageRows.push({
      sourceCourseUuid: mgCourse.uuid,
      sourceCodes: sourceCodesLabel,
      canonicalCourseId: canonical.canonicalCourseId,
      canonicalCode: canonical.canonicalCode,
      dbGdRowsByCode,
      directHasGdCount: states.filter((entry) => entry.directState === 'has_gd').length,
      directNoGdCount: states.filter((entry) => entry.directState === 'no_gd').length,
      directMissingCount: states.filter((entry) => entry.directState === 'missing').length,
      effectiveHasGd: canonicalCourse ? canonicalCourse.gdCount > 0 : false,
    })
    if (canonicalCourse && canonicalCourse.gdCount > 0) {
      effectiveHasGdCourseCount += 1
    }

    for (const entry of states) {
      if (entry.directState === 'missing') {
        missingRows.push({
          sourceCourseUuid: mgCourse.uuid,
          sourceCode: entry.sourceCode,
          sourceSubjects: (mgCourse.subjects ?? []).map((subject) => subject.abbreviation).join(' | '),
          courseName: mgCourse.name,
          canonicalCourseId: canonical.canonicalCourseId,
          canonicalCode: canonical.canonicalCode,
        })
      }

      if (entry.directState === 'no_gd') {
        presentNoGdRows.push({
          sourceCourseUuid: mgCourse.uuid,
          sourceCode: entry.sourceCode,
          sourceSubjects: (mgCourse.subjects ?? []).map((subject) => subject.abbreviation).join(' | '),
          courseName: mgCourse.name,
          canonicalCourseId: canonical.canonicalCourseId,
          canonicalCode: canonical.canonicalCode,
          canonicalHasGd: canonicalCourse ? canonicalCourse.gdCount > 0 : false,
          sourceCodeReviewCount: entry.reviewCount,
        })
      }
    }

    if (sourceCodes.length > 1) {
      crossListCourseCount += 1
      const hasGdCodes = states.filter((entry) => entry.directState === 'has_gd').map((entry) => entry.sourceCode)
      const noDataCodes = states
        .filter((entry) => entry.directState !== 'has_gd')
        .map((entry) => `${entry.sourceCode}(${entry.directState})`)

      if (hasGdCodes.length > 0 && noDataCodes.length > 0) {
        partialCrosslistRows.push({
          sourceCourseUuid: mgCourse.uuid,
          courseName: mgCourse.name,
          sourceCodes: sourceCodesLabel,
          codesWithGpa: hasGdCodes.join(' | '),
          codesWithoutGpaOrMissing: noDataCodes.join(' | '),
          canonicalCourseId: canonical.canonicalCourseId,
          canonicalCode: canonical.canonicalCode,
          canonicalHasGd: canonicalCourse ? canonicalCourse.gdCount > 0 : false,
        })
      }
    }
  }

  await mkdir(outputDir, { recursive: true })

  await Promise.all([
    writeCsv(resolve(outputDir, 'missing_code_in_db.csv'), missingRows, [
      'sourceCourseUuid',
      'sourceCode',
      'sourceSubjects',
      'courseName',
      'canonicalCourseId',
      'canonicalCode',
    ]),
    writeCsv(resolve(outputDir, 'present_but_no_gd.csv'), presentNoGdRows, [
      'sourceCourseUuid',
      'sourceCode',
      'sourceSubjects',
      'courseName',
      'canonicalCourseId',
      'canonicalCode',
      'canonicalHasGd',
      'sourceCodeReviewCount',
    ]),
    writeCsv(resolve(outputDir, 'partial_crosslist_coverage.csv'), partialCrosslistRows, [
      'sourceCourseUuid',
      'courseName',
      'sourceCodes',
      'codesWithGpa',
      'codesWithoutGpaOrMissing',
      'canonicalCourseId',
      'canonicalCode',
      'canonicalHasGd',
    ]),
    writeCsv(resolve(outputDir, 'coverage_report.csv'), coverageRows, [
      'sourceCourseUuid',
      'sourceCodes',
      'canonicalCourseId',
      'canonicalCode',
      'dbGdRowsByCode',
      'directHasGdCount',
      'directNoGdCount',
      'directMissingCount',
      'effectiveHasGd',
    ]),
  ])

  console.log('\n✅ Audit complete')
  console.log(`   Madgrades courses: ${madgradesCourses.length}`)
  console.log(`   Direct code states -> has_gd: ${directHasGd}, no_gd: ${directNoGd}, missing: ${directMissing}`)
  const directTotal = directHasGd + directNoGd + directMissing
  const directCoverage = directTotal > 0 ? (directHasGd / directTotal) * 100 : 0
  const effectiveCoverage =
    madgradesCourses.length > 0 ? (effectiveHasGdCourseCount / madgradesCourses.length) * 100 : 0
  const partialCrossListRatio =
    crossListCourseCount > 0 ? (partialCrosslistRows.length / crossListCourseCount) * 100 : 0
  console.log(
    `   Direct coverage (by source code): ${directHasGd}/${directTotal} (${directCoverage.toFixed(2)}%)`,
  )
  console.log(
    `   Effective coverage (by canonical mapping): ${effectiveHasGdCourseCount}/${madgradesCourses.length} (${effectiveCoverage.toFixed(2)}%)`,
  )
  console.log(
    `   Partial cross-list ratio: ${partialCrosslistRows.length}/${crossListCourseCount} (${partialCrossListRatio.toFixed(2)}%)`,
  )
  console.log(`   Missing codes report: ${resolve(outputDir, 'missing_code_in_db.csv')}`)
  console.log(`   Present-no-GD report: ${resolve(outputDir, 'present_but_no_gd.csv')}`)
  console.log(`   Partial cross-list report: ${resolve(outputDir, 'partial_crosslist_coverage.csv')}`)
  console.log(`   Full coverage report: ${resolve(outputDir, 'coverage_report.csv')}`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
