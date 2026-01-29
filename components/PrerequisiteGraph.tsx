'use client'

import React from 'react'
import { ArrowRight } from 'lucide-react'

interface Course {
  id: string
  code: string
  name: string
}

interface PrerequisiteGraphProps {
  currentCourse: Course
  prerequisites: Course[]
  prerequisiteFor: Course[]
}

export const PrerequisiteGraph: React.FC<PrerequisiteGraphProps> = ({
  currentCourse,
  prerequisites,
  prerequisiteFor
}) => {
  return (
    <div className="flex items-center justify-center py-8">
      <div className="flex items-center gap-8">
        {/* Prerequisites */}
        {prerequisites.length > 0 && (
          <div className="space-y-2">
            {prerequisites.map(prereq => (
              <div
                key={prereq.id}
                className="px-4 py-2 bg-slate-100 rounded-lg text-sm"
              >
                {prereq.code}
              </div>
            ))}
          </div>
        )}

        {prerequisites.length > 0 && <ArrowRight className="text-slate-400" />}

        {/* Current Course */}
        <div className="px-6 py-3 bg-uw-red text-white rounded-lg font-medium">
          {currentCourse.code}
        </div>

        {prerequisiteFor.length > 0 && <ArrowRight className="text-slate-400" />}

        {/* Unlocks */}
        {prerequisiteFor.length > 0 && (
          <div className="space-y-2">
            {prerequisiteFor.map(next => (
              <div
                key={next.id}
                className="px-4 py-2 bg-slate-100 rounded-lg text-sm"
              >
                {next.code}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}