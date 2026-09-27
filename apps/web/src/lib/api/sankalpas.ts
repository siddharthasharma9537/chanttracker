import { createClient } from '@/lib/supabase/client'

export type SankalpaPurpose =
  | 'health_healing'
  | 'family_wellbeing'
  | 'spiritual_growth'
  | 'success_prosperity'
  | 'peace_of_mind'
  | 'custom'

export type SankalpaStatus = 'active' | 'completed' | 'missed'

export interface Sankalpa {
  id: string
  user_id: string
  purpose: SankalpaPurpose
  custom_text: string | null
  mantra_id: string | null
  for_date: string
  target_count: number
  achieved_count: number
  sankalpa_status: SankalpaStatus
  intention_text: string | null
  completed_at: string | null
  created_at: string
}

export interface NewSankalpa {
  purpose: SankalpaPurpose
  custom_text?: string
  mantra_id?: string | null
  target_count: number
  intention_text?: string
}

export async function getTodaySankalpa(userId: string): Promise<Sankalpa | null> {
  const supabase = createClient()
  const today = new Date().toLocaleDateString('sv')
  const { data, error } = await supabase
    .from('sankalpas')
    .select('*')
    .eq('user_id', userId)
    .eq('for_date', today)
    .eq('sankalpa_status', 'active')
    .maybeSingle()
  if (error) throw error
  return data
}

export async function listSankalpas(userId: string): Promise<Sankalpa[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sankalpas')
    .select('*')
    .eq('user_id', userId)
    .order('for_date', { ascending: false })
  if (error) throw error
  return data
}

export async function createSankalpa(userId: string, input: NewSankalpa): Promise<Sankalpa> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sankalpas')
    .insert({
      user_id: userId,
      purpose: input.purpose,
      custom_text: input.custom_text ?? null,
      mantra_id: input.mantra_id ?? null,
      target_count: input.target_count,
      intention_text: input.intention_text ?? null,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

export interface LogProgressResult {
  error?: string
  ok?: boolean
  achieved_count?: number
  target_count?: number
  completed?: boolean
}

export async function logSankalpaProgress(
  userId: string,
  sankalpaId: string,
  delta: number
): Promise<LogProgressResult> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('log_sankalpa_progress', {
    p_user: userId,
    p_sankalpa: sankalpaId,
    p_delta: delta,
  })
  if (error) throw error
  return data as LogProgressResult
}
