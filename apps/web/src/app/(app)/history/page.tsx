'use client'

import { useQuery } from '@tanstack/react-query'
import { listMySessions } from '@/lib/api/sessions'

export default function HistoryPage() {
  const { data: sessions, isLoading } = useQuery({
    queryKey: ['sessions'],
    queryFn: () => listMySessions(),
  })

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold text-white">History</h1>
      {isLoading ? (
        <p className="text-white/50">Loading…</p>
      ) : !sessions?.length ? (
        <p className="text-white/50">No sessions yet — start chanting on the Practice tab.</p>
      ) : (
        <ul className="space-y-2">
          {sessions.map((s) => (
            <li
              key={s.id}
              className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3"
              style={{
                borderLeftColor: s.mantras?.accent_color ?? '#f97316',
                borderLeftWidth: 3,
              }}
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-white">
                  {s.mantras?.name_en ?? 'Mantra'}
                  {s.project_id && (
                    <span className="ml-2 rounded bg-sacred-500/20 px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-sacred-400">
                      project
                    </span>
                  )}
                </p>
                <p className="text-xs text-white/50">
                  {new Date(s.started_at).toLocaleString()}
                  {s.duration_secs ? ` · ${Math.round(s.duration_secs / 60)} min` : ''}
                </p>
              </div>
              <span className="text-lg font-bold tabular-nums text-white">{s.count}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
