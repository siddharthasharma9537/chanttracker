'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { listMantras } from '@/lib/api/mantras'
import { createYajna } from '@/lib/api/yajnas'
import { useAuth } from '@/hooks/useAuth'

export default function NewYajnaPage() {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [title, setTitle] = useState('')
  const [mantraId, setMantraId] = useState('')
  const [description, setDescription] = useState('')
  const [targetCount, setTargetCount] = useState(100000)
  const [endDate, setEndDate] = useState('')

  const { data: mantras } = useQuery({ queryKey: ['mantras'], queryFn: listMantras })

  const create = useMutation({
    mutationFn: () =>
      createYajna(user!.id, {
        title: title.trim(),
        mantra_id: mantraId || null,
        description: description.trim() || undefined,
        target_count: targetCount,
        end_date: endDate || undefined,
      }),
    onSuccess: (yajna) => {
      queryClient.invalidateQueries({ queryKey: ['yajnas'] })
      router.push(`/yajnas/${yajna.id}`)
    },
  })

  const canSubmit = title.trim().length > 0 && targetCount > 0

  return (
    <div className="max-w-xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/yajnas')}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">New global yajna</h1>
      </div>

      <label className="mb-1 block text-sm font-medium text-white">Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="e.g. Community Gayatri Yajna 2026"
        className="mb-4 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-500"
      />

      <label className="mb-1 block text-sm font-medium text-white">
        Mantra <span className="text-white/40">(optional — leave open for any mantra)</span>
      </label>
      <select
        value={mantraId}
        onChange={(e) => setMantraId(e.target.value)}
        className="mb-4 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
      >
        <option value="">Any mantra</option>
        {(mantras ?? []).map((m) => (
          <option key={m.id} value={m.id}>
            {m.name_en}
          </option>
        ))}
      </select>

      <label className="mb-1 block text-sm font-medium text-white">
        Description <span className="text-white/40">(optional)</span>
      </label>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="What is this yajna for?"
        className="mb-4 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-500"
      />

      <div className="mb-6 grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-white">Collective target</label>
          <input
            type="number"
            min={1}
            value={targetCount}
            onChange={(e) => setTargetCount(Math.max(1, Number(e.target.value)))}
            className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-right tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-white">
            End date <span className="text-white/40">(optional)</span>
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            min={new Date().toLocaleDateString('sv')}
            className="w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
          />
        </div>
      </div>

      <button
        onClick={() => create.mutate()}
        disabled={!canSubmit || create.isPending}
        className="w-full rounded-xl bg-sacred-500/80 py-3 font-semibold text-white hover:bg-sacred-500 disabled:opacity-40"
      >
        {create.isPending ? 'Creating…' : 'Start yajna'}
      </button>
      {create.error && (
        <p className="mt-3 text-sm text-red-300">{(create.error as Error).message}</p>
      )}
    </div>
  )
}
