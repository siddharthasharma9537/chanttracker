import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

export interface Session {
  id: string
  count: number
  target: number
  duration_seconds?: number
  started_at: string
  ended_at?: string
  session_status?: string
  mantra_name?: string
  mantra_devanagari?: string
  mantra_color?: string
  mantra_id?: string
}

export function useSessions(limit = 50) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['sessions', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chant_sessions')
        .select(
          `*,
           mantras:mantra_id(name, devanagari, color)`
        )
        .order('started_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Flatten mantra data
      const sessions = (data || []).map((session: any) => ({
        ...session,
        mantra_name: session.mantras?.name,
        mantra_devanagari: session.mantras?.devanagari,
        mantra_color: session.mantras?.color,
      }))

      return sessions as Session[]
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useCompleteSession() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (sessionId: string) => {
      const { data, error } = await (supabase.rpc as any)('complete_chant_session', {
        session_id: sessionId,
      })
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}

export function useStartSession() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async (mantraId: string) => {
      const { data, error } = await (supabase
        .from('chant_sessions') as any)
        .insert({
          mantra_id: mantraId,
          count: 0,
          target: 108,
          session_status: 'active',
          chant_date: new Date().toLocaleDateString('sv'),
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      // Invalidate sessions query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
