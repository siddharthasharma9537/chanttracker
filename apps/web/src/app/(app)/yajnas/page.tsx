'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { listYajnas } from '@/lib/api/yajnas'

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-sacred-500/20 text-sacred-400',
  completed: 'bg-green-500/20 text-green-400',
  archived: 'bg-white/10 text-white/50',
}

export default function YajnasListPage() {
  const { data: yajnas, isLoading } = useQuery({ queryKey: ['yajnas'], queryFn: listYajnas })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Global Yajnas</h1>
          <p className="text-white/60">Open, collective japa campaigns — anyone can join</p>
        </div>
        <Link
          href="/yajnas/new"
          className="flex items-center gap-1.5 rounded-xl bg-sacred-500/80 px-4 py-2 font-semibold text-white hover:bg-sacred-500"
        >
          <Plus className="h-4 w-4" /> New
        </Link>
      </div>

      {isLoading ? (
        <p className="text-white/50">Loading…</p>
      ) : !yajnas?.length ? (
        <p className="text-white/50">No yajnas yet — start one for others to join.</p>
      ) : (
        <ul className="space-y-2">
          {yajnas.map((y) => {
            const pct = Math.min(100, Math.round((y.completed_count / y.target_count) * 100))
            return (
              <li key={y.id}>
                <Link
                  href={`/yajnas/${y.id}`}
                  className="block rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 hover:bg-white/[0.08]"
                  style={{
                    borderLeftColor: y.mantras?.accent_color ?? '#f97316',
                    borderLeftWidth: 3,
                  }}
                >
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="truncate font-medium text-white">{y.title}</span>
                    <span
                      className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[y.status]}`}
                    >
                      {y.status}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-sacred-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1 text-xs text-white/50">
                    {y.completed_count.toLocaleString()} / {y.target_count.toLocaleString()} ({pct}%)
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
