'use client'

import { SlidersHorizontal } from 'lucide-react'

export interface QuickFilterValues {
  levels?: string[]
  minCredits?: number
  maxCredits?: number
  minGPA?: number
  maxGPA?: number
  sortBy?: string
}

interface QuickFiltersProps {
  filters: QuickFilterValues
  onChange: (filters: QuickFilterValues) => void
}

export function QuickFilters({ filters, onChange }: QuickFiltersProps) {
  const LEVELS = [
    { value: 'Elementary', label: 'Elementary', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    { value: 'Intermediate', label: 'Intermediate', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    { value: 'Advanced', label: 'Advanced', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  ]

  const toggleLevel = (level: string) => {
    const current = filters.levels || []
    const updated = current.includes(level)
      ? current.filter(l => l !== level)
      : [...current, level]
    onChange({ ...filters, levels: updated.length > 0 ? updated : undefined })
  }

  const hasActiveFilters = (filters.levels?.length || 0) > 0 || 
    filters.minGPA !== undefined || 
    filters.maxGPA !== undefined

  const clearAll = () => {
    onChange({})
  }

  return (
    <div className="bg-surface-primary border border-surface-tertiary rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-sm text-text-primary flex items-center gap-2">
          <SlidersHorizontal size={14} />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-wf-crimson hover:text-wf-crimson-dark"
          >
            Clear all
          </button>
        )}
      </div>

      {/* Level */}
      <div className="mb-4">
        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
          Level
        </div>
        <div className="space-y-1.5">
          {LEVELS.map(level => {
            const isSelected = filters.levels?.includes(level.value)
            return (
              <button
                key={level.value}
                onClick={() => toggleLevel(level.value)}
                className={`w-full px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors text-left ${
                  isSelected ? level.color : 'border-surface-tertiary text-text-secondary hover:bg-hover-bg'
                }`}
              >
                {level.label}
              </button>
            )
          })}
        </div>
      </div>

      {/* Breadth (coming soon) */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            Breadth
          </div>
          <span className="text-[10px] uppercase tracking-wide text-wf-crimson font-semibold">
            Coming soon
          </span>
        </div>
        <select
          disabled
          className="w-full px-2 py-1.5 text-xs border border-surface-tertiary rounded-lg bg-surface-secondary text-text-tertiary cursor-not-allowed opacity-80"
        >
          <option>Official breadth data pending</option>
        </select>
      </div>

      {/* General Education (coming soon) */}
      <div className="mb-4">
        <div className="flex items-center justify-between mb-2">
          <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
            General Education
          </div>
          <span className="text-[10px] uppercase tracking-wide text-wf-crimson font-semibold">
            Coming soon
          </span>
        </div>
        <select
          disabled
          className="w-full px-2 py-1.5 text-xs border border-surface-tertiary rounded-lg bg-surface-secondary text-text-tertiary cursor-not-allowed opacity-80"
        >
          <option>Official gen ed data pending</option>
        </select>
      </div>

      {/* GPA Range */}
      <div className="mb-4">
        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
          GPA Range
        </div>
        <div className="flex items-center gap-2">
          <select
            value={filters.minGPA ?? ''}
            onChange={(e) => onChange({ 
              ...filters, 
              minGPA: e.target.value ? parseFloat(e.target.value) : undefined 
            })}
            className="flex-1 px-2 py-1.5 text-xs border border-surface-tertiary rounded-lg bg-surface-primary focus:outline-none focus:border-wf-crimson"
          >
            <option value="">Min</option>
            {[2.0, 2.5, 3.0, 3.2, 3.5].map(n => (
              <option key={n} value={n}>{n.toFixed(1)}</option>
            ))}
          </select>
          <span className="text-text-tertiary">–</span>
          <select
            value={filters.maxGPA ?? ''}
            onChange={(e) => onChange({ 
              ...filters, 
              maxGPA: e.target.value ? parseFloat(e.target.value) : undefined 
            })}
            className="flex-1 px-2 py-1.5 text-xs border border-surface-tertiary rounded-lg bg-surface-primary focus:outline-none focus:border-wf-crimson"
          >
            <option value="">Max</option>
            {[3.0, 3.2, 3.5, 3.7, 4.0].map(n => (
              <option key={n} value={n}>{n.toFixed(1)}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Sort */}
      <div>
        <div className="text-xs font-medium text-text-tertiary uppercase tracking-wider mb-2">
          Sort By
        </div>
        <select
          value={filters.sortBy || 'reviews'}
          onChange={(e) => onChange({ ...filters, sortBy: e.target.value })}
          className="w-full px-2 py-1.5 text-xs border border-surface-tertiary rounded-lg bg-surface-primary focus:outline-none focus:border-wf-crimson"
        >
          <option value="reviews">Most Reviews</option>
          <option value="gpa">Highest GPA</option>
          <option value="code">Course Code (A-Z)</option>
        </select>
      </div>

      <p className="mt-4 text-[11px] leading-relaxed text-text-tertiary">
        Breadth and General Education filters are disabled for now. We are backfilling official course designation data and will enable these filters after data coverage is complete.
      </p>
    </div>
  )
}
