'use client'

import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface DelegationSession {
  id: string
  graha_id: string
  count: number
  duration_seconds?: number
  session_date: string
  created_at: string
}

interface DelegationSessionWithGrahaName extends DelegationSession {
  graha_name: string
}

interface AssignedPriestProjectHistoryProps {
  projectId: string
  priestId: string
}

export function AssignedPriestProjectHistory({
  projectId,
  priestId,
}: AssignedPriestProjectHistoryProps) {
  const supabase = createClient()

  // Fetch delegation sessions for this project and priest with graha names
  const { data: sessions = [], isLoading } = useQuery({
    queryKey: ['delegation-sessions', projectId, priestId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('delegation_sessions')
        .select(`
          id,
          graha_id,
          count,
          duration_seconds,
          session_date,
          created_at,
          project_grahas(graha_name)
        `)
        .eq('project_id', projectId)
        .eq('priest_id', priestId)
        .order('created_at', { ascending: false })
        .limit(100)

      if (error) throw error

      // Map the response to extract graha_name from the nested project_grahas
      const sessionsWithNames = (data || []).map((session: any) => ({
        ...session,
        graha_name: session.project_grahas?.graha_name || 'Unknown Graha',
      }))

      return sessionsWithNames as DelegationSessionWithGrahaName[]
    },
  })

  // Group sessions by date
  const sessionsByDate = sessions.reduce(
    (acc, session) => {
      const date = session.session_date
      if (!acc[date]) {
        acc[date] = []
      }
      acc[date].push(session)
      return acc
    },
    {} as Record<string, DelegationSessionWithGrahaName[]>
  )

  // Calculate statistics
  const totalSessions = sessions.length
  const totalCount = sessions.reduce((sum, s) => sum + s.count, 0)
  const avgCount = totalSessions > 0 ? Math.round(totalCount / totalSessions) : 0

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-orange-500" />
      </div>
    )
  }

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-white/70">No sessions yet.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 pb-24">
      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-white/60 text-sm">Sessions</p>
          <p className="text-white text-2xl font-bold">{totalSessions}</p>
        </div>
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-white/60 text-sm">Total Japas</p>
          <p className="text-white text-2xl font-bold">{totalCount}</p>
        </div>
        <div className="p-4 rounded-lg bg-white/5 border border-white/10">
          <p className="text-white/60 text-sm">Average</p>
          <p className="text-white text-2xl font-bold">{avgCount}</p>
        </div>
      </div>

      {/* Sessions by date */}
      <div className="space-y-6">
        {Object.entries(sessionsByDate).map(([date, dateSessions]) => (
          <div key={date}>
            <h3 className="text-white/70 text-sm font-semibold mb-3 px-2">
              {new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })}
            </h3>
            <div className="space-y-2">
              {dateSessions.map((session) => (
                <div
                  key={session.id}
                  className="p-4 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-white font-medium">{session.graha_name}</h4>
                      <p className="text-white/60 text-sm">
                        {new Date(session.created_at).toLocaleTimeString('en-US', {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">{session.count} japas</p>
                      <p className="text-white/60 text-sm">
                        {session.duration_seconds ? Math.round(session.duration_seconds / 60) : 0}m
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
