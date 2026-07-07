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
