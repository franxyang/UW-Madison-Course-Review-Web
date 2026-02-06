'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Search, X, Loader2, BookOpen, Star } from 'lucide-react'
import { trpc } from '@/lib/trpc/client'
import { toOfficialCode } from '@/lib/courseCodeDisplay'
import { useDebounce } from '@/lib/hooks/useDebounce'

interface SearchWithPreviewProps {
  initialQuery?: string
  onSearch?: (query: string) => void
  placeholder?: string
}

export function SearchWithPreview({ 
  initialQuery = '', 
  onSearch,
  placeholder = 'Search by course code (CS 577, MATH 521) or name...'
}: SearchWithPreviewProps) {
  const router = useRouter()
  const [query, setQuery] = useState(initialQuery)
  const [isOpen, setIsOpen] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Debounce search query
  const debouncedQuery = useDebounce(query, 300)

  // Fetch preview results
  const { data, isLoading } = trpc.course.list.useQuery(
    { search: debouncedQuery, limit: 6 },
    { 
      enabled: debouncedQuery.length >= 2,
      staleTime: 30000, // Cache for 30s
    }
  )

  const previewCourses = data?.courses || []
  const totalResults = data?.total || 0

  // Show dropdown when focused and has results or is loading
  useEffect(() => {
    setIsOpen(isFocused && debouncedQuery.length >= 2)
  }, [isFocused, debouncedQuery])

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
        setIsFocused(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    } else if (e.key === 'Enter') {
      handleSearch()
    }
  }

  const handleSearch = () => {
    setIsOpen(false)
    if (onSearch) {
      onSearch(query)
    } else {
      const params = new URLSearchParams()
      if (query) params.set('search', query)
      router.push(`/courses?${params.toString()}`)
    }
  }

  const clearSearch = () => {
    setQuery('')
    inputRef.current?.focus()
  }

  const getGPAColor = (gpa: number) => {
    if (gpa >= 3.5) return 'text-emerald-500'
    if (gpa >= 3.0) return 'text-emerald-400'
    if (gpa >= 2.5) return 'text-amber-500'
    if (gpa >= 2.0) return 'text-orange-500'
    return 'text-red-500'
  }

  return (
    <div ref={containerRef} className="relative flex-1">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-tertiary" size={20} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="w-full pl-10 pr-10 py-2.5 bg-surface-primary border border-surface-tertiary rounded-lg focus:outline-none focus:ring-2 focus:ring-focus-ring focus:border-wf-crimson transition-colors"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Preview Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-surface-primary border border-surface-tertiary rounded-xl shadow-lg z-50 overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="animate-spin text-text-tertiary" size={24} />
            </div>
          ) : previewCourses.length > 0 ? (
            <>
              {/* Results List */}
              <div className="py-2">
                {previewCourses.map((course) => (
                  <Link
                    key={course.id}
                    href={`/courses/${course.id}`}
                    onClick={() => setIsOpen(false)}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-hover-bg transition-colors"
                  >
                    <div className="w-10 h-10 bg-surface-secondary rounded-lg flex items-center justify-center flex-shrink-0">
                      <BookOpen size={18} className="text-text-tertiary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-wf-crimson">
                          {toOfficialCode(course.code)}
                        </span>
                        <span className="text-xs text-text-tertiary">
                          {course.credits} cr
                        </span>
                      </div>
                      <div className="text-sm text-text-secondary truncate">
                        {course.name}
                      </div>
                    </div>
                    {course.avgGPA != null && course.avgGPA > 0 && (
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star size={14} className={getGPAColor(course.avgGPA)} />
                        <span className={`text-sm font-semibold ${getGPAColor(course.avgGPA)}`}>
                          {course.avgGPA.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </Link>
                ))}
              </div>

              {/* View All Results */}
              {totalResults > previewCourses.length && (
                <div className="border-t border-surface-tertiary">
                  <button
                    onClick={handleSearch}
                    className="w-full px-4 py-3 text-sm font-medium text-wf-crimson hover:bg-hover-bg transition-colors text-center"
                  >
                    View all {totalResults} results →
                  </button>
                </div>
              )}
            </>
          ) : debouncedQuery.length >= 2 ? (
            <div className="py-8 text-center">
              <BookOpen className="mx-auto h-10 w-10 text-text-tertiary mb-2" />
              <p className="text-sm text-text-secondary">No courses found for &quot;{debouncedQuery}&quot;</p>
            </div>
          ) : null}
        </div>
      )}
    </div>
  )
}
