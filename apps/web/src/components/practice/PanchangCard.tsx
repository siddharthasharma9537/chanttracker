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
      <span className="text-white/80">{panchang.vara.name_en}</span>
      <span>
        {panchang.tithi.paksha} Paksha, {panchang.tithi.name_en}
      </span>
      <span>{panchang.nakshatra.name_en} Nakshatra</span>
      {panchang.festivals.length > 0 && (
        <span className="text-sacred-400">{panchang.festivals.join(', ')}</span>
      )}
    </div>
  )
}
