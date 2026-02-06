'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

interface DepartmentNavProps {
  selectedDept: string | null
  onSelectDept: (deptCode: string | null) => void
}

// Group schools into categories
const SCHOOL_GROUPS: Record<string, { emoji: string; schools: string[] }> = {
  'Letters & Science': {
    emoji: '📚',
    schools: ['Letters and Science, College of']
  },
  'CDIS': {
    emoji: '💻',
    schools: ['Computer, Data and Information Sciences']
  },
  'Engineering': {
    emoji: '⚙️',
    schools: ['Engineering, College of']
  },
  'Business': {
    emoji: '📊',
    schools: ['Business, Wisconsin School of']
  },
  'Education': {
    emoji: '🎓',
    schools: ['Education, School of']
  },
  'Other': {
    emoji: '🏛️',
    schools: [] // Catch-all for unlisted schools
  }
}

// Featured departments to show first
const FEATURED_DEPTS = [
  'COMP SCI', 'MATH', 'STAT', 'ECON', 'PSYCH', 'CHEM', 'PHYSICS', 'BIOLOGY',
  'E C E', 'M E', 'INFO SYS', 'ACCT I S'
]

export function DepartmentNav({ selectedDept, onSelectDept }: DepartmentNavProps) {
  const { data: schools, isLoading } = trpc.course.getDepartmentsBySchool.useQuery()
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set(['Letters & Science', 'CDIS', 'Engineering']))

  const toggleGroup = (group: string) => {
    const newExpanded = new Set(expandedGroups)
    if (newExpanded.has(group)) {
      newExpanded.delete(group)
    } else {
      newExpanded.add(group)
    }
    setExpandedGroups(newExpanded)
  }

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map(i => (
          <div key={i} className="animate-pulse">
            <div className="h-6 bg-surface-tertiary rounded w-32 mb-2" />
            <div className="grid grid-cols-3 gap-1.5">
              {[1, 2, 3].map(j => (
                <div key={j} className="h-8 bg-surface-tertiary rounded" />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!schools) return null

  // Group departments by school category
  const groupedSchools: Record<string, typeof schools> = {}
  
  schools.forEach(school => {
    let assigned = false
    for (const [groupName, group] of Object.entries(SCHOOL_GROUPS)) {
      if (group.schools.some(s => school.name.includes(s) || s.includes(school.name))) {
        if (!groupedSchools[groupName]) groupedSchools[groupName] = []
        groupedSchools[groupName].push(school)
        assigned = true
        break
      }
    }
    if (!assigned) {
      if (!groupedSchools['Other']) groupedSchools['Other'] = []
      groupedSchools['Other'].push(school)
    }
  })

  return (
    <div className="space-y-4">
      {/* Back button when dept selected */}
      {selectedDept && (
        <button
          onClick={() => onSelectDept(null)}
          className="flex items-center gap-2 text-sm text-wf-crimson hover:text-wf-crimson-dark transition-colors mb-2"
        >
          ← All Departments
        </button>
      )}

      {Object.entries(SCHOOL_GROUPS).map(([groupName, { emoji }]) => {
        const schoolsInGroup = groupedSchools[groupName] || []
        if (schoolsInGroup.length === 0) return null

        const allDepts = schoolsInGroup.flatMap(s => s.departments)
        const isExpanded = expandedGroups.has(groupName)

        // Filter featured depts for this group
        const featuredInGroup = allDepts.filter(d => FEATURED_DEPTS.includes(d.code))
        const otherDepts = allDepts.filter(d => !FEATURED_DEPTS.includes(d.code))

        return (
          <div key={groupName} className="bg-surface-primary rounded-lg border border-surface-tertiary overflow-hidden">
            <button
              onClick={() => toggleGroup(groupName)}
              className="w-full flex items-center justify-between px-3 py-2 hover:bg-hover-bg transition-colors"
            >
              <span className="flex items-center gap-2 font-medium text-sm text-text-primary">
                <span>{emoji}</span>
                {groupName}
              </span>
              <span className="flex items-center gap-2">
                <span className="text-xs text-text-tertiary">{allDepts.length}</span>
                {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
              </span>
            </button>

            {isExpanded && (
              <div className="px-2 pb-2">
                <div className="grid grid-cols-3 gap-1">
                  {featuredInGroup.slice(0, 9).map(dept => (
                    <button
                      key={dept.id}
                      onClick={() => onSelectDept(dept.code)}
                      className={`px-2 py-1.5 text-xs font-medium rounded transition-colors truncate ${
                        selectedDept === dept.code
                          ? 'bg-wf-crimson text-white'
                          : 'bg-surface-secondary text-text-secondary hover:bg-hover-bg hover:text-text-primary'
                      }`}
                      title={dept.name}
                    >
                      {dept.code}
                    </button>
                  ))}
                </div>
                {allDepts.length > 9 && (
                  <div className="mt-1.5 text-xs text-text-tertiary text-center">
                    +{allDepts.length - Math.min(featuredInGroup.length, 9)} more
                  </div>
                )}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
