'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { listMantras } from '@/lib/api/mantras'
import { createAnushthana } from '@/lib/api/anushthanas'
import { useAuth } from '@/hooks/useAuth'

export default function NewAnushthanaPage() {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [mantraId, setMantraId] = useState('')
  const [intention, setIntention] = useState('')
  const [dailyTarget, setDailyTarget] = useState(108)
  const [totalDays, setTotalDays] = useState(41)
  const [strictMode, setStrictMode] = useState(true)

  const { data: mantras } = useQuery({ queryKey: ['mantras'], queryFn: listMantras })

  const create = useMutation({
    mutationFn: () =>
      createAnushthana(user!.id, {
        title: title.trim(),
        mantra_id: mantraId || null,
        intention: intention.trim() || undefined,
        daily_target_count: dailyTarget,
        total_days: totalDays,
        strict_mode: strictMode,
      }),
    onSuccess: (anushthana) => {
      queryClient.invalidateQueries({ queryKey: ['anushthanas'] })
      router.push(`/anushthana/${anushthana.id}`)
    },
  })

  const canSubmit = title.trim().length > 0 && dailyTarget > 0 && totalDays >= 1

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
        <h1 className="text-2xl font-bold text-white">New anushthana</h1>
      </div>

      <label className="mb-1 block text-sm font-medium text-white">Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. 41-day Ganapati vratam"
        className="mb-4 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-500"
      />

      <label className="mb-1 block text-sm font-medium text-white">
        Mantra <span className="text-white/40">(optional)</span>
      </label>
      <select
        value={mantraId}
        onChange={(e) => setMantraId(e.target.value)}
        className="mb-4 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
      >
        <option value="">No specific mantra</option>
        {(mantras ?? []).map((m) => (
          <option key={m.id} value={m.id}>
            {m.name_en}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-sm font-medium text-white">
        Intention <span className="text-white/40">(optional)</span>
      </label>
      <input
        value={intention}
        onChange={(e) => setIntention(e.target.value)}
        placeholder="What is this vow for?"
        className="mb-4 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-500"
      />

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-white">Daily target</label>
          <input
            type="number"
            min={1}
            value={dailyTarget}
            onChange={(e) => setDailyTarget(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-right tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-white">Total days</label>
          <input
            type="number"
            min={1}
            value={totalDays}
            onChange={(e) => setTotalDays(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-right tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
          />
        </div>
      </div>

      <label className="mb-6 flex items-center gap-2 text-sm text-white">
        <input
          type="checkbox"
          checked={strictMode}
          onChange={(e) => setStrictMode(e.target.checked)}
          className="h-4 w-4"
        />
        Strict mode — a missed day breaks the vow
      </label>

      <button
        onClick={() => create.mutate()}
        disabled={!canSubmit || create.isPending}
        className="w-full rounded-xl bg-sacred-500/80 py-3 font-semibold text-white hover:bg-sacred-500 disabled:opacity-40"
      >
        {create.isPending ? 'Creating…' : 'Begin anushthana'}
      </button>
      {create.error && (
        <p className="mt-3 text-sm text-red-300">{(create.error as Error).message}</p>
      )}
    </div>
  )
}
