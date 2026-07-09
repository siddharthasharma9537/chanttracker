import { createClient } from '@/lib/supabase/client'

export interface Profile {
  reminder_time: string | null // 'HH:MM:SS'
}

export async function getProfile(userId: string): Promise<Profile | null> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('profiles')
    .select('reminder_time')
    .eq('id', userId)
    .maybeSingle()
  if (error) throw error
  return data
}

/** Pass null to turn the reminder off. */
export async function setReminderTime(userId: string, time: string | null): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('profiles')
    .update({ reminder_time: time })
    .eq('id', userId)
  if (error) throw error
}
