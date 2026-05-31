'use client'

import { Flame, Zap } from 'lucide-react'

interface QuickStatsProps {
  streak: number
  total: number
  isLoading?: boolean
}

export function QuickStats({ streak, total, isLoading }: QuickStatsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
        <div className="h-24 bg-gray-200 rounded-lg animate-pulse" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Streak Card */}
      <div className="bg-gradient-to-br from-dawn-50 to-temple-50 rounded-lg p-6 shadow-sm border border-dawn-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Current Streak</p>
            <p className="text-3xl font-bold text-dawn-900">{streak}</p>
            <p className="text-xs text-gray-500 mt-1">consecutive days</p>
          </div>
          <Flame className="w-12 h-12 text-dawn-500 opacity-80" />
        </div>
      </div>

      {/* Lifetime Stats Card */}
      <div className="bg-gradient-to-br from-temple-50 to-midnight-50 rounded-lg p-6 shadow-sm border border-temple-100">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-gray-600 mb-1">Lifetime Japas</p>
            <p className="text-3xl font-bold text-temple-900">{total.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-1">total mantras chanted</p>
          </div>
          <Zap className="w-12 h-12 text-temple-500 opacity-80" />
        </div>
      </div>
    </div>
  )
}
