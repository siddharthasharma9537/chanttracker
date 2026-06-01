'use client'

import { useRouter } from 'next/navigation'
import { ChevronRight, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PanchangData {
  tithi: string
  nakshatra: string
  weekday_lord: string
  mantra_name: string
  mantra_devanagari?: string
}

interface TodaysPracticeProps {
  done: number
  target: number
  isLoading?: boolean
}

export function TodaysPractice({ done, target, isLoading }: TodaysPracticeProps) {
  const router = useRouter()
  const [panchang, setPanchang] = useState<PanchangData | null>(null)
  const [panchangLoading, setPanchangLoading] = useState(true)

  const progressPercent = target > 0 ? Math.round((done / target) * 100) : 0
  const hasGoal = target > 0
  const isComplete = hasGoal && done >= target
  const statusLabel = !hasGoal ? 'Not started' : isComplete ? 'Complete!' : 'In Progress'

  useEffect(() => {
    const fetchPanchang = async () => {
      try {
        setPanchangLoading(true)
        const supabase = createClient()
        const { data, error: rpcError } = await supabase.rpc('panchang')

        if (rpcError) {
          setPanchang({
            tithi: 'Krishna Tritiya',
            nakshatra: 'Rohini',
            weekday_lord: 'Saturday - Shani',
            mantra_name: 'Shani Navagraha Mantra',
            mantra_devanagari: 'शनैश्चराय नमः',
          })
        } else if (data) {
          setPanchang(data)
        }
      } catch (err) {
        setPanchang({
          tithi: 'Krishna Tritiya',
          nakshatra: 'Rohini',
          weekday_lord: 'Saturday - Shani',
          mantra_name: 'Shani Navagraha Mantra',
          mantra_devanagari: 'शनैश्चराय नमः',
        })
      } finally {
        setPanchangLoading(false)
      }
    }

    fetchPanchang()
  }, [])

  return (
    <div className="glassmorphic p-8 sm:p-12 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h3 className="text-2xl sm:text-3xl font-bold text-white" style={{ fontFamily: 'Merriweather, serif' }}>
          Today&apos;s Practice
        </h3>
        <div
          className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
            isComplete
              ? 'bg-green-500/15 text-green-300'
              : hasGoal
                ? 'bg-amber-500/15 text-amber-300'
                : 'bg-white/10 text-white/60'
          }`}
        >
          <Zap className="w-4 h-4" />
          {statusLabel}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <p className="text-white/80 text-sm font-medium">Today&apos;s Target</p>
          <p className="text-white font-bold text-lg">
            {done} <span className="text-white/60 font-normal">/ {target}</span>
          </p>
        </div>
        <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-orange-400 to-orange-500 rounded-full transition-all duration-500"
            style={{ width: `${Math.min(progressPercent, 100)}%` }}
          />
        </div>
        <p className="text-white/60 text-xs mt-2">{progressPercent}% complete</p>
      </div>

      {/* Mantra Recommendation */}
      {!panchangLoading && panchang && (
        <div className="mb-8 p-6 bg-white/5 rounded-xl border border-white/10">
          <p className="text-white/70 text-xs uppercase tracking-widest mb-3 font-semibold">
            Recommended for You
          </p>
          <h4 className="text-white text-xl font-semibold mb-2">
            {panchang.mantra_name || 'Recommended Daily Mantra'}
          </h4>
          {panchang.mantra_devanagari && (
            <p className="font-devanagari text-2xl text-orange-300 mb-3">
              {panchang.mantra_devanagari}
            </p>
          )}
          <div className="text-white/70 text-sm space-y-1">
            <p>Weekday Lord: <span className="text-white/90">{panchang.weekday_lord}</span></p>
            <p>Lunar Mansion: <span className="text-white/90">{panchang.nakshatra}</span></p>
          </div>
        </div>
      )}

      {/* CTA Button */}
      <button
        onClick={() => router.push('/chant')}
        className="w-full bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-bold px-4 sm:px-6 py-3 sm:py-4 rounded-xl transition-all duration-300 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 sm:gap-3 shadow-xl hover:shadow-2xl group text-base sm:text-lg"
      >
        <span>START CHANTING</span>
        <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6 group-hover:translate-x-1 transition-transform" />
      </button>
    </div>
  )
}
