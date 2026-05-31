'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface PanchangData {
  tithi: string
  nakshatra: string
  weekday_lord: string
  mantra_name: string
  mantra_devanagari?: string
}

export function PanchangWidget() {
  const [panchang, setPanchang] = useState<PanchangData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchPanchang = async () => {
      try {
        setIsLoading(true)
        const supabase = createClient()

        // Try to fetch from RPC
        const { data, error: rpcError } = await supabase.rpc('panchang')

        if (rpcError) {
          // Fallback to demo data
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
        setError(null)
      } catch (err) {
        // Use fallback demo data
        setPanchang({
          tithi: 'Krishna Tritiya',
          nakshatra: 'Rohini',
          weekday_lord: 'Saturday - Shani',
          mantra_name: 'Shani Navagraha Mantra',
          mantra_devanagari: 'शनैश्चराय नमः',
        })
        setError(null)
      } finally {
        setIsLoading(false)
      }
    }

    fetchPanchang()
  }, [])

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-temple-100 h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-4 border-temple-100 border-t-temple-500" />
      </div>
    )
  }

  if (error || !panchang) {
    return (
      <div className="bg-white rounded-lg p-6 shadow-sm border border-temple-100">
        <p className="text-sm text-red-600">Unable to load panchang data</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg p-6 shadow-sm border border-temple-100 space-y-4">
      <h3 className="font-semibold text-gray-900 text-sm uppercase tracking-wide">
        Today&apos;s Panchang
      </h3>

      <div className="space-y-3 text-sm">
        {/* Tithi */}
        <div>
          <p className="text-gray-500 text-xs">Lunar Day</p>
          <p className="text-gray-900 font-medium">{panchang.tithi}</p>
        </div>

        {/* Nakshatra */}
        <div>
          <p className="text-gray-500 text-xs">Lunar Mansion</p>
          <p className="text-gray-900 font-medium">{panchang.nakshatra}</p>
        </div>

        {/* Weekday Lord */}
        <div>
          <p className="text-gray-500 text-xs">Weekday Lord</p>
          <p className="text-gray-900 font-medium">{panchang.weekday_lord}</p>
        </div>

        {/* Mantra Recommendation */}
        <div className="border-t border-gray-200 pt-3 mt-3">
          <p className="text-gray-500 text-xs mb-2">Recommended Mantra</p>
          <p className="text-gray-900 font-medium text-sm">{panchang.mantra_name}</p>
          {panchang.mantra_devanagari && (
            <p className="font-devanagari text-lg text-temple-700 mt-1">
              {panchang.mantra_devanagari}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
