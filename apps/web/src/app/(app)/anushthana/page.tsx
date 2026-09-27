'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { listAnushthanas } from '@/lib/api/anushthanas'
import { useAuth } from '@/hooks/useAuth'

const STATUS_LABEL: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  broken: 'Broken',
  abandoned: 'Abandoned',
}

const STATUS_COLOR: Record<string, string> = {
  active: 'bg-sacred-500/20 text-sacred-400',
  completed: 'bg-green-500/20 text-green-400',
  broken: 'bg-red-500/20 text-red-400',
  abandoned: 'bg-white/10 text-white/50',
}

export default function AnushthanaListPage() {
  const { user } = useAuth()
  const { data: anushthanas, isLoading } = useQuery({
    queryKey: ['anushthanas', user?.id],
    queryFn: () => listAnushthanas(user!.id),
    enabled: !!user,
  })

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Anushthana</h1>
          <p className="text-white/60">Multi-day vows with a daily japa target</p>
        </div>
        <Link
          href="/anushthana/new"
          className="flex items-center gap-1.5 rounded-xl bg-sacred-500/80 px-4 py-2 font-semibold text-white hover:bg-sacred-500"
        >
          <Plus className="h-4 w-4" /> New
        </Link>
      </div>

      {isLoading ? (
        <p className="text-white/50">Loading…</p>
      ) : !anushthanas?.length ? (
        <p className="text-white/50">No anushthanas yet — start one to commit to a japa vow.</p>
      ) : (
        <ul className="space-y-2">
          {anushthanas.map((a) => (
            <li key={a.id}>
              <Link
                href={`/anushthana/${a.id}`}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/[0.05] px-4 py-3 hover:bg-white/[0.08]"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium text-white">{a.title}</p>
                  <p className="text-xs text-white/50">
                    {a.daily_target_count.toLocaleString()}/day · {a.total_days} days ·{' '}
                    {a.start_date} – {a.end_date}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_COLOR[a.status]}`}
                >
                  {STATUS_LABEL[a.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
