'use client'

// Beneficiary progress page — no account needed. Anyone with the share
// link sees read-only progress via the anon-granted RPC.

import { useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'

interface Row {
  beneficiary_name: string
  description: string | null
  status: string
  created_at: string
  graha_name: string
  graha_color: string | null
  target_count: number
  completed_count: number
}

export default function BeneficiaryViewPage() {
  const { code } = useParams<{ code: string }>()

  const { data, isLoading, error } = useQuery({
    queryKey: ['view', code],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase.rpc('project_progress_by_share_code', {
        p_share_code: code,
      })
      if (error) throw error
      return (data ?? []) as Row[]
    },
    refetchInterval: 60_000, // live-ish progress for the family watching
  })

  if (isLoading)
    return <p className="p-8 text-center text-white/50">Loading…</p>
  if (error || !data?.length)
    return (
      <p className="p-8 text-center text-white/60">
        This link is invalid or the project is no longer shared.
      </p>
    )

  const first = data[0]
  const target = data.reduce((s, r) => s + r.target_count, 0)
  const done = data.reduce((s, r) => s + r.completed_count, 0)
  const pct = target ? Math.min(100, Math.round((done / target) * 100)) : 0

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <p className="text-center text-xs uppercase tracking-widest text-white/40">
        Navagraha Japa for
      </p>
      <h1 className="mb-1 text-center text-3xl font-bold text-white">
        {first.beneficiary_name}
      </h1>
      {first.description && (
        <p className="mb-6 text-center text-white/60">{first.description}</p>
      )}

      <div className="mb-2 h-3 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-sacred-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mb-8 text-center text-sm tabular-nums text-white/60">
        {done.toLocaleString()} / {target.toLocaleString()} japas · {pct}%
        {first.status === 'completed' && ' · complete 🙏'}
      </p>

      <div className="space-y-2">
        {data.map((r) => {
          const gp = r.target_count
            ? Math.min(100, Math.round((r.completed_count / r.target_count) * 100))
            : 0
          return (
            <div
              key={r.graha_name}
              className="rounded-xl border border-white/10 bg-white/[0.05] p-3"
            >
              <div className="flex items-baseline justify-between">
                <span className="flex items-center gap-2 font-medium text-white">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: r.graha_color ?? '#f97316' }}
                  />
                  {r.graha_name}
                </span>
                <span className="text-xs tabular-nums text-white/50">
                  {r.completed_count.toLocaleString()} / {r.target_count.toLocaleString()}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${gp}%`, backgroundColor: r.graha_color ?? '#f97316' }}
                />
              </div>
            </div>
          )
        })}
      </div>

      <p className="mt-10 text-center text-xs text-white/30">ChantTracker</p>
    </div>
  )
}
