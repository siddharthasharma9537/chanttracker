import { createClient } from '@/lib/supabase/client'

export interface Streak {
  current_streak: number
  longest_streak: number
  last_chant_date: string | null
}

export interface Achievement {
  code: string
  title: string
  description: string | null
  emoji: string | null
  threshold: number
  unlocked_at: string | null
}

export async function getStreak(userId: string): Promise<Streak | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('streaks')
    .select('current_streak, longest_streak, last_chant_date')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** All achievements, with unlocked_at set for the ones this user has earned. */
export async function listAchievements(userId: string): Promise<Achievement[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('achievements')
    .select('code, title, description, emoji, threshold, user_achievements(unlocked_at, user_id)')
    .order('sort_order')
  if (error) throw error

  return (data ?? []).map((a: any) => ({
    code: a.code,
    title: a.title,
    description: a.description,
    emoji: a.emoji,
    threshold: a.threshold,
    unlocked_at:
      a.user_achievements.find((u: any) => u.user_id === userId)?.unlocked_at ?? null,
  }))
}

/**
 * Lifetime completed japa count per mantra — the "goal" for a navagraha
 * mantra (graha, adhidevata, pratyadhidevata) is completing its own
 * default_target across all sessions ever logged, not per-sitting.
 */
export async function getMantraTotals(
  userId: string,
  mantraIds: string[]
): Promise<Record<string, number>> {
  if (mantraIds.length === 0) return {}
  const supabase = createClient()
  const { data, error } = await supabase
    .from('sessions')
    .select('mantra_id, count')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .in('mantra_id', mantraIds)
  if (error) throw error

  const totals: Record<string, number> = {}
  for (const row of data ?? []) {
    if (!row.mantra_id) continue
    totals[row.mantra_id] = (totals[row.mantra_id] ?? 0) + row.count
  }
  return totals
}
