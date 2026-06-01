import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface DashboardData {
  done: number
  target: number
  pct: number
  streak: number
  total: number
}

export function useDashboard() {
  const supabase = createClient()

  return useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_today_progress')
      if (error) throw error
      return data as DashboardData
    },
    staleTime: 1000 * 30, // 30 seconds
    refetchInterval: 1000 * 60, // 1 minute polling
  })
}
