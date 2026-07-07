import { createClient } from '@/lib/supabase/client'
import type { SessionRow } from '@/types/database'

export interface SessionWithMantra extends SessionRow {
  mantras: { name_en: string | null; accent_color: string | null } | null
}

/**
 * One write per chanting session: insert directly as completed.
 * (The project rollup trigger fires on INSERT too.)
 */
export async function logSession(input: {
  userId: string
  mantraId: string
  count: number
  durationSecs: number
  projectId?: string
  grahaId?: number
}): Promise<SessionRow> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .insert({
      user_id: input.userId,
      mantra_id: input.mantraId,
      count: input.count,
      duration_secs: input.durationSecs,
      status: 'completed',
      project_id: input.projectId ?? null,
      graha_id: input.grahaId ?? null,
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (error) throw error
  return data as SessionRow
}

export async function listMySessions(limit = 50): Promise<SessionWithMantra[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('*, mantras(name_en, accent_color)')
    .order('started_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return (data ?? []) as SessionWithMantra[]
}
