'use client'

import { Check, Calendar } from 'lucide-react'

interface DayData {
  date: string
  count: number
  dayName: string
}

interface ActivityGraphProps {
  data?: DayData[]
  isLoading?: boolean
}

export function ActivityGraph({ data }: ActivityGraphProps) {
  // Build the last 7 calendar days. Without real data we show an honest
  // empty week (zeros) rather than inventing random numbers that would
  // contradict the lifetime/streak stats elsewhere on the dashboard.
  const buildWeek = (): DayData[] => {
    const days: DayData[] = []
    const today = new Date()
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today)
      date.setDate(date.getDate() - i)
      days.push({
        date: date.toISOString().split('T')[0],
        count: 0,
        dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
      })
    }
    return days
  }

  const activityData = data && data.length ? data : buildWeek()
  const maxCount = Math.max(...activityData.map((d) => d.count), 1)

  return (
    <div className="glassmorphic p-8 sm:p-10 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <Calendar className="w-5 h-5 text-orange-300" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          Practice Consistency
        </h3>
      </div>

      {/* Activity Grid */}
      <div className="space-y-6">
        {/* Days */}
        <div>
          <div className="grid grid-cols-7 gap-1.5 sm:gap-2 md:gap-3 mb-4">
            {activityData.map((day, idx) => {
              const isComplete = day.count > 0
              const heightPercent = (day.count / maxCount) * 100

              return (
                <div key={idx} className="flex flex-col items-center gap-2">
                  {/* Fixed-height track so every bar shares one baseline
                      and all day labels line up underneath. */}
                  <div className="flex h-28 w-full items-end">
                    <div
                      className={`group relative w-full rounded-lg transition-all duration-300 ${
                        isComplete
                          ? 'cursor-pointer bg-gradient-to-t from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500'
                          : 'bg-white/5'
                      }`}
                      style={{ height: `${isComplete ? Math.max(heightPercent, 8) : 6}%` }}
                    >
                      {/* Tooltip */}
                      {isComplete && (
                        <div className="absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 flex-col items-center whitespace-nowrap rounded-lg bg-gray-900 px-3 py-2 text-xs text-white group-hover:flex">
                          <span className="font-semibold">{day.count}</span>
                          <span className="text-white/70">{day.dayName}</span>
                        </div>
                      )}

                      {/* Checkmark for completed days */}
                      {isComplete && (
                        <div className="absolute inset-x-0 top-1 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-white/90" />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Day label */}
                  <p className="w-full truncate text-center text-xs font-medium text-white/60">
                    {day.dayName}
                  </p>
                </div>
              )
            })}
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
          <div className="text-center">
            <p className="text-white/60 text-xs mb-1">This Week</p>
            <p className="text-white font-bold text-lg">
              {activityData.reduce((sum, d) => sum + d.count, 0).toLocaleString()}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs mb-1">Average/Day</p>
            <p className="text-white font-bold text-lg">
              {Math.round(activityData.reduce((sum, d) => sum + d.count, 0) / activityData.length)}
            </p>
          </div>
          <div className="text-center">
            <p className="text-white/60 text-xs mb-1">Active Days</p>
            <p className="text-white font-bold text-lg">
              {activityData.filter(d => d.count > 0).length}/7
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
