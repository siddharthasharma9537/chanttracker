'use client'

import { Session } from '@/hooks/useSessions'
import { SessionItem } from './SessionItem'
import { AlertCircle, RotateCcw } from 'lucide-react'

interface SessionListProps {
  sessions: Session[]
  selectedDate: Date
  isLoading: boolean
  error: Error | null
  onRetry: () => void
}

export function SessionList({
  sessions,
  selectedDate,
  isLoading,
  error,
  onRetry,
}: SessionListProps) {
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv')
  }

  const filteredSessions = sessions.filter(
    (session) => new Date(session.started_at).toLocaleDateString('sv') === formatDate(selectedDate)
  )

  if (isLoading) {
    return (
      <div className="space-y-4">
        {/* Skeleton Loaders */}
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse"
          >
            <div className="flex">
              <div className="w-1.5 bg-gray-300 flex-shrink-0" />
              <div className="flex-1 p-4 sm:p-5">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-300 rounded w-32" />
                  <div className="h-3 bg-gray-200 rounded w-24" />
                  <div className="flex gap-4 mt-4">
                    <div className="h-8 bg-gray-300 rounded w-12" />
                    <div className="h-8 bg-gray-300 rounded w-16" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-start gap-3 flex-1">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-900 text-sm sm:text-base">
              Failed to load sessions
            </h3>
            <p className="text-red-700 text-xs sm:text-sm mt-1">
              {error.message || 'An error occurred while fetching your sessions.'}
            </p>
          </div>
        </div>
        <button
          onClick={onRetry}
          className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium text-sm whitespace-nowrap"
        >
          <RotateCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    )
  }

  if (filteredSessions.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8 sm:p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 bg-temple-50 rounded-full flex items-center justify-center">
            <span className="text-3xl">🧘</span>
          </div>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          No sessions recorded
        </h3>
        <p className="text-gray-600 text-sm mb-6 max-w-xs mx-auto">
          {selectedDate.toLocaleDateString('en-US', {
            weekday: 'long',
            month: 'short',
            day: 'numeric',
          })}{' '}
          doesn&apos;t have any chanting sessions yet.
        </p>
      </div>
    )
  }

  const totalCount = filteredSessions.reduce((sum, session) => sum + session.count, 0)

  return (
    <div className="space-y-4">
      {/* Session List */}
      <div className="space-y-3">
        {filteredSessions.map((session) => (
          <SessionItem
            key={session.id}
            session={session}
            mantraName={session.mantra_name || 'Mantra'}
            mantraDevanagari={session.mantra_devanagari}
            mantraColor={session.mantra_color || '#c8914a'}
          />
        ))}
      </div>

      {/* Summary Footer */}
      <div className="bg-gradient-to-r from-temple-50 to-dawn-50 rounded-lg border border-temple-100 p-4 sm:p-5 mt-6">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-center">
          <div>
            <p className="text-2xl sm:text-3xl font-bold text-temple-600">
              {filteredSessions.length}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
              {filteredSessions.length === 1 ? 'Session' : 'Sessions'}
            </p>
          </div>

          <div>
            <p className="text-2xl sm:text-3xl font-bold text-temple-600">
              {totalCount}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
              Total Japas
            </p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <p className="text-2xl sm:text-3xl font-bold text-temple-600">
              {filteredSessions.length > 0
                ? Math.round(totalCount / filteredSessions.length)
                : 0}
            </p>
            <p className="text-xs sm:text-sm text-gray-600 font-medium mt-1">
              Avg per Session
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
