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

// Mantra display names mapping
const MANTRA_DISPLAY_MAP: Record<string, { name: string; devanagari: string; color: string }> = {
  'sun-1': { name: 'Surya Mantra', devanagari: 'सूर्य मंत्र', color: '#F59E0B' },
  'moon-1': { name: 'Chandra Mantra', devanagari: 'चंद्र मंत्र', color: '#60A5FA' },
  'gayatri-1': { name: 'Gayatri Mantra', devanagari: 'गायत्री मंत्र', color: '#EC4899' },
  'om-1': { name: 'Om Chanting', devanagari: 'ॐ', color: '#8B5CF6' },
}

export function useSessions(limit = 50) {
  const supabase = createClient()

  return useQuery({
    queryKey: ['sessions', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chant_sessions')
        .select('*')
        .order('started_at', { ascending: false })
        .limit(limit)

      if (error) throw error

      // Map mantra data from display map
      const sessions = (data || []).map((session: any) => {
        const mantraData = MANTRA_DISPLAY_MAP[session.mantra_id as string] || {
          name: session.mantra_id || 'Unknown Mantra',
          devanagari: '',
          color: '#9CA3AF',
        }
        return {
          ...session,
          mantra_name: mantraData.name,
          mantra_devanagari: mantraData.devanagari,
          mantra_color: mantraData.color,
        }
      })

      return sessions as Session[]
    },
    staleTime: 1000 * 60, // 1 minute
  })
}

export function useUpdateSessionCount() {
  const supabase = createClient()
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ sessionId, count }: { sessionId: string; count: number }) => {
      const { data, error } = await (supabase
        .from('chant_sessions') as any)
        .update({ count })
        .eq('id', sessionId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
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
      console.log('[useSessions] Inserting session with mantraId:', mantraId)
      const { data, error } = await (supabase
        .from('chant_sessions') as any)
        .insert({
          mantra_id: mantraId,
          count: 0,
          target: 108,
          session_status: 'active',
        })
        .select()
        .single()

      if (error) {
        console.error('[useSessions] Insert error:', error)
        throw error
      }
      console.log('[useSessions] Session inserted successfully:', data)
      return data
    },
    onSuccess: () => {
      // Invalidate sessions query to refresh the list
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
}
