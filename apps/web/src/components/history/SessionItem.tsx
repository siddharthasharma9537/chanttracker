'use client'

import { Clock, Circle, CheckCircle2, XCircle } from 'lucide-react'
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
  mantraColor = '#f97316',
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
  const isCompleted = session.session_status === 'completed'

  return (
    <div className="glassmorphic overflow-hidden hover:bg-white/20 transition-all duration-300 group">
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
              <div className="flex items-start gap-3">
                {/* Status Icon */}
                <div className="flex-shrink-0 pt-0.5">
                  {isCompleted && (
                    <CheckCircle2 className="w-5 h-5 text-green-400" />
                  )}
                  {isAbandoned && (
                    <XCircle className="w-5 h-5 text-red-400" />
                  )}
                  {isIncomplete && (
                    <Circle className="w-5 h-5 text-amber-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  {mantraDevanagari && (
                    <p className="text-lg font-devanagari text-white leading-tight">
                      {mantraDevanagari}
                    </p>
                  )}
                  <p className="text-sm font-medium text-white/80 mt-0.5">
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
                        ? 'bg-red-500/30 text-red-200 border border-red-500/50'
                        : 'bg-amber-500/30 text-amber-200 border border-amber-500/50'
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
                <p className="text-2xl sm:text-3xl font-bold text-sacred-400">
                  {session.count}
                </p>
                <p className="text-xs sm:text-sm text-white/70 font-medium">
                  {session.target ? `of ${session.target}` : 'counts'}
                </p>
              </div>

              {/* Divider */}
              <div className="hidden sm:block w-px h-12 bg-white/20" />

              {/* Time & Duration */}
              <div className="flex flex-col gap-2 text-xs sm:text-sm">
                <div className="flex items-center gap-1.5 text-white/80">
                  <Clock className="w-4 h-4 flex-shrink-0" />
                  <span>{formatTime(session.started_at)}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/70">
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
