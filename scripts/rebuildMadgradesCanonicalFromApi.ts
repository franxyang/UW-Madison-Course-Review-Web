import { randomUUID } from 'node:crypto'
import { mkdirSync, writeFileSync } from 'node:fs'
import path from 'node:path'

import { prisma } from '../lib/prisma'
import { inferCourseLevelFromCode } from '../lib/courseLevel'
import {
  createMadgradesClient,
  termCodeToString,
  toMadgradesCourseCode,
  type MadgradesCourse,
} from './utils/madgradesApi'

type SourceCodeInfo = {
  sourceCode: string
  sourceSubjectCode: string
  sourceSubjectAbbr: string
}

type CourseSnapshot = {
  id: string
  code: string
  name: string
  gdCount: number
  reviewCount: number
  schoolId: string
}

type CourseCreatePlan = {
  sourceCode: string
  sourceCourseUuid: string
  sourceSubjectAbbr: string
  sourceSubjectCode: string
  courseName: string
  schoolId: string
  schoolName: string
  departmentId: string | null
  departmentCode: string | null
  reason: string
}

type GradeAgg = {
  aCount: number
  abCount: number
  bCount: number
  bcCount: number
  cCount: number
  dCount: number
  fCount: number
  totalGraded: number
  instructorName: string | null
}

type RebuildRecord = {
  id: string
  courseId: string
  term: string
  instructorId: string | null
  aCount: number
  abCount: number
  bCount: number
  bcCount: number
  cCount: number
  dCount: number
  fCount: number
  totalGraded: number
  avgGPA: number
}

type UnresolvedRow = {
  sourceCourseUuid: string
  sourceCode: string
  sourceSubjectAbbr: string
  courseName: string
  reason: string
  resolvedSchoolName: string
}

const COMMIT = process.argv.includes('--commit')
const SKIP_GRADE_REBUILD = process.argv.includes('--skip-grade-rebuild')
const DEFAULT_OUTPUT_DIR = path.join(process.cwd(), 'scripts/reports')
const DEFAULT_UNRESOLVED_REPORT = 'madgrades_rebuild_unresolved.csv'
const FETCH_LOG_INTERVAL = 30
const GRADE_FETCH_LOG_INTERVAL = 100

const SUBJECT_DEPT_OVERRIDES: Record<string, string> = {
  COMPSCI: 'COMP SCI',
  CS: 'COMP SCI',
  ISYE: 'I SY E',
  MHR: 'M H R',
  POLISCI: 'POLI SCI',
  LIS: 'L I S',
  CEE: 'CIV ENGR',
  CBE: 'CIV ENGR',
  CHEMENGR: 'CIV ENGR',
}

function getArg(flag: string): string | null {
  const index = process.argv.indexOf(flag)
  if (index === -1) return null
  return process.argv[index + 1] ?? null
}

function parseArgs() {
  const outputDirArg = getArg('--output-dir')
  const unresolvedArg = getArg('--unresolved-report')
  const limitArg = getArg('--limit-courses')

  const outputDir = outputDirArg ? path.resolve(process.cwd(), outputDirArg) : DEFAULT_OUTPUT_DIR
  const unresolvedReportPath = unresolvedArg
    ? path.resolve(process.cwd(), unresolvedArg)
    : path.join(outputDir, DEFAULT_UNRESOLVED_REPORT)

  const limitCourses = limitArg ? Number.parseInt(limitArg, 10) : null

  if (limitArg && (!Number.isFinite(limitCourses) || (limitCourses ?? 0) <= 0)) {
    throw new Error('--limit-courses must be a positive integer')
  }

  return {
    outputDir,
    unresolvedReportPath,
    limitCourses,
  }
}

function normalizeCode(code: string): string {
  return code.replace(/\s+/g, ' ').trim().toUpperCase()
}

function normalizeLooseKey(value: string): string {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, '')
}

