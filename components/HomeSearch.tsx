'use client'

import { SearchWithPreview } from '@/components/SearchWithPreview'

export function HomeSearch() {
  return (
    <div className="max-w-xl mx-auto">
      <SearchWithPreview 
        placeholder="Search courses (CS 577, Calculus, Economics...)"
      />
    </div>
  )
}
