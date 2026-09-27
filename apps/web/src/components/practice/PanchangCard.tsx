'use client'

import { useQuery } from '@tanstack/react-query'
import { getPanchang } from '@/lib/api/panchang'

export function PanchangCard() {
  const today = new Date().toLocaleDateString('sv')
  const { data: panchang, isLoading, error } = useQuery({
    queryKey: ['panchang', today],
    queryFn: () => getPanchang(today),
    staleTime: 1000 * 60 * 60,
  })

  if (isLoading || error || !panchang) return null

  return (
    <div className="mb-6 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/60">
      <span className="text-white/80">{panchang.weekday}</span>
      <span>
        {panchang.paksha === 'shukla' ? 'Shukla' : 'Krishna'} Paksha, {panchang.tithi}
      </span>
      <span>{panchang.nakshatra} Nakshatra</span>
      <span className="text-xs text-white/30">(approximate)</span>
    </div>
  )
}
