'use client'

import { useState } from 'react'
import { ChevronDown, ChevronRight, X, SlidersHorizontal } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'

export interface CourseFilters {
  schools?: string[]
  departments?: string[]
  levels?: string[]
  minCredits?: number
  maxCredits?: number
  sortBy?: string
}

interface FilterPanelProps {
  filters: CourseFilters
  onFilterChange: (filters: CourseFilters) => void
}

function FilterSection({ 
  title, 
  children, 
  defaultOpen = false 
}: { 
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen)
  
  return (
    <div className="border-b border-slate-200 pb-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full py-2 text-sm font-semibold text-slate-900 hover:text-uw-red transition-colors"
      >
        {title}
        {isOpen ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
      </button>
      {isOpen && <div className="mt-2 space-y-1">{children}</div>}
    </div>
  )
}

export function FilterPanel({ filters, onFilterChange }: FilterPanelProps) {
  const { data: schools } = trpc.course.getSchools.useQuery()
  const { data: departments } = trpc.course.getDepartments.useQuery()
  const [showAllSchools, setShowAllSchools] = useState(false)
  const [showAllDepts, setShowAllDepts] = useState(false)
  const [deptSearch, setDeptSearch] = useState('')

  const activeFilterCount: number = [
    filters.schools?.length ?? 0,
    filters.departments?.length ?? 0,
    filters.levels?.length ?? 0,
    filters.minCredits !== undefined ? 1 : 0,
    filters.maxCredits !== undefined ? 1 : 0,
  ].reduce((sum: number, v: number) => sum + v, 0)

  const toggleArrayFilter = (key: 'schools' | 'departments' | 'levels', value: string) => {
    const current = filters[key] || []
    const updated = current.includes(value)
      ? current.filter(v => v !== value)
      : [...current, value]
    onFilterChange({ ...filters, [key]: updated.length > 0 ? updated : undefined })
  }

  const clearAll = () => {
    onFilterChange({})
  }

  const LEVELS = [
    { value: 'Elementary', label: 'Elementary (100-200)', color: 'bg-green-100 text-green-700' },
    { value: 'Intermediate', label: 'Intermediate (300-400)', color: 'bg-blue-100 text-blue-700' },
    { value: 'Advanced', label: 'Advanced (500+)', color: 'bg-purple-100 text-purple-700' },
  ]

  const filteredDepts = departments?.filter(d => 
    deptSearch === '' || 
    d.code.toLowerCase().includes(deptSearch.toLowerCase()) ||
    d.name.toLowerCase().includes(deptSearch.toLowerCase())
  ) || []

  const displayedSchools = showAllSchools ? schools : schools?.slice(0, 8)
  const displayedDepts = showAllDepts ? filteredDepts : filteredDepts.slice(0, 10)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-4 sticky top-24">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={18} className="text-slate-700" />
          <h3 className="font-semibold text-slate-900">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-uw-red text-white rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-slate-500 hover:text-uw-red transition-colors"
          >
            Clear all
          </button>
        )}
      </div>

      <div className="space-y-2">
        {/* School Filter */}
        <FilterSection title="🏫 School" defaultOpen>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {displayedSchools?.map(school => (
              <label key={school.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.schools?.includes(school.id) || false}
                  onChange={() => toggleArrayFilter('schools', school.id)}
                  className="rounded border-slate-300 text-uw-red focus:ring-uw-red"
                />
                <span className="text-sm text-slate-700 truncate">
                  {school.name.replace(', College of', '').replace(', School of', '').replace(', Wisconsin School of', '')}
                </span>
              </label>
            ))}
          </div>
          {schools && schools.length > 8 && (
            <button
              onClick={() => setShowAllSchools(!showAllSchools)}
              className="text-xs text-uw-red hover:text-uw-dark mt-1"
            >
              {showAllSchools ? 'Show less' : `Show all ${schools.length}`}
            </button>
          )}
        </FilterSection>

        {/* Department Filter */}
        <FilterSection title="📚 Department">
          <input
            type="text"
            value={deptSearch}
            onChange={(e) => setDeptSearch(e.target.value)}
            placeholder="Search departments..."
            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded mb-2 focus:outline-none focus:ring-1 focus:ring-uw-red/30"
          />
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {displayedDepts.map(dept => (
              <label key={dept.id} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.departments?.includes(dept.id) || false}
                  onChange={() => toggleArrayFilter('departments', dept.id)}
                  className="rounded border-slate-300 text-uw-red focus:ring-uw-red"
                />
                <span className="text-sm text-slate-700">{dept.code}</span>
              </label>
            ))}
          </div>
          {filteredDepts.length > 10 && (
            <button
              onClick={() => setShowAllDepts(!showAllDepts)}
              className="text-xs text-uw-red hover:text-uw-dark mt-1"
            >
              {showAllDepts ? 'Show less' : `Show all ${filteredDepts.length}`}
            </button>
          )}
        </FilterSection>

        {/* Level Filter */}
        <FilterSection title="📊 Course Level" defaultOpen>
          <div className="space-y-1">
            {LEVELS.map(level => (
              <label key={level.value} className="flex items-center gap-2 px-1 py-1 rounded hover:bg-slate-50 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.levels?.includes(level.value) || false}
                  onChange={() => toggleArrayFilter('levels', level.value)}
                  className="rounded border-slate-300 text-uw-red focus:ring-uw-red"
                />
                <span className={`text-xs px-2 py-0.5 rounded-full ${level.color}`}>
                  {level.label}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>

        {/* Credits Filter */}
        <FilterSection title="💳 Credits">
          <div className="flex items-center gap-2">
            <select
              value={filters.minCredits ?? ''}
              onChange={(e) => onFilterChange({ 
                ...filters, 
                minCredits: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-uw-red/30"
            >
              <option value="">Min</option>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
            <span className="text-slate-400">–</span>
            <select
              value={filters.maxCredits ?? ''}
              onChange={(e) => onFilterChange({ 
                ...filters, 
                maxCredits: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              className="flex-1 px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-uw-red/30"
            >
              <option value="">Max</option>
              {[1, 2, 3, 4, 5, 6].map(n => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </div>
        </FilterSection>

        {/* Sort By */}
        <FilterSection title="📋 Sort By" defaultOpen>
          <select
            value={filters.sortBy || 'code'}
            onChange={(e) => onFilterChange({ ...filters, sortBy: e.target.value })}
            className="w-full px-2 py-1.5 text-sm border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-uw-red/30"
          >
            <option value="code">Course Code (A-Z)</option>
            <option value="relevance">Relevance</option>
            <option value="gpa">Highest GPA</option>
            <option value="reviews">Most Reviews</option>
          </select>
        </FilterSection>
      </div>

      {/* Active Filters Summary */}
      {activeFilterCount > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-200">
          <div className="flex flex-wrap gap-1.5">
            {filters.schools?.map(id => {
              const school = schools?.find(s => s.id === id)
              return school ? (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full">
                  {school.name.split(',')[0]}
                  <button onClick={() => toggleArrayFilter('schools', id)}>
                    <X size={12} />
                  </button>
                </span>
              ) : null
            })}
            {filters.departments?.map(id => {
              const dept = departments?.find(d => d.id === id)
              return dept ? (
                <span key={id} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full">
                  {dept.code}
                  <button onClick={() => toggleArrayFilter('departments', id)}>
                    <X size={12} />
                  </button>
                </span>
              ) : null
            })}
            {filters.levels?.map(level => (
              <span key={level} className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-slate-100 text-slate-700 rounded-full">
                {level}
                <button onClick={() => toggleArrayFilter('levels', level)}>
                  <X size={12} />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
