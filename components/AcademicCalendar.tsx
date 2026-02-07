'use client'

import { useState } from 'react'
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react'

// Key academic dates for UW-Madison (simplified - you can expand this)
// Spring 2026 dates from UW-Madison Registrar
// https://registrar.wisc.edu/academic-calendar/
const ACADEMIC_EVENTS: Record<string, { date: number; label: string; color: string }[]> = {
  '2026-01': [
    { date: 21, label: 'Spring Classes Begin', color: 'bg-emerald-400' },
    { date: 28, label: 'Drop w/o Transcript Notation', color: 'bg-amber-400' },
    { date: 30, label: 'Add/Wait List Deadline', color: 'bg-red-400' }
  ],
  '2026-02': [
    { date: 13, label: 'Edit Class Deadline', color: 'bg-amber-400' }
  ],
  '2026-03': [
    { date: 21, label: 'Spring Break Begins', color: 'bg-blue-400' },
    { date: 29, label: 'Spring Break Ends', color: 'bg-blue-400' }
  ],
  '2026-04': [
    { date: 20, label: 'P/F, Audit & Drop Deadline', color: 'bg-red-400' }
  ],
  '2026-05': [
    { date: 6, label: 'Last Day of Classes', color: 'bg-orange-400' },
    { date: 8, label: 'Finals Begin', color: 'bg-red-400' },
    { date: 15, label: 'Finals End', color: 'bg-red-400' },
    { date: 17, label: 'Commencement', color: 'bg-wf-crimson' }
  ],
  '2026-09': [
    { date: 2, label: 'Fall Classes Begin', color: 'bg-emerald-400' }
  ],
  '2026-11': [
    { date: 26, label: 'Thanksgiving Break', color: 'bg-orange-400' }
  ],
  '2026-12': [
    { date: 16, label: 'Last Day of Classes', color: 'bg-orange-400' },
    { date: 18, label: 'Finals Begin', color: 'bg-red-400' }
  ]
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 
                     'July', 'August', 'September', 'October', 'November', 'December']
const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

export function AcademicCalendar() {
  const today = new Date()
  const [currentMonth, setCurrentMonth] = useState(today.getMonth())
  const [currentYear, setCurrentYear] = useState(today.getFullYear())
  
  const daysInMonth = getDaysInMonth(currentYear, currentMonth)
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth)
  
  const monthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`
  const eventsThisMonth = ACADEMIC_EVENTS[monthKey] || []
  
  const goToPrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11)
      setCurrentYear(currentYear - 1)
    } else {
      setCurrentMonth(currentMonth - 1)
    }
  }
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0)
      setCurrentYear(currentYear + 1)
    } else {
      setCurrentMonth(currentMonth + 1)
    }
  }
  
  const isToday = (day: number) => {
    return today.getDate() === day && 
           today.getMonth() === currentMonth && 
           today.getFullYear() === currentYear
  }
  
  const getEventForDay = (day: number) => {
    return eventsThisMonth.find(e => e.date === day)
  }
  
  // Build calendar grid
  const calendarDays: (number | null)[] = []
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null)
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i)
  }
  
  return (
    <div className="bg-surface-primary rounded-xl border border-surface-tertiary overflow-hidden">
      {/* Header with navigation - softer design */}
      <div className="px-4 py-3 border-b border-surface-tertiary bg-surface-secondary">
        <div className="flex items-center justify-between">
          <button 
            onClick={goToPrevMonth}
            className="p-1 hover:bg-hover-bg rounded transition-colors text-text-secondary"
            aria-label="Previous month"
          >
            <ChevronLeft size={16} />
          </button>
          <div className="flex items-center gap-2">
            <Calendar size={16} className="text-wf-crimson" />
            <span className="font-semibold text-text-primary">
              {MONTH_NAMES[currentMonth]} {currentYear}
            </span>
          </div>
          <button 
            onClick={goToNextMonth}
            className="p-1 hover:bg-hover-bg rounded transition-colors text-text-secondary"
            aria-label="Next month"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="p-3">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
          {DAY_NAMES.map(d => (
            <div key={d} className="text-text-tertiary font-medium py-1">{d}</div>
          ))}
        </div>
        
        {/* Days */}
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="py-1.5" />
            }
            
            const event = getEventForDay(day)
            const todayClass = isToday(day) 
              ? 'bg-wf-crimson/10 border border-wf-crimson text-wf-crimson font-bold' 
              : ''
            const eventClass = event && !isToday(day)
              ? `${event.color.replace('bg-', 'bg-').replace('-400', '-100')} dark:${event.color.replace('bg-', 'bg-').replace('-400', '-900/30')} text-text-primary font-medium`
              : ''
            
            return (
              <div
                key={day}
                className={`py-1.5 rounded cursor-default ${
                  todayClass || eventClass || 'text-text-secondary hover:bg-hover-bg'
                }`}
                title={event?.label}
              >
                {day}
              </div>
            )
          })}
        </div>
      </div>
      
      {/* Key Dates for this month */}
      {eventsThisMonth.length > 0 && (
        <div className="px-4 py-3 border-t border-surface-tertiary space-y-2">
          {eventsThisMonth.slice(0, 3).map((event, idx) => (
            <div key={idx} className="flex items-center gap-2 text-xs">
              <span className={`w-2 h-2 rounded-full ${event.color}`}></span>
              <span className="text-text-secondary">
                {MONTH_NAMES[currentMonth].slice(0, 3)} {event.date} - {event.label}
              </span>
            </div>
          ))}
        </div>
      )}
      
      <a 
        href="https://registrar.wisc.edu/academic-calendar/"
        target="_blank"
        rel="noopener noreferrer"
        className="block px-4 py-2.5 text-xs text-center text-wf-crimson hover:bg-hover-bg border-t border-surface-tertiary transition-colors"
      >
        Full Academic Calendar →
      </a>
    </div>
  )
}
