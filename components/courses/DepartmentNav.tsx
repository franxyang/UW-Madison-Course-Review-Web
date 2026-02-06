'use client'

import { useState, useMemo } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface DepartmentNavProps {
  selectedDept: string | null
  onSelectDept: (deptCode: string | null) => void
}

// Map actual school names to display groups
const SCHOOL_TO_GROUP: Record<string, { group: string; emoji: string; priority: number }> = {
  'Letters & Science, College of': { group: 'Letters & Science', emoji: '📚', priority: 1 },
  'Computer, Data & Information Sciences, School of': { group: 'CDIS', emoji: '💻', priority: 2 },
  'Information School': { group: 'CDIS', emoji: '💻', priority: 2 },
  'Engineering, College of': { group: 'Engineering', emoji: '⚙️', priority: 3 },
  'Business, Wisconsin School of': { group: 'Business', emoji: '📊', priority: 4 },
  'Education, School of': { group: 'Education', emoji: '🎓', priority: 5 },
  'Medicine & Public Health, School of': { group: 'Health Sciences', emoji: '🏥', priority: 6 },
  'Nursing, School of': { group: 'Health Sciences', emoji: '🏥', priority: 6 },
  'Pharmacy, School of': { group: 'Health Sciences', emoji: '🏥', priority: 6 },
  'Public Health, School of': { group: 'Health Sciences', emoji: '🏥', priority: 6 },
  'Agricultural & Life Sciences, College of': { group: 'Ag & Life Sciences', emoji: '🌱', priority: 7 },
  'Law School': { group: 'Professional', emoji: '⚖️', priority: 8 },
  'Music, School of': { group: 'Arts', emoji: '🎵', priority: 9 },
  'Journalism & Mass Communication, School of': { group: 'Communication', emoji: '📰', priority: 10 },
  'Human Ecology, School of': { group: 'Human Ecology', emoji: '🏠', priority: 11 },
  'Social Work, School of': { group: 'Social Sciences', emoji: '🤝', priority: 12 },
  'Veterinary Medicine, School of': { group: 'Health Sciences', emoji: '🏥', priority: 6 },
  'Continuing Studies, School of': { group: 'Other', emoji: '🏛️', priority: 99 },
  'Graduate School': { group: 'Other', emoji: '🏛️', priority: 99 },
}

// Department code overrides - for departments that are misclassified by school
const DEPT_GROUP_OVERRIDE: Record<string, { group: string; emoji: string; priority: number }> = {
  'ACCT I S': { group: 'Business', emoji: '📊', priority: 4 },
  'FINANCE': { group: 'Business', emoji: '📊', priority: 4 },
  'MARKETNG': { group: 'Business', emoji: '📊', priority: 4 },
  'M H R': { group: 'Business', emoji: '📊', priority: 4 },
  'OTM': { group: 'Business', emoji: '📊', priority: 4 },
  'R M I': { group: 'Business', emoji: '📊', priority: 4 },
  'GEN BUS': { group: 'Business', emoji: '📊', priority: 4 },
}

// Featured departments to highlight
const FEATURED_DEPTS = new Set([
  'COMP SCI', 'MATH', 'STAT', 'ECON', 'PSYCH', 'CHEM', 'PHYSICS', 'BIOLOGY',
  'E C E', 'M E', 'INFO SYS', 'ACCT I S', 'ENGLISH', 'HISTORY', 'POLI SCI',
  'BIOCHEM', 'GENETICS', 'SOC', 'ANTHRO', 'PHILOS', 'ART', 'MUSIC'
])

export function DepartmentNav({ selectedDept, onSelectDept }: DepartmentNavProps) {
  const { data: schools, isLoading } = trpc.course.getDepartmentsBySchool.useQuery()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(
    new Set(['Letters & Science', 'CDIS', 'Engineering'])
  )

  // Group schools by display category
  const groupedData = useMemo(() => {
    if (!schools) return []

    const groups: Record<string, {
      emoji: string
      priority: number
      departments: Array<{ id: string; code: string; name: string; courseCount: number }>
    }> = {}

    schools.forEach(school => {
      school.departments.forEach(dept => {
        // Check for department-level override first
        const deptOverride = DEPT_GROUP_OVERRIDE[dept.code]
        const schoolMapping = SCHOOL_TO_GROUP[school.name]
        
        const groupName = deptOverride?.group || schoolMapping?.group || 'Other'
        const emoji = deptOverride?.emoji || schoolMapping?.emoji || '🏛️'
        const priority = deptOverride?.priority || schoolMapping?.priority || 99

        if (!groups[groupName]) {
          groups[groupName] = { emoji, priority, departments: [] }
        }

        groups[groupName].departments.push({
          id: dept.id,
          code: dept.code,
          name: dept.name,
          courseCount: dept._count.courses
        })
      })
    })

    // Sort departments within each group - featured first, then by code
    Object.values(groups).forEach(group => {
      group.departments.sort((a, b) => {
        const aFeatured = FEATURED_DEPTS.has(a.code)
        const bFeatured = FEATURED_DEPTS.has(b.code)
        if (aFeatured && !bFeatured) return -1
        if (!aFeatured && bFeatured) return 1
        return a.code.localeCompare(b.code)
      })
    })

    // Convert to sorted array
    return Object.entries(groups)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => a.priority - b.priority)
  }, [schools])

  const toggleGroup = (group: string) => {
    setExpandedGroups(prev => {
      const newSet = new Set(prev)
      if (newSet.has(group)) {
        newSet.delete(group)
      } else {
        newSet.add(group)
      }
      return newSet
    })
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-10 bg-surface-tertiary rounded-lg mb-2" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-2">
      {groupedData.map(({ name: groupName, emoji, departments }) => {
        if (departments.length === 0) return null

        const isExpanded = expandedGroups.has(groupName)

        return (
          <div 
            key={groupName} 
            className="bg-surface-primary rounded-xl border border-surface-tertiary overflow-hidden"
          >
            {/* Group Header */}
            <button
              onClick={() => toggleGroup(groupName)}
              className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-hover-bg transition-colors"
            >
              <span className="flex items-center gap-2 font-medium text-sm text-text-primary">
                <span>{emoji}</span>
                <span>{groupName}</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-text-tertiary bg-surface-secondary px-1.5 py-0.5 rounded">
                  {departments.length}
                </span>
                {isExpanded ? (
                  <ChevronDown size={14} className="text-text-tertiary" />
                ) : (
                  <ChevronRight size={14} className="text-text-tertiary" />
                )}
              </span>
            </button>

            {/* Department Grid */}
            {isExpanded && (
              <div className="px-2 pb-2">
                <div className="max-h-48 overflow-y-auto">
                  <div className="grid grid-cols-2 gap-1.5">
                    {departments.map(dept => (
                      <button
                        key={dept.id}
                        onClick={() => onSelectDept(dept.code)}
                        className={`px-2 py-2 text-xs font-medium rounded-lg transition-colors text-left truncate ${
                          selectedDept === dept.code
                            ? 'bg-wf-crimson text-white'
                            : 'bg-surface-secondary text-text-secondary hover:bg-wf-crimson/10 hover:text-wf-crimson'
                        }`}
                        title={`${dept.code}: ${dept.name} (${dept.courseCount} courses)`}
                      >
                        {dept.code}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
