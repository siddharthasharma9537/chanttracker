'use client'

import { Flame, Trophy } from 'lucide-react'

interface QuickStatsCardsProps {
  streak: number
  total: number
  isLoading?: boolean
}

export function QuickStatsCards({ streak, total, isLoading }: QuickStatsCardsProps) {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glassmorphic p-6 h-28 animate-pulse" />
        <div className="glassmorphic p-6 h-28 animate-pulse" />
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {/* Streak Card */}
      <div className="glassmorphic p-6 sm:p-8 backdrop-blur-xl group hover:border-orange-400/40 transition-all">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-2">
              Current Streak
            </p>
            <p className="text-4xl sm:text-5xl font-bold text-orange-300 mb-1">
              {streak}
            </p>
            <p className="text-white/60 text-sm">
              {streak === 1 ? 'day' : 'days'} in a row
            </p>
          </div>
          <div className="p-3 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
            <Flame className="w-6 h-6 text-orange-300" />
          </div>
        </div>
      </div>

      {/* Lifetime Card */}
      <div className="glassmorphic p-6 sm:p-8 backdrop-blur-xl group hover:border-orange-400/40 transition-all">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-white/70 text-xs uppercase tracking-widest font-semibold mb-2">
              Lifetime Mantras
            </p>
            <p className="text-4xl sm:text-5xl font-bold text-orange-300 mb-1">
              {(total / 1000).toFixed(1)}k
            </p>
            <p className="text-white/60 text-sm">
              {total.toLocaleString()} total
            </p>
          </div>
          <div className="p-3 bg-orange-500/20 rounded-lg group-hover:bg-orange-500/30 transition-colors">
            <Trophy className="w-6 h-6 text-orange-300" />
          </div>
        </div>
      </div>
    </div>
  )
}
