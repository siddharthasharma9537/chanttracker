'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { getAnushthana, markAnushthanaDay } from '@/lib/api/anushthanas'

export default function AnushthanaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [achieved, setAchieved] = useState<number | ''>('')
  const [feedback, setFeedback] = useState<string | null>(null)

  const { data, isLoading } = useQuery({
    queryKey: ['anushthana', id],
    queryFn: () => getAnushthana(id),
  })

  const markDay = useMutation({
    mutationFn: (count: number) => markAnushthanaDay(id, count),
    onSuccess: (result) => {
      if (result.error === 'target_not_met') {
        setFeedback(`Not counted — need at least ${result.required?.toLocaleString()} today.`)
      } else if (result.error === 'day_already_marked') {
        setFeedback("Today's count is already recorded.")
      } else if (result.error) {
        setFeedback(result.error)
      } else {
        setFeedback(
          result.days_done === result.total_days
            ? 'Anushthana complete! 🙏'
            : `Day recorded — ${result.days_done}/${result.total_days} days done.`
        )
      }
      queryClient.invalidateQueries({ queryKey: ['anushthana', id] })
      queryClient.invalidateQueries({ queryKey: ['anushthanas'] })
    },
  })

  if (isLoading || !data) return <p className="text-white/50">Loading…</p>
  const { anushthana, progress } = data
  const daysDone = progress.length

  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/anushthana')}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{anushthana.title}</h1>
          {anushthana.intention && <p className="text-white/60">{anushthana.intention}</p>}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.05] p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm text-white/60">Progress</span>
          <span className="font-semibold text-white">
            {daysDone} / {anushthana.total_days} days
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-sacred-500"
            style={{ width: `${Math.min(100, (daysDone / anushthana.total_days) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-xs text-white/40">
          {anushthana.daily_target_count.toLocaleString()} japas/day ·{' '}
          {anushthana.start_date} – {anushthana.end_date}
          {anushthana.strict_mode && ' · strict mode'}
        </p>
      </div>

      {anushthana.status === 'active' && (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.05] p-4">
          <label className="mb-2 block text-sm font-medium text-white">
            Today&apos;s achieved count
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={0}
              value={achieved}
              onChange={(e) => setAchieved(e.target.value === '' ? '' : Number(e.target.value))}
              placeholder={anushthana.daily_target_count.toString()}
              className="flex-1 rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-right tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
            />
            <button
              onClick={() => achieved !== '' && markDay.mutate(achieved)}
              disabled={achieved === '' || markDay.isPending}
              className="rounded-xl bg-sacred-500/80 px-5 font-semibold text-white hover:bg-sacred-500 disabled:opacity-40"
            >
              Mark day
            </button>
          </div>
          {feedback && <p className="mt-2 text-sm text-white/70">{feedback}</p>}
        </div>
      )}

      <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/40">
        Daily log
      </h2>
      {progress.length === 0 ? (
        <p className="text-white/50">No days recorded yet.</p>
      ) : (
        <ul className="space-y-1">
          {[...progress].reverse().map((p) => (
            <li
              key={p.id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
            >
              <span className="text-white/70">{p.for_date}</span>
              <span className="tabular-nums text-white">{p.achieved_count.toLocaleString()}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
