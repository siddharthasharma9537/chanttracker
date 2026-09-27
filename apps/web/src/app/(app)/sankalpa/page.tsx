'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getTodaySankalpa,
  listSankalpas,
  createSankalpa,
  logSankalpaProgress,
  type SankalpaPurpose,
} from '@/lib/api/sankalpas'
import { useAuth } from '@/hooks/useAuth'

const PURPOSE_LABEL: Record<SankalpaPurpose, string> = {
  health_healing: 'Health & healing',
  family_wellbeing: 'Family wellbeing',
  spiritual_growth: 'Spiritual growth',
  success_prosperity: 'Success & prosperity',
  peace_of_mind: 'Peace of mind',
  custom: 'Custom',
}

function NewSankalpaForm({ onCreated }: { onCreated: () => void }) {
  const { user } = useAuth()
  const [purpose, setPurpose] = useState<SankalpaPurpose>('spiritual_growth')
  const [customText, setCustomText] = useState('')
  const [intentionText, setIntentionText] = useState('')
  const [targetCount, setTargetCount] = useState(108)

  const create = useMutation({
    mutationFn: () =>
      createSankalpa(user!.id, {
        purpose,
        custom_text: purpose === 'custom' ? customText.trim() : undefined,
        intention_text: intentionText.trim() || undefined,
        target_count: targetCount,
      }),
    onSuccess: onCreated,
  })

  const canSubmit = targetCount > 0 && (purpose !== 'custom' || customText.trim().length > 0)

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.05] p-4">
      <h2 className="mb-3 font-semibold text-white">Set today&apos;s sankalpa</h2>
      <label className="mb-1 block text-sm font-medium text-white">Purpose</label>
      <select
        value={purpose}
        onChange={(e) => setPurpose(e.target.value as SankalpaPurpose)}
        className="mb-3 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
      >
        {Object.entries(PURPOSE_LABEL).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>

      {purpose === 'custom' && (
        <input
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          placeholder="Describe the purpose"
          className="mb-3 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-500"
        />
      )}

      <label className="mb-1 block text-sm font-medium text-white">
        Intention <span className="text-white/40">(optional)</span>
      </label>
      <input
        value={intentionText}
        onChange={(e) => setIntentionText(e.target.value)}
        placeholder="What are you chanting for today?"
        className="mb-3 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-500"
      />

      <label className="mb-1 block text-sm font-medium text-white">Target count</label>
      <input
        type="number"
        min={1}
        value={targetCount}
        onChange={(e) => setTargetCount(Math.max(1, Number(e.target.value)))}
        className="mb-4 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-right tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
      />

      <button
        onClick={() => create.mutate()}
        disabled={!canSubmit || create.isPending}
        className="w-full rounded-xl bg-sacred-500/80 py-2.5 font-semibold text-white hover:bg-sacred-500 disabled:opacity-40"
      >
        {create.isPending ? 'Setting…' : 'Set sankalpa'}
      </button>
      {create.error && <p className="mt-2 text-sm text-red-300">{(create.error as Error).message}</p>}
    </div>
  )
}

export default function SankalpaPage() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [feedback, setFeedback] = useState<string | null>(null)

  const { data: today, isLoading } = useQuery({
    queryKey: ['sankalpa-today', user?.id],
    queryFn: () => getTodaySankalpa(user!.id),
    enabled: !!user,
  })
  const { data: history } = useQuery({
    queryKey: ['sankalpas', user?.id],
    queryFn: () => listSankalpas(user!.id),
    enabled: !!user,
  })

  const logProgress = useMutation({
    mutationFn: (delta: number) => logSankalpaProgress(today!.id, delta),
    onSuccess: (result) => {
      setFeedback(result.completed ? 'Sankalpa fulfilled! 🙏' : null)
      queryClient.invalidateQueries({ queryKey: ['sankalpa-today'] })
      queryClient.invalidateQueries({ queryKey: ['sankalpas'] })
    },
  })

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['sankalpa-today'] })
    queryClient.invalidateQueries({ queryKey: ['sankalpas'] })
  }

  return (
    <div className="max-w-xl">
      <h1 className="mb-1 text-2xl font-bold text-white">Sankalpa</h1>
      <p className="mb-6 text-white/60">A daily intention to chant with purpose</p>

      {isLoading ? (
        <p className="text-white/50">Loading…</p>
      ) : today ? (
        <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.05] p-4">
          <p className="mb-1 text-sm text-white/60">
            {PURPOSE_LABEL[today.purpose]}
            {today.purpose === 'custom' && today.custom_text ? ` — ${today.custom_text}` : ''}
          </p>
          {today.intention_text && <p className="mb-3 text-white/80">{today.intention_text}</p>}
          <div className="mb-2 flex items-baseline justify-between">
            <span className="text-sm text-white/60">Progress</span>
            <span className="font-semibold text-white">
              {today.achieved_count.toLocaleString()} / {today.target_count.toLocaleString()}
            </span>
          </div>
          <div className="h-2 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-sacred-500"
              style={{
                width: `${Math.min(100, (today.achieved_count / today.target_count) * 100)}%`,
              }}
            />
          </div>
          <div className="mt-4 flex gap-2">
            {[27, 54, 108].map((n) => (
              <button
                key={n}
                onClick={() => logProgress.mutate(n)}
                disabled={logProgress.isPending}
                className="flex-1 rounded-xl border border-white/15 bg-white/[0.06] py-2 font-semibold text-white hover:bg-white/[0.12] disabled:opacity-40"
              >
                +{n}
              </button>
            ))}
          </div>
          {feedback && <p className="mt-3 text-sm text-sacred-300">{feedback}</p>}
        </div>
      ) : (
        <div className="mb-6">
          <NewSankalpaForm onCreated={invalidateAll} />
        </div>
      )}

      {!!history?.length && (
        <>
          <h2 className="mb-2 text-sm font-semibold uppercase tracking-widest text-white/40">
            History
          </h2>
          <ul className="space-y-1">
            {history
              .filter((s) => s.id !== today?.id)
              .map((s) => (
                <li
                  key={s.id}
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
                >
                  <span className="text-white/70">
                    {s.for_date} — {PURPOSE_LABEL[s.purpose]}
                  </span>
                  <span className="tabular-nums text-white/80">
                    {s.achieved_count.toLocaleString()} / {s.target_count.toLocaleString()}
                    {s.sankalpa_status === 'completed' ? ' ✓' : ''}
                  </span>
                </li>
              ))}
          </ul>
        </>
      )}
    </div>
  )
}
