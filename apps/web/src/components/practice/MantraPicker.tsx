'use client'

import { useQuery } from '@tanstack/react-query'
import { listMantras, displayText, type Mantra } from '@/lib/api/mantras'

interface MantraPickerProps {
  onSelect: (mantra: Mantra) => void
}

export function MantraPicker({ onSelect }: MantraPickerProps) {
  const { data: mantras, isLoading, error } = useQuery({
    queryKey: ['mantras'],
    queryFn: listMantras,
    staleTime: 1000 * 60 * 30,
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

  const Section = ({ title, items }: { title: string; items: Mantra[] }) =>
    items.length === 0 ? null : (
      <section>
        <h2 className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
          {title}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((m) => (
            <button
              key={m.id}
              onClick={() => onSelect(m)}
              className="rounded-xl border border-white/10 bg-white/[0.05] p-4 text-left transition hover:bg-white/[0.10] active:scale-[0.99]"
              style={{ borderLeftColor: m.accent_color ?? '#f97316', borderLeftWidth: 3 }}
            >
              <div className="flex items-baseline justify-between gap-2">
                <span className="font-semibold text-white">{m.name_en}</span>
                <span className="shrink-0 text-xs tabular-nums text-white/40">
                  {m.default_target.toLocaleString()}
                </span>
              </div>
              <p className="mt-1 line-clamp-2 text-sm text-white/60">
                {displayText(m)}
              </p>
            </button>
          ))}
        </div>
      </section>
    )

  return (
    <div className="space-y-8">
      <Section title="Navagraha" items={grahas} />
      <Section title="Devata & Others" items={others} />
    </div>
  )
}
