'use client'

import { useState } from 'react'
import { ChevronDown } from 'lucide-react'

interface AssignedPriest {
  priest_id: string
  priest_name: string
  assignment_type: string
}

interface GrahaProgressCardProps {
  grahaName: string
  completed: number
  target: number
  completionPct: number
  assignedPriests: AssignedPriest[]
  onShowContributions?: () => void
}

export function GrahaProgressCard({
  grahaName,
  completed,
  target,
  completionPct,
  assignedPriests,
  onShowContributions,
}: GrahaProgressCardProps) {
  const [expanded, setExpanded] = useState(false)
  const isComplete = completionPct === 100

  const getProgressColor = (pct: number) => {
    if (pct >= 100) return 'bg-green-500'
    if (pct >= 66) return 'bg-blue-500'
    if (pct >= 33) return 'bg-yellow-500'
    return 'bg-red-500'
  }

  const getProgressBarColor = (pct: number) => {
    if (pct >= 100) return 'from-green-400 to-green-600'
    if (pct >= 66) return 'from-blue-400 to-blue-600'
    if (pct >= 33) return 'from-yellow-400 to-yellow-600'
    return 'from-red-400 to-red-600'
  }

  return (
    <div className="mb-4">
      <button
        onClick={() => {
          setExpanded(!expanded)
          if (!expanded && onShowContributions) {
            onShowContributions()
          }
        }}
        className="w-full text-left"
      >
        <div className="bg-white rounded-lg border border-temple-100 p-4 hover:border-temple-300 hover:shadow-sm transition-all">
          {/* Header Row */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-3 flex-1">
              <div className={`w-3 h-3 rounded-full ${getProgressColor(completionPct)}`} />
              <h3 className="text-sm font-semibold text-gray-900">
                {grahaName}
              </h3>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm font-medium text-gray-700">
                {completed.toLocaleString()} / {target.toLocaleString()}
              </span>
              {isComplete && (
                <span className="text-green-600 font-bold text-lg">✓</span>
              )}
              <ChevronDown
                className={`w-4 h-4 text-gray-400 transition-transform ${
                  expanded ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
            <div
              className={`h-full bg-gradient-to-r ${getProgressBarColor(completionPct)} transition-all duration-300`}
              style={{ width: `${Math.min(completionPct, 100)}%` }}
            />
          </div>

          {/* Percentage */}
          <div className="text-right">
            <span className="text-xs font-semibold text-gray-600">
              {completionPct}%
            </span>
          </div>
        </div>
      </button>

      {/* Expanded Details */}
      {expanded && (
        <div className="mt-2 bg-gray-50 rounded-lg border border-temple-100 p-4 ml-0 animate-in fade-in duration-200">
          {assignedPriests && assignedPriests.length > 0 ? (
            <>
              <div className="text-xs font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                {assignedPriests.length} Priest{assignedPriests.length !== 1 ? 's' : ''} Assigned
              </div>
              <div className="space-y-2">
                {assignedPriests.map((priest) => (
                  <div
                    key={priest.priest_id}
                    className="flex items-center justify-between p-2 bg-white rounded border border-gray-200 hover:bg-gray-100 transition-colors cursor-pointer"
                  >
                    <span className="text-sm text-gray-900 font-medium">
                      {priest.priest_name}
                    </span>
                    <span className="text-xs px-2 py-1 rounded-full bg-temple-100 text-temple-700">
                      {priest.assignment_type === 'assigned' ? 'Assigned' : 'Volunteer'}
                    </span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="text-sm text-gray-500 italic">
              No priests assigned yet
            </div>
          )}
        </div>
      )}
    </div>
  )
}
