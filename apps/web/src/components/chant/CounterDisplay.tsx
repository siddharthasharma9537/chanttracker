'use client'

import { useMemo } from 'react'

interface CounterDisplayProps {
  count: number
  target: number
  mantraName?: string
  mantraDevanagari?: string
  durationSecs: number
  state: 'idle' | 'active' | 'paused' | 'completed' | 'abandoned'
  color?: string
}

export function CounterDisplay({
  count,
  target,
  mantraName,
  mantraDevanagari,
  durationSecs,
  state,
  color,
}: CounterDisplayProps) {
  const progress = Math.min((count / target) * 100, 100)
  const isDone = count >= target

  const timeString = useMemo(() => {
    const minutes = Math.floor(durationSecs / 60)
    const seconds = durationSecs % 60
    return `${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`
  }, [durationSecs])

  const statusColor = {
    idle: 'text-gray-500',
    active: isDone ? 'text-green-600' : 'text-temple-600',
    paused: 'text-yellow-600',
    completed: 'text-green-600',
    abandoned: 'text-gray-500',
  }[state]

  const statusLabel = {
    idle: 'No session',
    active: isDone ? 'Complete!' : 'Chanting...',
    paused: 'Paused',
    completed: 'Completed',
    abandoned: 'Abandoned',
  }[state]

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      {/* Mantra Info */}
      {mantraName && (
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold text-gray-900">{mantraName}</p>
          <p className="text-lg text-gray-600 mt-1">{mantraDevanagari}</p>
        </div>
      )}

      {/* Circular Progress */}
      <div className="relative w-72 h-72 mb-8">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#E5E7EB"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={color || '#D97706'}
            strokeWidth="8"
            strokeDasharray={`${(progress / 100) * (2 * Math.PI * 90)} ${
              2 * Math.PI * 90
            }`}
            strokeLinecap="round"
            className="transition-all duration-500"
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <p
              className="text-8xl font-bold tabular-nums"
              style={{ color: color || '#D97706' }}
            >
              {count}
            </p>
            <p className="text-2xl text-gray-500 mt-2">of {target}</p>
          </div>
        </div>
      </div>

      {/* Timer and Status */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-lg font-mono text-gray-700">{timeString}</p>
        <div className={`flex items-center gap-2 ${statusColor}`}>
          <div className="w-2 h-2 rounded-full bg-current" />
          <span className="text-sm font-medium">{statusLabel}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full mt-8 max-w-sm">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full transition-all duration-300"
            style={{
              width: `${progress}%`,
              backgroundColor: color || '#D97706',
            }}
          />
        </div>
        <p className="text-xs text-gray-500 mt-2 text-center">
          {progress.toFixed(0)}% complete
        </p>
      </div>
    </div>
  )
}
