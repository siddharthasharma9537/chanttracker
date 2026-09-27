'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Trophy } from 'lucide-react'
import { getYajna, getYajnaLeaderboard, joinYajna, getMyYajnaParticipation } from '@/lib/api/yajnas'
import { listMantras, type Mantra } from '@/lib/api/mantras'
import { MantraPicker } from '@/components/practice/MantraPicker'
import { Counter } from '@/components/practice/Counter'
import { useAuth } from '@/hooks/useAuth'

export default function YajnaDetailPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [picking, setPicking] = useState(false)
  const [chanting, setChanting] = useState<Mantra | null>(null)

  const { data: yajna, isLoading } = useQuery({
    queryKey: ['yajna', id],
    queryFn: () => getYajna(id),
  })
  const { data: leaderboard } = useQuery({
    queryKey: ['yajna-leaderboard', id],
    queryFn: () => getYajnaLeaderboard(id),
  })
  const { data: mantras } = useQuery({ queryKey: ['mantras'], queryFn: listMantras })
  const { data: myParticipation } = useQuery({
    queryKey: ['yajna-participation', id, user?.id],
    queryFn: () => getMyYajnaParticipation(user!.id, id),
    enabled: !!user,
  })

  const join = useMutation({
    mutationFn: () => joinYajna(user!.id, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['yajna-participation', id] }),
  })

  if (chanting) {
    return (
      <Counter
        mantra={chanting}
        yajnaId={id}
        yajnaCompletedBefore={yajna?.completed_count}
        onBack={() => setChanting(null)}
      />
    )
  }

  if (isLoading || !yajna) return <p className="text-white/50">Loading…</p>

  const fixedMantra = yajna.mantra_id ? mantras?.find((m) => m.id === yajna.mantra_id) : null
  const pct = Math.min(100, Math.round((yajna.completed_count / yajna.target_count) * 100))

  if (picking) {
    return (
      <div>
        <div className="mb-6 flex items-center gap-3">
          <button
            onClick={() => setPicking(false)}
            className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
            aria-label="Back"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-white">Choose a mantra</h1>
        </div>
        <MantraPicker onSelect={setChanting} />
      </div>
    )
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/yajnas')}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white">{yajna.title}</h1>
          {yajna.description && <p className="text-white/60">{yajna.description}</p>}
        </div>
      </div>

      <div className="mb-6 rounded-xl border border-white/10 bg-white/[0.05] p-4">
        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-sm text-white/60">Collective progress</span>
          <span className="font-semibold text-white">
            {yajna.completed_count.toLocaleString()} / {yajna.target_count.toLocaleString()} ({pct}%)
          </span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-sacred-500" style={{ width: `${pct}%` }} />
        </div>
        {myParticipation && (
          <p className="mt-2 text-xs text-white/40">
            Your contribution: {myParticipation.contributed_count.toLocaleString()}
          </p>
        )}
      </div>

      {yajna.status === 'active' && (
        <div className="mb-6 flex gap-2">
          {!myParticipation && (
            <button
              onClick={() => join.mutate()}
              disabled={join.isPending}
              className="flex-1 rounded-xl border border-white/15 bg-white/[0.06] py-3 font-semibold text-white hover:bg-white/[0.12] disabled:opacity-40"
            >
              {join.isPending ? 'Joining…' : 'Join yajna'}
            </button>
          )}
          <button
            onClick={() => (fixedMantra ? setChanting(fixedMantra) : setPicking(true))}
            className="flex-1 rounded-xl bg-sacred-500/80 py-3 font-semibold text-white hover:bg-sacred-500"
          >
            Chant now
          </button>
        </div>
      )}

      <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold uppercase tracking-widest text-white/40">
        <Trophy className="h-4 w-4" /> Leaderboard
      </h2>
      {!leaderboard?.length ? (
        <p className="text-white/50">No contributions yet — be the first to chant.</p>
      ) : (
        <ul className="space-y-1">
          {leaderboard.map((row, i) => (
            <li
              key={row.user_id}
              className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-sm"
            >
              <span className="flex items-center gap-2 text-white/80">
                <span className="w-5 text-right tabular-nums text-white/40">{i + 1}</span>
                {row.profiles?.display_name ?? 'A chanter'}
              </span>
              <span className="tabular-nums text-white">
                {row.contributed_count.toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
