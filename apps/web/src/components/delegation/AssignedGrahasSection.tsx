'use client'

import { PriestDashboardItem } from '@/hooks/useDelegation'
import { Play } from 'lucide-react'

interface AssignedGrahasSectionProps {
  items: PriestDashboardItem[]
  onStartSession: (grahaId: string, grahaName: string, assignmentType: 'assigned' | 'volunteer') => void
}

export function AssignedGrahasSection({
  items,
  onStartSession,
}: AssignedGrahasSectionProps) {
  const assignedItems = items.filter((item) => item.assignment_type === 'assigned')

  if (assignedItems.length === 0) {
    return null
  }

  const totalTarget = assignedItems.reduce((sum, item) => sum + item.target, 0)
  const totalCompleted = assignedItems.reduce((sum, item) => sum + item.completed, 0)

  return (
    <div className="mb-8">
      {/* Header with stats */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          My Assigned Work
        </h2>
        <p className="text-sm text-gray-600">
          {totalCompleted.toLocaleString()} of {totalTarget.toLocaleString()} mantras
        </p>
      </div>

      {/* Assigned grahas list */}
      <div className="space-y-3">
        {assignedItems.map((item) => {
          const progressPct = Math.min(item.completion_pct, 100)
          const remaining = item.target - item.completed

          return (
            <div
              key={item.graha_id}
              className="bg-white rounded-lg border border-temple-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
            >
              {/* Graha header with target info */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {item.graha_name}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600">
                    <span>
                      <span className="font-semibold text-gray-900">{item.completed.toLocaleString()}</span>
                      {' / '}
                      {item.target.toLocaleString()}
                    </span>
                    <span className="text-gray-400">•</span>
                    <span>
                      <span className="font-semibold text-gray-900">{remaining.toLocaleString()}</span>
                      {' remaining'}
                    </span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-temple-100 text-temple-700 rounded-full text-xs font-semibold">
                  ASSIGNED
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-temple-500 to-temple-600 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="mt-1 text-right">
                  <span className="text-xs font-medium text-gray-600">
                    {item.completion_pct}%
                  </span>
                </div>
              </div>

              {/* Start session button */}
              <button
                onClick={() => onStartSession(item.graha_id, item.graha_name, 'assigned')}
                className="w-full px-4 py-2 bg-temple-500 hover:bg-temple-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Play className="w-4 h-4" />
                Start Session
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
