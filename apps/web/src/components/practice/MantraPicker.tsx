'use client'

import { useQuery } from '@tanstack/react-query'
import { listMantras, displayText, type Mantra } from '@/lib/api/mantras'
import { getMantraTotals } from '@/lib/api/progress'
import { useAuth } from '@/hooks/useAuth'

interface MantraPickerProps {
  onSelect: (mantra: Mantra) => void
}

export function MantraPicker({ onSelect }: MantraPickerProps) {
  const { user } = useAuth()
  const { data: mantras, isLoading, error } = useQuery({
    queryKey: ['mantras'],
    queryFn: listMantras,
    staleTime: 1000 * 60 * 30,
  })

  const grahaIds = (mantras ?? [])
    .filter((m) => m.category === 'navagraha')
    .map((m) => m.id)
  const { data: totals } = useQuery({
    queryKey: ['mantra-progress', user?.id, grahaIds],
    queryFn: () => getMantraTotals(user!.id, grahaIds),
    enabled: !!user && grahaIds.length > 0,
  })

  if (isLoading)
    return <p className="py-12 text-center text-white/50">Loading mantras…</p>
  if (error)
    return (
      <p className="py-12 text-center text-red-300">
        Could not load mantras: {(error as Error).message}
      </p>
    )

  const grahas = (mantras ?? []).filter((m) => m.category === 'navagraha')
  const others = (mantras ?? []).filter((m) => m.category !== 'navagraha')

  // 0=Mon..6=Sun (project convention) vs JS Date's 0=Sun..6=Sat.
  const todayIdx = (new Date().getDay() + 6) % 7
  const todaysCandidates = grahas.filter((m) => m.weekday_tags?.includes(todayIdx))
  const todaysGraha = todaysCandidates.sort((a, b) => b.default_target - a.default_target)[0]
  const orderedGrahas = todaysGraha
    ? [todaysGraha, ...grahas.filter((m) => m.id !== todaysGraha.id)]
    : grahas
  const WEEKDAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const Section = ({
    title,
    items,
    showProgress,
    todaysId,
  }: {
    title: string
    items: Mantra[]
    showProgress?: boolean
    todaysId?: string
  }) =>
    items.length === 0 ? null : (
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
          {title}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => {
            const done = totals?.[m.id] ?? 0
            const pct = m.default_target
              ? Math.min(100, Math.round((done / m.default_target) * 100))
              : 0
            return (
              <button
                key={m.id}
                onClick={() => onSelect(m)}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-4 text-left transition hover:bg-white/[0.10] active:scale-[0.99]"
                style={{ borderLeftColor: m.accent_color ?? '#f97316', borderLeftWidth: 3 }}
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="flex items-center gap-1.5 font-semibold text-white">
                    {m.name_en}
                    {m.id === todaysId && (
                      <span className="rounded-full bg-sacred-500/20 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-sacred-400">
                        Today
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 text-xs tabular-nums text-white/40">
                    {m.default_target.toLocaleString()}
                  </span>
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-white/60">
                  {displayText(m)}
                </p>
                {showProgress && (
                  <>
                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full"
                        style={{ width: `${pct}%`, backgroundColor: m.accent_color ?? '#f97316' }}
                      />
                    </div>
                    <p className="mt-1 text-[11px] tabular-nums text-white/40">
                      {done.toLocaleString()} / {m.default_target.toLocaleString()} lifetime ({pct}%)
                    </p>
                  </>
                )}
              </button>
            )
          })}
        </div>
      </section>
    )

  return (
    <div className="space-y-8">
      <div>
        {todaysGraha && (
          <p className="mb-3 text-sm text-white/50">
            🗓️ {WEEKDAY_NAMES[todayIdx]} is{' '}
            <span className="text-white/80">
              {todaysGraha.name_en?.replace(/ Graha Mantra$/, '')}
            </span>
            &apos;s day
          </p>
        )}
        <Section title="Navagraha" items={orderedGrahas} showProgress todaysId={todaysGraha?.id} />
      </div>
      <Section title="Devata & Others" items={others} />
    </div>
  )
}
