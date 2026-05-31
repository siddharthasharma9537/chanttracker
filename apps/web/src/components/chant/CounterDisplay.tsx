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
        <div className="mb-10 text-center">
          <p className="text-3xl font-bold text-temple-900 mb-2" style={{ fontFamily: 'Merriweather, serif' }}>{mantraName}</p>
          <p className="text-xl text-temple-700 mt-1 font-light">{mantraDevanagari}</p>
        </div>
      )}

      {/* Circular Progress */}
      <div className="relative w-72 h-72 mb-10 drop-shadow-xl">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 200 200">
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
            </filter>
          </defs>
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="#ede2d6"
            strokeWidth="10"
            filter="url(#shadow)"
          />
          {/* Progress circle with glow */}
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke={color || '#f97316'}
            strokeWidth="10"
            strokeDasharray={`${(progress / 100) * (2 * Math.PI * 90)} ${
              2 * Math.PI * 90
            }`}
            strokeLinecap="round"
            className="transition-all duration-500"
            filter="url(#shadow)"
            style={{
              filter: 'drop-shadow(0 0 8px rgba(249, 115, 22, 0.4))',
            }}
          />
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-center">
            <p
              className="text-8xl font-bold tabular-nums"
              style={{ color: color || '#f97316', fontFamily: 'Merriweather, serif' }}
            >
              {count}
            </p>
            <p className="text-2xl text-temple-600 mt-4 font-light">of {target}</p>
          </div>
        </div>
      </div>

      {/* Timer and Status */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <p className="text-3xl font-mono text-temple-800 font-semibold tracking-wider">{timeString}</p>
        <div className={`flex items-center gap-2 px-4 py-2 rounded-full ${statusColor} ${state === 'active' ? 'bg-sacred-50' : 'bg-temple-50'}`}>
          <div className={`w-2 h-2 rounded-full ${state === 'active' ? 'bg-sacred-500 animate-pulse' : 'bg-current'}`} />
          <span className="text-sm font-semibold">{statusLabel}</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-sm">
        <div className="h-3 bg-temple-200 rounded-full overflow-hidden shadow-inner">
          <div
            className="h-full transition-all duration-300 rounded-full"
            style={{
              width: `${progress}%`,
              backgroundColor: color || '#f97316',
              boxShadow: `0 0 12px ${color ? color + '80' : 'rgba(249, 115, 22, 0.5)'}`,
            }}
          />
        </div>
        <p className="text-sm text-temple-700 mt-3 text-center font-semibold">
          {progress.toFixed(0)}% complete
        </p>
      </div>
    </div>
  )
}
