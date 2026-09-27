import { createClient } from '@/lib/supabase/client'

export interface Panchang {
  date: string
  weekday: string
  weekday_lord: string
  tithi_num: number
  tithi: string
  paksha: 'shukla' | 'krishna'
  nakshatra_num: number
  nakshatra: string
  mantra_recommendations: string[]
  lat: number
  lon: number
  notes: string
}

/**
 * Ujjain (23.1765N, 75.7885E) is the traditional reference meridian for
 * Indian panchang calculations and is the RPC's default; callers don't need
 * to pass coordinates unless showing a location-adjusted panchang.
 */
export async function getPanchang(date = new Date().toLocaleDateString('sv')): Promise<Panchang> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('panchang', { p_date: date })
  if (error) throw error
  return data as Panchang
}
