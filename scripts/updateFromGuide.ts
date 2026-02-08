/**
 * Update existing courses with descriptions and credits from guide.wisc.edu
 * 
 * This script:
 * 1. Scrapes guide.wisc.edu for course descriptions, credits, names
 * 2. Updates existing courses that have empty/default descriptions
 * 3. Does NOT create new courses (use backfillFromMadgrades.ts for that)
 * 
 * Safety:
 * - Only UPDATES description, credits, name where currently empty/default
 * - Does NOT touch reviews, grade distributions, or other relations
 * - Dry-run by default (pass --commit to write)
 */

import { prisma } from '../lib/prisma'

const GUIDE_BASE = 'https://guide.wisc.edu/courses'
const RATE_LIMIT_MS = 300
const COMMIT = process.argv.includes('--commit')

function slugToSubjectCode(slug: string): string {
  return slug.replace(/_/g, ' ').toUpperCase().replace(/\s+/g, ' ').trim()
}

function toTitleCase(str: string): string {
  const smallWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'if', 'in', 'nor', 'of', 'on', 'or', 'so', 'the', 'to', 'up', 'vs', 'yet', 'with'])
  return str.toLowerCase().split(/\s+/).map((word, i) => {
    if (i === 0 || !smallWords.has(word)) return word.charAt(0).toUpperCase() + word.slice(1)
    return word
  }).join(' ')
}

function parseCredits(text: string): number | null {
  const match = text.match(/(\d+)(?:-(\d+))?\s*credits?/i)
  if (!match) return null
  return match[2] ? parseInt(match[2], 10) : parseInt(match[1], 10)
}

interface ParsedCourse {
  subjectCode: string
  courseNumber: string
  code: string
  name: string
  description: string
  credits: number | null
}

async function fetchSubjectCourses(slug: string): Promise<ParsedCourse[]> {
  const url = `${GUIDE_BASE}/${slug}/`
  const res = await fetch(url)
  if (!res.ok) return []
  const html = await res.text()
  const subjectCode = slugToSubjectCode(slug)
  const courses: ParsedCourse[] = []

  const courseBlockRegex = /<span class="courseblockcode">(.*?)<\/span>\s*[—–\-]\s*(.*?)<\/(?:strong|p)>/gi
  const creditsRegex = /<p class="courseblockcredits">(.*?)<\/p>/gi
  const descRegex = /<p class="courseblockdesc[^"]*">(.*?)<\/p>/gis

  interface RawMatch { subject: string; number: string; name: string; pos: number }
  const rawMatches: RawMatch[] = []

  let m: RegExpExecArray | null
  while ((m = courseBlockRegex.exec(html)) !== null) {
    const codeRaw = m[1].replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ').replace(/\u200B/g, '').replace(/<[^>]+>/g, '').trim()
    const nameRaw = m[2].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').trim()
    const codeMatch = codeRaw.match(/^([A-Z][A-Z &/-]+?)\s+(\d{3})$/)
    if (!codeMatch) continue
    const rawSubject = codeMatch[1].split('/')[0].trim().replace(/\s+/g, ' ')
    if (rawSubject !== subjectCode) continue
    rawMatches.push({ subject: rawSubject, number: codeMatch[2], name: nameRaw, pos: m.index })
  }

  for (const rm of rawMatches) {
    const code = `${rm.subject} ${rm.number}`
    creditsRegex.lastIndex = rm.pos
    const creditsMatch = creditsRegex.exec(html)
    let credits: number | null = null
    if (creditsMatch && creditsMatch.index < rm.pos + 2000) {
      credits = parseCredits(creditsMatch[1].replace(/<[^>]+>/g, ''))
    }

    let description = ''
    const descSearchStart = creditsMatch ? creditsMatch.index : rm.pos
    descRegex.lastIndex = descSearchStart
    const descMatch = descRegex.exec(html)
    if (descMatch && descMatch.index < rm.pos + 5000) {
      description = descMatch[1].replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&nbsp;/g, ' ').replace(/\u00a0/g, ' ').trim()
    }

    courses.push({ subjectCode: rm.subject, courseNumber: rm.number, code, name: toTitleCase(rm.name), description, credits })
  }

  return courses
}

async function getAllSubjectSlugs(): Promise<string[]> {
  const res = await fetch(`${GUIDE_BASE}/`)
  const html = await res.text()
  const slugs: string[] = []
  const regex = /href="\/courses\/([a-z_-]+)\/"/g
  let match
  while ((match = regex.exec(html)) !== null) slugs.push(match[1])
  return [...new Set(slugs)].sort()
}

async function main() {
  console.log(`\n📝 Course Description Updater ${COMMIT ? '(COMMIT)' : '(DRY RUN)'}\n`)

  // Load courses that need updating (empty or very short descriptions)
  console.log('📊 Loading courses needing description updates...')
  const courses = await prisma.course.findMany({
    where: { description: '' },
    select: { id: true, code: true, name: true, description: true, credits: true }
  })
  const courseMap = new Map(courses.map(c => [c.code, c]))
  console.log(`   Found ${courses.length} courses with empty descriptions`)

  // Also load all courses for credit/name updates
  const allCourses = await prisma.course.findMany({
    select: { id: true, code: true, name: true, description: true, credits: true }
  })
  const allCourseMap = new Map(allCourses.map(c => [c.code, c]))
  console.log(`   Total courses: ${allCourses.length}`)

  // Fetch guide data
  console.log('\n🌐 Fetching from guide.wisc.edu...')
  const slugs = await getAllSubjectSlugs()
  console.log(`   Found ${slugs.length} subjects`)

  let updatedDesc = 0
  let updatedCredits = 0
  let updatedName = 0
  let totalFromGuide = 0

  for (let i = 0; i < slugs.length; i++) {
    const slug = slugs[i]
    try {
      const guideCourses = await fetchSubjectCourses(slug)
      
      for (const gc of guideCourses) {
        totalFromGuide++
        const existing = allCourseMap.get(gc.code)
        if (!existing) continue

        const updates: any = {}

        // Update description if empty
        if ((!existing.description || existing.description === '') && gc.description) {
          updates.description = gc.description
          updatedDesc++
        }

        // Update credits if guide has a different value and ours is default (3)
        if (gc.credits && existing.credits === 3 && gc.credits !== 3) {
          updates.credits = gc.credits
          updatedCredits++
        }

        if (Object.keys(updates).length > 0 && COMMIT) {
          await prisma.course.update({
            where: { id: existing.id },
            data: updates
          })
        }
      }

      if ((i + 1) % 50 === 0) {
        console.log(`   ... processed ${i + 1}/${slugs.length} subjects`)
      }
    } catch (err: any) {
      console.error(`   ❌ ${slug}: ${err.message}`)
    }

    await new Promise(r => setTimeout(r, RATE_LIMIT_MS))
  }

  console.log('\n' + '='.repeat(60))
  console.log('📊 SUMMARY')
  console.log(`   Courses from guide.wisc.edu: ${totalFromGuide}`)
  console.log(`   Descriptions updated:        ${updatedDesc}`)
  console.log(`   Credits updated:             ${updatedCredits}`)
  console.log('='.repeat(60))

  if (!COMMIT) {
    console.log(`\n⚠️  DRY RUN — no changes made. Run with --commit to write.`)
  } else {
    console.log('\n✅ Done!')
  }

  await prisma.$disconnect()
}

main().catch(err => { console.error('Fatal:', err); process.exit(1) })
