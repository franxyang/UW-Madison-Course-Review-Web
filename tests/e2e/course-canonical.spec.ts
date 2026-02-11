import { test, expect } from '@playwright/test'
import { PrismaClient } from '@prisma/client'

type Fixture = {
  alias349Id: string
  canonical349Id: string
  alias350Id: string
  canonical350Id: string
  solo310Id: string
}

const prisma = new PrismaClient()
let fixture: Fixture

const FIXTURE = {
  schoolName: 'E2E Test School',
  group349Uuid: 'e2e-crosslist-group-349',
  group350Uuid: 'e2e-crosslist-group-350',
  alias349Code: 'E2EALPHA 349',
  canonical349Code: 'E2EBETA 349',
  alias350Code: 'E2EGAMMA 350',
  canonical350Code: 'E2EDELTA 350',
  solo310Code: 'E2ESOLO 310',
}

async function ensureSchool() {
  return prisma.school.upsert({
    where: { name: FIXTURE.schoolName },
    create: { name: FIXTURE.schoolName },
    update: {},
    select: { id: true },
  })
}

async function ensureCourse(
  code: string,
  schoolId: string,
  options?: { name?: string; level?: string; credits?: number; description?: string },
) {
  return prisma.course.upsert({
    where: { code },
    create: {
      code,
      name: options?.name ?? `E2E ${code}`,
      description: options?.description ?? 'E2E fixture course',
      credits: options?.credits ?? 3,
      level: options?.level ?? 'Intermediate',
      schoolId,
      avgGPA: null,
      avgRating: null,
      lastOffered: null,
      prerequisiteText: null,
      breadths: null,
      genEds: null,
    },
    update: {
      name: options?.name ?? `E2E ${code}`,
      description: options?.description ?? 'E2E fixture course',
      credits: options?.credits ?? 3,
      level: options?.level ?? 'Intermediate',
      schoolId,
    },
    select: { id: true, code: true },
  })
}

async function ensureAlias(sourceCode: string, canonicalCourseId: string, sourceCourseUuid: string) {
  await prisma.courseCodeAlias.upsert({
    where: { sourceCode },
    create: {
      sourceCode,
      canonicalCourseId,
      sourceCourseUuid,
      sourceSubjectCode: sourceCode.split(' ')[0],
      sourceSubjectAbbr: sourceCode.split(' ')[0],
      source: 'playwright-e2e',
      lastSeenAt: new Date(),
    },
    update: {
      canonicalCourseId,
      sourceCourseUuid,
      sourceSubjectCode: sourceCode.split(' ')[0],
      sourceSubjectAbbr: sourceCode.split(' ')[0],
      source: 'playwright-e2e',
      lastSeenAt: new Date(),
    },
  })
}

async function buildFixture(): Promise<Fixture> {
  const school = await ensureSchool()

  const [alias349, canonical349, alias350, canonical350, solo310] = await Promise.all([
    ensureCourse(FIXTURE.alias349Code, school.id, { name: 'E2E Alias 349', level: 'Intermediate' }),
    ensureCourse(FIXTURE.canonical349Code, school.id, { name: 'E2E Canonical 349', level: 'Intermediate' }),
    ensureCourse(FIXTURE.alias350Code, school.id, { name: 'E2E Alias 350', level: 'Intermediate' }),
    ensureCourse(FIXTURE.canonical350Code, school.id, { name: 'E2E Canonical 350', level: 'Intermediate' }),
    ensureCourse(FIXTURE.solo310Code, school.id, { name: 'E2E Solo 310', level: 'Intermediate' }),
  ])

  const [group349, group350] = await Promise.all([
    prisma.crossListGroup.upsert({
      where: { sourceCourseUuid: FIXTURE.group349Uuid },
      create: { sourceCourseUuid: FIXTURE.group349Uuid, displayCode: `${FIXTURE.canonical349Code} / ${FIXTURE.alias349Code}` },
      update: { displayCode: `${FIXTURE.canonical349Code} / ${FIXTURE.alias349Code}` },
      select: { id: true },
    }),
    prisma.crossListGroup.upsert({
      where: { sourceCourseUuid: FIXTURE.group350Uuid },
      create: { sourceCourseUuid: FIXTURE.group350Uuid, displayCode: `${FIXTURE.canonical350Code} / ${FIXTURE.alias350Code}` },
      update: { displayCode: `${FIXTURE.canonical350Code} / ${FIXTURE.alias350Code}` },
      select: { id: true },
    }),
  ])

  await Promise.all([
    prisma.course.update({ where: { id: alias349.id }, data: { crossListGroupId: group349.id } }),
    prisma.course.update({ where: { id: canonical349.id }, data: { crossListGroupId: group349.id } }),
    prisma.course.update({ where: { id: alias350.id }, data: { crossListGroupId: group350.id } }),
    prisma.course.update({ where: { id: canonical350.id }, data: { crossListGroupId: group350.id } }),
    prisma.course.update({ where: { id: solo310.id }, data: { crossListGroupId: null } }),
  ])

  await Promise.all([
    ensureAlias(FIXTURE.alias349Code, canonical349.id, FIXTURE.group349Uuid),
    ensureAlias(FIXTURE.canonical349Code, canonical349.id, FIXTURE.group349Uuid),
    ensureAlias(FIXTURE.alias350Code, canonical350.id, FIXTURE.group350Uuid),
    ensureAlias(FIXTURE.canonical350Code, canonical350.id, FIXTURE.group350Uuid),
    ensureAlias(FIXTURE.solo310Code, solo310.id, 'e2e-crosslist-group-solo-310'),
  ])

  return {
    alias349Id: alias349.id,
    canonical349Id: canonical349.id,
    alias350Id: alias350.id,
    canonical350Id: canonical350.id,
    solo310Id: solo310.id,
  }
}

test.describe('course canonical routing and title rendering', () => {
  test.beforeAll(async () => {
    fixture = await buildFixture()
  })

  test.afterAll(async () => {
    await prisma.$disconnect()
  })

  test('349 alias redirects to canonical and renders aggregated title', async ({ page }) => {
    await page.goto(`/courses/${fixture.alias349Id}`)
    await expect(page).toHaveURL(new RegExp(`/courses/${fixture.canonical349Id}$`))

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('349')
    await expect(h1).toContainText('E2EALPHA')
    await expect(h1).toContainText('E2EBETA')

    const headingText = (await h1.textContent()) ?? ''
    expect(headingText).toContain('/')
  })

  test('350 alias redirects to canonical and renders aggregated title', async ({ page }) => {
    await page.goto(`/courses/${fixture.alias350Id}`)
    await expect(page).toHaveURL(new RegExp(`/courses/${fixture.canonical350Id}$`))

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText('350')
    await expect(h1).toContainText('E2EGAMMA')
    await expect(h1).toContainText('E2EDELTA')

    const headingText = (await h1.textContent()) ?? ''
    expect(headingText).toContain('/')
  })

  test('non-crosslist course does not redirect and keeps single-code title', async ({ page }) => {
    await page.goto(`/courses/${fixture.solo310Id}`)
    await expect(page).toHaveURL(new RegExp(`/courses/${fixture.solo310Id}$`))

    const h1 = page.getByRole('heading', { level: 1 })
    await expect(h1).toBeVisible()
    await expect(h1).toContainText(FIXTURE.solo310Code)

    const headingText = (await h1.textContent()) ?? ''
    expect(headingText).not.toContain('/')
  })
})
