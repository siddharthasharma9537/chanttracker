import { createClient } from '@/lib/supabase/client'

export type YajnaStatus = 'active' | 'completed' | 'archived'

export interface GlobalYajna {
  id: string
  title: string
  description: string | null
  mantra_id: string | null
  target_count: number
  completed_count: number
  start_date: string
  end_date: string | null
  status: YajnaStatus
  created_by: string
  created_at: string
  mantras?: { name_en: string | null; accent_color: string | null } | null
}

export interface YajnaLeaderboardRow {
  user_id: string
  contributed_count: number
  joined_at: string
  profiles: { display_name: string | null } | null
}

export interface NewYajna {
  title: string
  description?: string
  mantra_id?: string | null
  target_count: number
  end_date?: string
}

export async function listYajnas(): Promise<GlobalYajna[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('global_yajnas')
    .select('*, mantras(name_en, accent_color)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function getYajna(id: string): Promise<GlobalYajna> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('global_yajnas')
    .select('*, mantras(name_en, accent_color)')
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

export async function getYajnaLeaderboard(yajnaId: string): Promise<YajnaLeaderboardRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('yajna_participants')
    .select('user_id, contributed_count, joined_at, profiles(display_name)')
    .eq('yajna_id', yajnaId)
    .order('contributed_count', { ascending: false })
  if (error) throw error
  return data as unknown as YajnaLeaderboardRow[]
}

export async function createYajna(userId: string, input: NewYajna): Promise<GlobalYajna> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('global_yajnas')
    .insert({
      title: input.title,
      description: input.description ?? null,
      mantra_id: input.mantra_id ?? null,
      target_count: input.target_count,
      end_date: input.end_date ?? null,
      created_by: userId,
    })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Joining is just registering a participant row with zero contribution so
 *  far — the roll_up_yajna_session trigger does the actual upsert-and-increment
 *  the first time a session is logged against this yajna, so this is only
 *  needed to make a user appear on the leaderboard before their first session. */
export async function joinYajna(userId: string, yajnaId: string): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('yajna_participants')
    .upsert({ yajna_id: yajnaId, user_id: userId, contributed_count: 0 }, { onConflict: 'yajna_id,user_id', ignoreDuplicates: true })
  if (error) throw error
}

export async function getMyYajnaParticipation(
  userId: string,
  yajnaId: string
): Promise<{ contributed_count: number } | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('yajna_participants')
    .select('contributed_count')
    .eq('yajna_id', yajnaId)
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}