function computeAvgGPA(grades: {
  aCount: number
  abCount: number
  bCount: number
  bcCount: number
  cCount: number
  dCount: number
  fCount: number
  totalGraded: number
}): number {
  if (grades.totalGraded <= 0) return 0

  const weighted =
    grades.aCount * 4.0 +
    grades.abCount * 3.5 +
    grades.bCount * 3.0 +
    grades.bcCount * 2.5 +
    grades.cCount * 2.0 +
    grades.dCount * 1.0

  return Math.round((weighted / grades.totalGraded) * 100) / 100
}

function csvEscape(value: unknown): string {
  if (value === null || value === undefined) return ''
  const text = String(value)
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`
  }
  return text
}

function writeUnresolvedReport(filepath: string, rows: UnresolvedRow[]) {
  mkdirSync(path.dirname(filepath), { recursive: true })
  const columns = [
    'sourceCourseUuid',
    'sourceCode',
    'sourceSubjectAbbr',
    'courseName',
    'reason',
    'resolvedSchoolName',
  ]
  const header = columns.join(',')
  const lines = rows.map((row) => columns.map((column) => csvEscape(row[column as keyof UnresolvedRow])).join(','))
  writeFileSync(filepath, `${header}\n${lines.join('\n')}\n`, 'utf8')
}

function sqlString(value: string): string {
  return `'${value.replace(/'/g, "''")}'`
}

function sqlNullableString(value: string | null): string {
  return value === null ? 'NULL' : sqlString(value)
}

async function ensureStagingTable() {
  await prisma.$executeRawUnsafe(`
    CREATE TABLE IF NOT EXISTS "GradeDistribution_staging_rebuild" (
      "id" TEXT PRIMARY KEY,
      "courseId" TEXT NOT NULL,
      "term" TEXT NOT NULL,
      "aCount" INTEGER NOT NULL DEFAULT 0,
      "abCount" INTEGER NOT NULL DEFAULT 0,
      "bCount" INTEGER NOT NULL DEFAULT 0,
      "bcCount" INTEGER NOT NULL DEFAULT 0,
      "cCount" INTEGER NOT NULL DEFAULT 0,
      "dCount" INTEGER NOT NULL DEFAULT 0,
      "fCount" INTEGER NOT NULL DEFAULT 0,
      "totalGraded" INTEGER NOT NULL,
      "avgGPA" DOUBLE PRECISION NOT NULL,
      "instructorId" TEXT NULL,
      CONSTRAINT "GradeDistribution_staging_total_positive" CHECK ("totalGraded" > 0),
      CONSTRAINT "GradeDistribution_staging_grade_sum_matches_total" CHECK (
        "aCount" + "abCount" + "bCount" + "bcCount" + "cCount" + "dCount" + "fCount" = "totalGraded"
      )
    )
  `)

  await prisma.$executeRawUnsafe('TRUNCATE TABLE "GradeDistribution_staging_rebuild"')
}

async function batchInsertStaging(records: RebuildRecord[], batchSize = 500) {
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize)
    const values = batch
      .map((row) => {
        return `(
          ${sqlString(row.id)},
          ${sqlString(row.courseId)},
          ${sqlString(row.term)},
          ${row.aCount},
          ${row.abCount},
          ${row.bCount},
          ${row.bcCount},
          ${row.cCount},
          ${row.dCount},
          ${row.fCount},
          ${row.totalGraded},
          ${row.avgGPA},
          ${sqlNullableString(row.instructorId)}
        )`
      })
      .join(',')

    await prisma.$executeRawUnsafe(`
      INSERT INTO "GradeDistribution_staging_rebuild" (
        "id", "courseId", "term", "aCount", "abCount", "bCount", "bcCount", "cCount", "dCount", "fCount", "totalGraded", "avgGPA", "instructorId"
      ) VALUES ${values}
    `)

    if ((i + batchSize) % 5000 < batchSize || i + batchSize >= records.length) {
      console.log(`   inserted staging rows: ${Math.min(i + batchSize, records.length)}/${records.length}`)
    }
  }
}

