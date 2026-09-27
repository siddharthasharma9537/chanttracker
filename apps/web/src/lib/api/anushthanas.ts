import { createClient } from '@/lib/supabase/client'

export type AnushthanaStatus = 'active' | 'completed' | 'broken' | 'abandoned'

export interface Anushthana {
  id: string
  user_id: string
  mantra_id: string | null
  title: string
  intention: string | null
  daily_target_count: number
  total_days: number
  start_date: string
  end_date: string
  strict_mode: boolean
  status: AnushthanaStatus
  completed_at: string | null
  created_at: string
}

export interface AnushthanaProgressEntry {
  id: string
  anushthana_id: string
  for_date: string
  achieved_count: number
  session_count: number
}

export interface NewAnushthana {
  mantra_id?: string | null
  title: string
  intention?: string
  daily_target_count: number
  total_days: number
  start_date?: string
  strict_mode?: boolean
}

export async function listAnushthanas(userId: string): Promise<Anushthana[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('anushthanas')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getAnushthana(
  id: string
): Promise<{ anushthana: Anushthana; progress: AnushthanaProgressEntry[] }> {
  const supabase = createClient()
  const [{ data: anushthana, error: aErr }, { data: progress, error: pErr }] = await Promise.all([
    supabase.from('anushthanas').select('*').eq('id', id).single(),
    supabase
      .from('anushthana_progress')
      .select('*')
      .eq('anushthana_id', id)
      .order('for_date', { ascending: true }),
  ])
  if (aErr) throw aErr
  if (pErr) throw pErr
  return { anushthana, progress: progress ?? [] }
}

export async function createAnushthana(userId: string, input: NewAnushthana): Promise<Anushthana> {
  const supabase = createClient()
  const startDate = input.start_date ?? new Date().toLocaleDateString('sv')
  const start = new Date(startDate)
  const end = new Date(start)
  end.setDate(end.getDate() + input.total_days - 1)

  const { data, error } = await supabase
    .from('anushthanas')
    .insert({
      user_id: userId,
      mantra_id: input.mantra_id ?? null,
      title: input.title,
      intention: input.intention ?? null,
      daily_target_count: input.daily_target_count,
      total_days: input.total_days,
      start_date: startDate,
      end_date: end.toLocaleDateString('sv'),
      strict_mode: input.strict_mode ?? true,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export interface MarkDayResult {
  error?: string
  required?: number
  ok?: boolean
  days_done?: number
  total_days?: number
}

/** Records today's achieved count against an active anushthana via the DB's own
 *  completion-tracking RPC (mark_anushthana_day) — one row per calendar day,
 *  auto-completes the anushthana once total_days is reached. */
export async function markAnushthanaDay(
  anushthanaId: string,
  achievedCount: number
): Promise<MarkDayResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('mark_anushthana_day', {
    p_anushthana: anushthanaId,
    p_achieved: achievedCount,
  })
  if (error) throw error
  return data as MarkDayResult
}
