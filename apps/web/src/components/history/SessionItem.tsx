'use client'

import { Clock, Circle } from 'lucide-react'
import { Session } from '@/hooks/useSessions'

interface SessionItemProps {
  session: Session
  mantraName?: string
  mantraDevanagari?: string
  mantraColor?: string
}

export function SessionItem({
  session,
  mantraName = 'Mantra',
  mantraDevanagari,
  mantraColor = '#c8914a',
}: SessionItemProps) {
  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    })
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const isAbandoned = session.session_status === 'abandoned'
  const isIncomplete = session.session_status === 'active'

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* Left Color Border */}
      <div className="flex">
        <div
          className="w-1 sm:w-1.5 flex-shrink-0"
          style={{ backgroundColor: mantraColor }}
        />

        {/* Content */}
        <div className="flex-1 p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            {/* Mantra Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0 pt-0.5">
                  {mantraDevanagari && (
                    <p className="text-lg font-devanagari text-gray-900 leading-tight">
                      {mantraDevanagari}
                    </p>
                  )}
                  <p className="text-sm font-medium text-gray-700 mt-0.5">
                    {mantraName}
                  </p>
                </div>
              </div>

              {/* Status Badge */}
              {(isAbandoned || isIncomplete) && (
                <div className="mt-2 inline-flex">
                  <span
                    className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                      isAbandoned
                        ? 'bg-red-100 text-red-700'
                        : 'bg-amber-100 text-amber-700'
                    }`}
                  >
                    {isAbandoned ? 'Abandoned' : 'In Progress'}
                  </span>
                </div>
              )}
            </div>

            {/* Stats Section */}
            <div className="flex items-center gap-4 sm:gap-6 text-right sm:text-left">
              {/* Count */}
              <div className="flex flex-col items-end sm:items-start">
                <p className="text-2xl sm:text-3xl font-bold text-gray-900">
                  {session.count}
                </p>
                <p className="text-xs sm:text-sm text-gray-600 font-medium">
                  {session.target ? `of ${session.target}` : 'counts'}
                </p>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-12 bg-gray-200" />

              {/* Time & Duration */}
              <div className="flex flex-col gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-gray-700">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{formatTime(session.started_at)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-gray-600">
                  <Circle className="w-3 h-3 flex-shrink-0" />
                  <span>{formatDuration(session.duration_seconds)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