function pickCanonicalCourse(candidates: CourseSnapshot[]): CourseSnapshot | null {
  if (candidates.length === 0) return null

  return [...candidates].sort((a, b) => {
    const aHasGd = a.gdCount > 0 ? 1 : 0
    const bHasGd = b.gdCount > 0 ? 1 : 0
    if (aHasGd !== bHasGd) return bHasGd - aHasGd
    if (a.gdCount !== b.gdCount) return b.gdCount - a.gdCount
    if (a.reviewCount !== b.reviewCount) return b.reviewCount - a.reviewCount
    return a.code.localeCompare(b.code)
  })[0]
}

async function main() {
  const { outputDir, unresolvedReportPath, limitCourses } = parseArgs()

  console.log(`\n🔄 Madgrades canonical rebuild from API ${COMMIT ? '(COMMIT MODE)' : '(DRY RUN)'}\n`)
  console.log(`output dir: ${outputDir}`)
  console.log(`unresolved report: ${unresolvedReportPath}`)
  console.log(`skip grade rebuild: ${SKIP_GRADE_REBUILD ? 'yes' : 'no'}`)
  if (limitCourses) {
    console.log(`course fetch limit: ${limitCourses}`)
  }

  const client = createMadgradesClient()

  const allMadgradesCourses = await client.fetchAllCourses(({ page, totalPages }) => {
    if (page % FETCH_LOG_INTERVAL === 0 || page === totalPages) {
      console.log(`   fetched course index page ${page}/${totalPages}`)
    }
  })

  const madgradesCourses = limitCourses ? allMadgradesCourses.slice(0, limitCourses) : allMadgradesCourses

  console.log(`\n📚 Madgrades courses loaded: ${madgradesCourses.length}`)

  const [dbCourses, dbAliases, dbInstructors, dbDepartments, dbSchools] = await Promise.all([
    prisma.course.findMany({
      select: {
        id: true,
        code: true,
        name: true,
        schoolId: true,
        _count: {
          select: {
            gradeDistributions: true,
            reviews: true,
          },
        },
      },
    }),
    prisma.courseCodeAlias.findMany({
      select: {
        sourceCode: true,
        canonicalCourseId: true,
        sourceCourseUuid: true,
      },
    }),
    prisma.instructor.findMany({
      select: {
        id: true,
        name: true,
      },
    }),
    prisma.department.findMany({
      select: {
        id: true,
        code: true,
        schoolId: true,
      },
    }),
    prisma.school.findMany({
      select: {
        id: true,
        name: true,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  let gdBackupTable: string | null = null
  let aliasBackupTable: string | null = null
  if (COMMIT) {
    const backupSuffix = `${new Date().toISOString().slice(0, 10).replace(/-/g, '')}_${Date.now()}`
    gdBackupTable = `GradeDistribution_backup_${backupSuffix}`
    aliasBackupTable = `CourseCodeAlias_backup_${backupSuffix}`

    await prisma.$executeRawUnsafe(`CREATE TABLE "${gdBackupTable}" AS TABLE "GradeDistribution"`)
    await prisma.$executeRawUnsafe(`CREATE TABLE "${aliasBackupTable}" AS TABLE "CourseCodeAlias"`)

    console.log(`\\n💾 backup tables created before mutations:`)
    console.log(`   ${gdBackupTable}`)
    console.log(`   ${aliasBackupTable}`)
  }

  const schoolById = new Map(dbSchools.map((school) => [school.id, school.name]))
  const defaultSchool =
    dbSchools.find((school) => school.name.toLowerCase().includes('letters & science')) ?? dbSchools[0]

  if (!defaultSchool) {
    throw new Error('No school rows found. Cannot auto-create missing courses.')
  }

  const departmentByExactCode = new Map<string, { id: string; code: string; schoolId: string }>()
  const departmentByLooseKey = new Map<string, { id: string; code: string; schoolId: string }>()
  for (const department of dbDepartments) {
    const exact = normalizeCode(department.code)
    departmentByExactCode.set(exact, department)
    departmentByLooseKey.set(normalizeLooseKey(exact), department)
  }

  function resolveDepartment(subjectAbbr: string) {
    const exact = normalizeCode(subjectAbbr)
    const loose = normalizeLooseKey(exact)

    const exactHit = departmentByExactCode.get(exact)
    if (exactHit) return exactHit

    const override = SUBJECT_DEPT_OVERRIDES[loose]
    if (override) {
      const overrideHit = departmentByExactCode.get(normalizeCode(override))
      if (overrideHit) return overrideHit
    }

    return departmentByLooseKey.get(loose) ?? null
  }

  const courseByCode = new Map<string, CourseSnapshot>()
  const courseById = new Map<string, CourseSnapshot>()
  for (const course of dbCourses) {
    const snapshot: CourseSnapshot = {
      id: course.id,
      code: normalizeCode(course.code),
      name: course.name,
      gdCount: course._count.gradeDistributions,
      reviewCount: course._count.reviews,
      schoolId: course.schoolId,
    }
    courseByCode.set(snapshot.code, snapshot)
    courseById.set(snapshot.id, snapshot)
  }

  const aliasBySourceCode = new Map<string, { canonicalCourseId: string; sourceCourseUuid: string | null }>()
  for (const alias of dbAliases) {
    aliasBySourceCode.set(normalizeCode(alias.sourceCode), {
      canonicalCourseId: alias.canonicalCourseId,
      sourceCourseUuid: alias.sourceCourseUuid,
    })
  }

  const sourceCodesByUuid = new Map<string, SourceCodeInfo[]>()
  for (const course of madgradesCourses) {
    const list: SourceCodeInfo[] = []
    const seen = new Set<string>()
    for (const subject of course.subjects ?? []) {
      const sourceCode = normalizeCode(toMadgradesCourseCode(subject.abbreviation, course.number))
      if (seen.has(sourceCode)) continue
      seen.add(sourceCode)
      list.push({
        sourceCode,
        sourceSubjectCode: String(subject.code),
        sourceSubjectAbbr: normalizeCode(subject.abbreviation),
      })
    }
    sourceCodesByUuid.set(course.uuid, list)
  }

  const unresolvedRows: UnresolvedRow[] = []
  const missingCoursePlans = new Map<string, CourseCreatePlan>()

  for (const course of madgradesCourses) {
    const sourceList = sourceCodesByUuid.get(course.uuid) ?? []
    for (const source of sourceList) {
      if (courseByCode.has(source.sourceCode) || missingCoursePlans.has(source.sourceCode)) {
        continue
      }

      const department = resolveDepartment(source.sourceSubjectAbbr)
      const schoolId = department?.schoolId ?? defaultSchool.id
      const schoolName = schoolById.get(schoolId) ?? defaultSchool.name

      const plan: CourseCreatePlan = {
        sourceCode: source.sourceCode,
        sourceCourseUuid: course.uuid,
        sourceSubjectAbbr: source.sourceSubjectAbbr,
        sourceSubjectCode: source.sourceSubjectCode,
        courseName: course.name?.trim() || 'Untitled Course',
        schoolId,
        schoolName,
        departmentId: department?.id ?? null,
        departmentCode: department?.code ?? null,
        reason: department
          ? 'resolved-department'
          : 'department-mapping-missing-fallback-to-default-school',
      }

      missingCoursePlans.set(source.sourceCode, plan)

      if (!department) {
        unresolvedRows.push({
          sourceCourseUuid: course.uuid,
          sourceCode: source.sourceCode,
          sourceSubjectAbbr: source.sourceSubjectAbbr,
          courseName: plan.courseName,
          reason: plan.reason,
          resolvedSchoolName: schoolName,
        })
      }
    }
  }

  console.log(`\n🧩 Missing source codes to auto-create: ${missingCoursePlans.size}`)

  if (COMMIT && missingCoursePlans.size > 0) {
    const createData = [...missingCoursePlans.values()].map((plan) => ({
      code: plan.sourceCode,
      name: plan.courseName,
      description: 'Imported from Madgrades',
      credits: 0,
      level: inferCourseLevelFromCode(plan.sourceCode) ?? 'Elementary',
      schoolId: plan.schoolId,
      avgGPA: null,
      avgRating: null,
      lastOffered: null,
      breadths: null,
      genEds: null,
      prerequisiteText: null,
    }))

    const BATCH = 1000
    for (let i = 0; i < createData.length; i += BATCH) {
      await prisma.course.createMany({
        data: createData.slice(i, i + BATCH),
        skipDuplicates: true,
      })
    }

    const createdCourses = await prisma.course.findMany({
      where: { code: { in: [...missingCoursePlans.keys()] } },
      select: {
        id: true,
        code: true,
        name: true,
        schoolId: true,
        _count: {
          select: {
            gradeDistributions: true,
            reviews: true,
          },
        },
      },
    })

    for (const created of createdCourses) {
      const snapshot: CourseSnapshot = {
        id: created.id,
        code: normalizeCode(created.code),
        name: created.name,
        gdCount: created._count.gradeDistributions,
        reviewCount: created._count.reviews,
        schoolId: created.schoolId,
      }
      courseByCode.set(snapshot.code, snapshot)
      courseById.set(snapshot.id, snapshot)
    }

    const departmentLinks = [...missingCoursePlans.values()]
      .filter((plan) => Boolean(plan.departmentId))
      .map((plan) => {
        const course = courseByCode.get(plan.sourceCode)
        if (!course || !plan.departmentId) return null
        return {
          courseId: course.id,
          departmentId: plan.departmentId,
        }
      })
      .filter((row): row is { courseId: string; departmentId: string } => Boolean(row))

    for (let i = 0; i < departmentLinks.length; i += BATCH) {
      await prisma.courseDepartment.createMany({
        data: departmentLinks.slice(i, i + BATCH),
        skipDuplicates: true,
      })
    }

    console.log(`   created courses: ${createdCourses.length}`)
    console.log(`   created course-department links: ${departmentLinks.length}`)
  } else if (!COMMIT && missingCoursePlans.size > 0) {
    for (const plan of missingCoursePlans.values()) {
      const dryRunId = `__DRYRUN__${plan.sourceCode}`
      const snapshot: CourseSnapshot = {
        id: dryRunId,
        code: plan.sourceCode,
        name: plan.courseName,
        gdCount: 0,
        reviewCount: 0,
        schoolId: plan.schoolId,
      }
      courseByCode.set(snapshot.code, snapshot)
      courseById.set(snapshot.id, snapshot)
    }
  }

  const canonicalByUuid = new Map<string, { canonicalCourseId: string; canonicalCode: string }>()
  const aliasUpserts: Array<{
    sourceCode: string
    canonicalCourseId: string
    sourceCourseUuid: string
    sourceSubjectCode: string
    sourceSubjectAbbr: string
  }> = []

  for (const course of madgradesCourses) {
    const sourceList = sourceCodesByUuid.get(course.uuid) ?? []

    const candidatesById = new Map<string, CourseSnapshot>()
    for (const source of sourceList) {
      const mapped = courseByCode.get(source.sourceCode)
      if (mapped) candidatesById.set(mapped.id, mapped)

      const existingAlias = aliasBySourceCode.get(source.sourceCode)
      if (existingAlias) {
        const canonical = courseById.get(existingAlias.canonicalCourseId)
        if (canonical) candidatesById.set(canonical.id, canonical)
      }
    }

    const canonical = pickCanonicalCourse([...candidatesById.values()])
    if (!canonical) {
      for (const source of sourceList) {
        unresolvedRows.push({
          sourceCourseUuid: course.uuid,
          sourceCode: source.sourceCode,
          sourceSubjectAbbr: source.sourceSubjectAbbr,
          courseName: course.name?.trim() || 'Untitled Course',
          reason: 'cannot-resolve-canonical-course-id',
          resolvedSchoolName: defaultSchool.name,
        })
      }
      continue
    }

    canonicalByUuid.set(course.uuid, {
      canonicalCourseId: canonical.id,
      canonicalCode: canonical.code,
    })

    for (const source of sourceList) {
      aliasUpserts.push({
        sourceCode: source.sourceCode,
        canonicalCourseId: canonical.id,
        sourceCourseUuid: course.uuid,
        sourceSubjectCode: source.sourceSubjectCode,
        sourceSubjectAbbr: source.sourceSubjectAbbr,
      })
    }
  }

  console.log(`\n🧭 Canonical UUID mappings: ${canonicalByUuid.size}`)

  if (COMMIT) {
    const now = new Date()
    for (const alias of aliasUpserts) {
      await prisma.courseCodeAlias.upsert({
        where: { sourceCode: alias.sourceCode },
        create: {
          sourceCode: alias.sourceCode,
          canonicalCourseId: alias.canonicalCourseId,
          sourceCourseUuid: alias.sourceCourseUuid,
          sourceSubjectCode: alias.sourceSubjectCode,
          sourceSubjectAbbr: alias.sourceSubjectAbbr,
          lastSeenAt: now,
          source: 'madgrades-api-rebuild',
        },
        update: {
          canonicalCourseId: alias.canonicalCourseId,
          sourceCourseUuid: alias.sourceCourseUuid,
          sourceSubjectCode: alias.sourceSubjectCode,
          sourceSubjectAbbr: alias.sourceSubjectAbbr,
          lastSeenAt: now,
          source: 'madgrades-api-rebuild',
        },
      })
    }

    let groupUpserts = 0
    let groupAssignments = 0

    for (const course of madgradesCourses) {
      const sourceList = sourceCodesByUuid.get(course.uuid) ?? []
      const courseIds = [
        ...new Set(
          sourceList
            .map((source) => courseByCode.get(source.sourceCode)?.id)
            .filter((id): id is string => Boolean(id)),
        ),
      ]

      if (courseIds.length < 2) continue

      const codesForDisplay = sourceList.map((source) => source.sourceCode).sort((a, b) => a.localeCompare(b))
      const displayCode = codesForDisplay.join(' / ')

      const group = await prisma.crossListGroup.upsert({
        where: { sourceCourseUuid: course.uuid },
        create: {
          sourceCourseUuid: course.uuid,
          displayCode,
        },
        update: {
          displayCode,
        },
      })

      await prisma.course.updateMany({
        where: { id: { in: courseIds } },
        data: { crossListGroupId: group.id },
      })

      groupUpserts += 1
      groupAssignments += courseIds.length
    }

    console.log(`   upserted alias rows: ${aliasUpserts.length}`)
    console.log(`   upserted cross-list groups: ${groupUpserts}`)
    console.log(`   course-group assignments: ${groupAssignments}`)
  }

  if (SKIP_GRADE_REBUILD) {
    writeUnresolvedReport(unresolvedReportPath, unresolvedRows)
    console.log(`📝 unresolved report rows: ${unresolvedRows.length}`)
    console.log(`📝 unresolved report: ${unresolvedReportPath}`)

    if (!COMMIT) {
      console.log('\n⚠️  Dry run complete (alias/group only). No DB writes executed.')
      await prisma.$disconnect()
      return
    }

    const [aliasCount, groupCount] = await Promise.all([
      prisma.courseCodeAlias.count(),
      prisma.crossListGroup.count(),
    ])

    console.log('\n✅ Commit complete (alias/group only)')
    console.log(`   course aliases: ${aliasCount}`)
    console.log(`   cross-list groups: ${groupCount}`)
    console.log(`   unresolved rows: ${unresolvedRows.length}`)
    await prisma.$disconnect()
    return
  }

  const instructorByNormalizedName = new Map<string, { id: string; name: string }>()
  for (const instructor of dbInstructors) {
    instructorByNormalizedName.set(normalizeCode(instructor.name), instructor)
  }

  const gradeAggByKey = new Map<string, GradeAgg>()
  const missingInstructorDisplayNames = new Map<string, string>()

  let fetchedGradePayloads = 0
  let gradeFetchErrors = 0
  let processedSections = 0

  for (let index = 0; index < madgradesCourses.length; index++) {
    const course = madgradesCourses[index]
    const canonical = canonicalByUuid.get(course.uuid)
    if (!canonical) continue

    try {
      const grades = await client.fetchCourseGrades(course.uuid)
      fetchedGradePayloads += 1

      for (const offering of grades.courseOfferings ?? []) {
        const term = termCodeToString(offering.termCode)
        for (const section of offering.sections ?? []) {
          const aCount = section.aCount ?? 0
          const abCount = section.abCount ?? 0
          const bCount = section.bCount ?? 0
          const bcCount = section.bcCount ?? 0
          const cCount = section.cCount ?? 0
          const dCount = section.dCount ?? 0
          const fCount = section.fCount ?? 0
          const computedTotal = aCount + abCount + bCount + bcCount + cCount + dCount + fCount
          const total = section.total ?? computedTotal

          if (total <= 0) continue

          const instructorRaw = section.instructors?.[0]?.name?.trim() || null
          const instructorKey = instructorRaw ? normalizeCode(instructorRaw) : '__NONE__'

          const aggKey = `${canonical.canonicalCourseId}|${term}|${instructorKey}`
          const existing = gradeAggByKey.get(aggKey) ?? {
            aCount: 0,
            abCount: 0,
            bCount: 0,
            bcCount: 0,
            cCount: 0,
            dCount: 0,
            fCount: 0,
            totalGraded: 0,
            instructorName: instructorRaw,
          }

          existing.aCount += aCount
          existing.abCount += abCount
          existing.bCount += bCount
          existing.bcCount += bcCount
          existing.cCount += cCount
          existing.dCount += dCount
          existing.fCount += fCount
          existing.totalGraded += total
          if (!existing.instructorName && instructorRaw) {
            existing.instructorName = instructorRaw
          }

          gradeAggByKey.set(aggKey, existing)

          if (instructorRaw && !instructorByNormalizedName.has(instructorKey)) {
            missingInstructorDisplayNames.set(instructorKey, instructorRaw)
          }

          processedSections += 1
        }
      }
    } catch (error) {
      gradeFetchErrors += 1
      console.warn(`⚠️  failed to fetch grades for course uuid=${course.uuid}:`, error)
    }

    if ((index + 1) % GRADE_FETCH_LOG_INTERVAL === 0 || index + 1 === madgradesCourses.length) {
      console.log(`   fetched course grades: ${index + 1}/${madgradesCourses.length}`)
    }
  }

  console.log('\n📊 Grade aggregation summary:')
  console.log(`   fetched grade payloads: ${fetchedGradePayloads}`)
  console.log(`   grade fetch errors: ${gradeFetchErrors}`)
  console.log(`   processed sections: ${processedSections}`)
  console.log(`   aggregated records: ${gradeAggByKey.size}`)
  console.log(`   missing instructors: ${missingInstructorDisplayNames.size}`)

  if (COMMIT && missingInstructorDisplayNames.size > 0) {
    const data = [...missingInstructorDisplayNames.values()].map((name) => ({ name }))
    const BATCH = 1000

    for (let i = 0; i < data.length; i += BATCH) {
      await prisma.instructor.createMany({
        data: data.slice(i, i + BATCH),
        skipDuplicates: true,
      })
    }

    const refreshed = await prisma.instructor.findMany({
      select: { id: true, name: true },
    })

    instructorByNormalizedName.clear()
    for (const instructor of refreshed) {
      instructorByNormalizedName.set(normalizeCode(instructor.name), instructor)
    }
  }

  const rebuildRecords: RebuildRecord[] = []

  for (const [key, value] of gradeAggByKey) {
    const [courseId, term, instructorKey] = key.split('|')

    let instructorId: string | null = null
    if (instructorKey !== '__NONE__') {
      const mapped = instructorByNormalizedName.get(instructorKey)
      if (!mapped) {
        if (COMMIT) {
          throw new Error(`Instructor mapping missing after creation refresh: ${instructorKey}`)
        }
        instructorId = `__DRYRUN__${instructorKey}`
      } else {
        instructorId = mapped.id
      }
    }

    if (value.totalGraded <= 0) continue

    rebuildRecords.push({
      id: randomUUID(),
      courseId,
      term,
      instructorId,
      aCount: value.aCount,
      abCount: value.abCount,
      bCount: value.bCount,
      bcCount: value.bcCount,
      cCount: value.cCount,
      dCount: value.dCount,
      fCount: value.fCount,
      totalGraded: value.totalGraded,
      avgGPA: computeAvgGPA(value),
    })
  }

  console.log(`\n🧱 Rebuild records prepared: ${rebuildRecords.length}`)

  writeUnresolvedReport(unresolvedReportPath, unresolvedRows)
  console.log(`📝 unresolved report rows: ${unresolvedRows.length}`)
  console.log(`📝 unresolved report: ${unresolvedReportPath}`)

  if (!COMMIT) {
    console.log('\n⚠️  Dry run complete. No DB writes executed.')
    await prisma.$disconnect()
    return
  }

  await ensureStagingTable()
  await batchInsertStaging(rebuildRecords)

  await prisma.$transaction(
    async (tx) => {
      await tx.$executeRawUnsafe('TRUNCATE TABLE "GradeDistribution"')

      await tx.$executeRawUnsafe(`
        INSERT INTO "GradeDistribution" (
          "id", "courseId", "term", "aCount", "abCount", "bCount", "bcCount", "cCount", "dCount", "fCount", "totalGraded", "avgGPA", "instructorId"
        )
        SELECT
          "id", "courseId", "term", "aCount", "abCount", "bCount", "bcCount", "cCount", "dCount", "fCount", "totalGraded", "avgGPA", "instructorId"
        FROM "GradeDistribution_staging_rebuild"
      `)

      await tx.$executeRawUnsafe('TRUNCATE TABLE "CourseInstructor"')
      await tx.$executeRawUnsafe(`
        INSERT INTO "CourseInstructor" ("courseId", "instructorId")
        SELECT DISTINCT "courseId", "instructorId"
        FROM "GradeDistribution"
        WHERE "instructorId" IS NOT NULL
      `)

      await tx.$executeRawUnsafe('UPDATE "Course" SET "avgGPA" = NULL')
      await tx.$executeRawUnsafe(`
        WITH agg AS (
          SELECT
            "courseId",
            SUM("avgGPA" * "totalGraded") / NULLIF(SUM("totalGraded"), 0) AS weighted_gpa
          FROM "GradeDistribution"
          GROUP BY "courseId"
          HAVING SUM("totalGraded") > 0
        )
        UPDATE "Course" c
        SET "avgGPA" = ROUND(agg.weighted_gpa::numeric, 2)::double precision
        FROM agg
        WHERE c.id = agg."courseId"
      `)
    },
    {
      maxWait: 30_000,
      timeout: 600_000,
    },
  )

  const [gdCount, aliasCount] = await Promise.all([
    prisma.gradeDistribution.count(),
    prisma.courseCodeAlias.count(),
  ])

  console.log('\n✅ Commit complete')
  console.log(`   grade distributions: ${gdCount}`)
  console.log(`   course aliases: ${aliasCount}`)
  console.log(`   unresolved rows: ${unresolvedRows.length}`)
}

main()
  .catch((error) => {
    console.error('\n❌ rebuild failed:', error)
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
