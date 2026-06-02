'use client'

import { PriestDashboardItem } from '@/hooks/useDelegation'
import { Heart } from 'lucide-react'

interface VolunteerOpportunitiesSectionProps {
  items: PriestDashboardItem[]
  onStartSession: (grahaId: string, grahaName: string, assignmentType: 'assigned' | 'volunteer') => void
}

export function VolunteerOpportunitiesSection({
  items,
  onStartSession,
}: VolunteerOpportunitiesSectionProps) {
  const volunteerItems = items.filter((item) => item.assignment_type === 'unassigned' && item.can_volunteer)

  if (volunteerItems.length === 0) {
    return null
  }

  const totalVolunteerRemaining = volunteerItems.reduce(
    (sum, item) => sum + (item.target - item.completed),
    0
  )

  return (
    <div className="mb-8">
      {/* Header with stats */}
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
          <Heart className="w-5 h-5 text-sacred-500" />
          Volunteer Opportunities
        </h2>
        <p className="text-sm text-gray-600">
          {volunteerItems.length} incomplete grahas • {totalVolunteerRemaining.toLocaleString()} mantras needed
        </p>
      </div>

      {/* Volunteer grahas list */}
      <div className="space-y-3">
        {volunteerItems.map((item) => {
          const progressPct = Math.min(item.completion_pct, 100)
          const remaining = item.target - item.completed

          return (
            <div
              key={item.graha_id}
              className="bg-white rounded-lg border border-sacred-100 p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow"
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
                      <span className="font-semibold text-sacred-600">{remaining.toLocaleString()} needed</span>
                    </span>
                  </div>
                </div>
                <div className="inline-flex items-center gap-1 px-2 py-1 bg-sacred-100 text-sacred-700 rounded-full text-xs font-semibold">
                  VOLUNTEER
                </div>
              </div>

              {/* Progress bar */}
              <div className="mb-4">
                <div className="relative h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-sacred-400 to-sacred-500 transition-all duration-300"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <div className="mt-1 text-right">
                  <span className="text-xs font-medium text-gray-600">
                    {item.completion_pct}% complete
                  </span>
                </div>
              </div>

              {/* Start volunteering button */}
              <button
                onClick={() => onStartSession(item.graha_id, item.graha_name, 'volunteer')}
                className="w-full px-4 py-2 bg-sacred-500 hover:bg-sacred-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
              >
                <Heart className="w-4 h-4" />
                Volunteer
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
