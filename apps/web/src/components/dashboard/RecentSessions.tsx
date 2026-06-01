'use client'

import { Clock, Zap } from 'lucide-react'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Session {
  id: string
  mantra_name: string
  count: number
  target: number
  created_at: string
  completed_at?: string
}

interface RecentSessionsProps {
  isLoading?: boolean
}

export function RecentSessions({ isLoading = false }: RecentSessionsProps) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        setLoading(true)
        const supabase = createClient()

        // Try to fetch recent sessions
        const { data, error } = await supabase
          .from('sessions')
          .select('id, mantra_name, count, target, created_at, completed_at')
          .order('created_at', { ascending: false })
          .limit(5)

        if (!error && data) {
          setSessions(data as Session[])
        } else {
          // No sessions table / no rows yet — show the honest empty state
          // rather than fabricated sessions that contradict the lifetime stats.
          setSessions([])
        }
      } catch (err) {
        setSessions([])
      } finally {
        setLoading(false)
      }
    }

    fetchSessions()
  }, [])

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)
    const diffHours = Math.floor(diffMs / 3600000)
    const diffDays = Math.floor(diffMs / 86400000)

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (loading || isLoading) {
    return (
      <div className="glassmorphic p-8 sm:p-10 backdrop-blur-xl">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-orange-500/20 rounded-lg">
            <Clock className="w-5 h-5 text-orange-300" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Recent Sessions
          </h3>
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="glassmorphic p-8 sm:p-10 backdrop-blur-xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-orange-500/20 rounded-lg">
          <Clock className="w-5 h-5 text-orange-300" />
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-white">
          Recent Sessions
        </h3>
      </div>

      {/* Sessions List */}
      {sessions.length > 0 ? (
        <div className="space-y-3">
          {sessions.map((session, idx) => {
            const isComplete = session.count >= session.target
            const percentage = Math.round((session.count / session.target) * 100)

            return (
              <div
                key={session.id || idx}
                className="p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors border border-white/5 hover:border-orange-400/30"
              >
                <div className="flex items-center justify-between mb-3">
                  <h4 className="text-white font-semibold text-sm sm:text-base">
                    {session.mantra_name}
                  </h4>
                  <span className="text-white/60 text-xs">
                    {formatDate(session.created_at)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white/70 text-xs">
                        {session.count}/{session.target}
                      </p>
                      <p className="text-orange-300 text-xs font-semibold">
                        {percentage}%
                      </p>
                    </div>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isComplete
                            ? 'bg-gradient-to-r from-orange-500 to-orange-400'
                            : 'bg-gradient-to-r from-blue-500 to-blue-400'
                        }`}
                        style={{ width: `${Math.min(percentage, 100)}%` }}
                      />
                    </div>
                  </div>
                  {isComplete && (
                    <div className="flex-shrink-0">
                      <Zap className="w-4 h-4 text-orange-300" />
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-white/60 text-sm">No sessions yet. Start chanting to begin!</p>
        </div>
      )}
    </div>
  )
}
