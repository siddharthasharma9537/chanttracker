'use client'

interface ProgressRingProps {
  done: number
  target: number
  isLoading?: boolean
}

export function ProgressRing({ done, target, isLoading }: ProgressRingProps) {
  const percentage = target > 0 ? Math.min((done / target) * 100, 100) : 0
  const circumference = 2 * Math.PI * 45 // radius 45
  const strokeDashoffset = circumference - (percentage / 100) * circumference

  // Color based on percentage
  const getColor = (pct: number) => {
    if (pct <= 33) return '#ef4444' // red
    if (pct <= 66) return '#eab308' // yellow
    return '#22c55e' // green
  }

  const ringColor = getColor(percentage)

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-temple-100 border-t-temple-500" />
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center justify-center gap-6">
      <div className="relative w-64 h-64">
        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
          {/* Background circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke="#e5e7eb"
            strokeWidth="8"
          />
          {/* Progress circle */}
          <circle
            cx="60"
            cy="60"
            r="45"
            fill="none"
            stroke={ringColor}
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-300"
          />
        </svg>
        {/* Center text */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <div className="text-4xl font-bold text-temple-900">
            {done}
          </div>
          <div className="text-lg text-gray-600">
            / {target}
          </div>
        </div>
      </div>

      {/* Percentage below */}
      <div className="text-center">
        <p className="text-2xl font-semibold text-gray-800">
          {Math.round(percentage)}%
        </p>
        <p className="text-sm text-gray-500 mt-1">
          of today&apos;s target
        </p>
      </div>
    </div>
  )
}
