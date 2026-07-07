'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { listGrahas, createProject } from '@/lib/api/projects'
import { useAuth } from '@/hooks/useAuth'

export default function NewProjectPage() {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const [beneficiary, setBeneficiary] = useState('')
  const [description, setDescription] = useState('')
  // graha_id -> target count; present = selected
  const [selected, setSelected] = useState<Record<number, number>>({})

  const { data: grahas } = useQuery({ queryKey: ['grahas'], queryFn: listGrahas })

  const create = useMutation({
    mutationFn: () =>
      createProject({
        userId: user!.id,
        beneficiaryName: beneficiary.trim(),
        description: description.trim() || undefined,
        grahas: Object.entries(selected).map(([id, t]) => ({
          grahaId: Number(id),
          targetCount: t,
        })),
      }),
    onSuccess: (project) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      router.push(`/projects/${project.id}`)
    },
  })

  const toggle = (id: number, defaultTarget: number) =>
    setSelected((s) => {
      const next = { ...s }
      if (id in next) delete next[id]
      else next[id] = defaultTarget
      return next
    })

  const selectAll = () => {
    if (!grahas) return
    const all: Record<number, number> = {}
    for (const g of grahas) all[g.id] = g.mantras?.default_target ?? 108
    setSelected(Object.keys(selected).length === grahas.length ? {} : all)
  }

  const canSubmit = beneficiary.trim() && Object.keys(selected).length > 0

  return (
    <div className="max-w-2xl">
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.push('/projects')}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">New project</h1>
      </div>

      <label className="mb-1 block text-sm font-medium text-white">Beneficiary</label>
      <input
        value={beneficiary}
        onChange={(e) => setBeneficiary(e.target.value)}
        placeholder="Who is this japa performed for?"
        className="mb-4 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-500"
      />

      <label className="mb-1 block text-sm font-medium text-white">
        Description <span className="text-white/40">(optional)</span>
      </label>
      <input
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Purpose, occasion, sankalpa…"
        className="mb-6 w-full rounded-xl border border-white/15 bg-white/[0.06] px-4 py-2.5 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-500"
      />

      <div className="mb-2 flex items-center justify-between">
        <label className="text-sm font-medium text-white">Grahas & targets</label>
        <button onClick={selectAll} className="text-sm text-sacred-400 hover:text-sacred-300">
          {grahas && Object.keys(selected).length === grahas.length
            ? 'Clear all'
            : 'Select all (Puranic counts)'}
        </button>
      </div>
      <div className="mb-6 space-y-2">
        {(grahas ?? []).map((g) => {
          const on = g.id in selected
          return (
            <div
              key={g.id}
              className={`flex items-center gap-3 rounded-xl border p-3 transition ${
                on ? 'border-white/25 bg-white/[0.08]' : 'border-white/10 bg-white/[0.03]'
              }`}
            >
              <input
                type="checkbox"
                checked={on}
                onChange={() => toggle(g.id, g.mantras?.default_target ?? 108)}
                className="h-4 w-4"
              />
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: g.color ?? '#f97316' }}
              />
              <span className="flex-1 font-medium text-white">{g.name}</span>
              {on && (
                <input
                  type="number"
                  min={1}
                  value={selected[g.id]}
                  onChange={(e) =>
                    setSelected((s) => ({ ...s, [g.id]: Math.max(1, Number(e.target.value)) }))
                  }
                  className="w-28 rounded-lg border border-white/15 bg-white/[0.06] px-3 py-1.5 text-right tabular-nums text-white focus:outline-none focus:ring-2 focus:ring-sacred-500"
                />
              )}
            </div>
          )
        })}
      </div>

      <button
        onClick={() => create.mutate()}
        disabled={!canSubmit || create.isPending}
        className="w-full rounded-xl bg-sacred-500/80 py-3 font-semibold text-white hover:bg-sacred-500 disabled:opacity-40"
      >
        {create.isPending ? 'Creating…' : 'Create project'}
      </button>
      {create.error && (
        <p className="mt-3 text-sm text-red-300">{(create.error as Error).message}</p>
      )}
    </div>
  )
}
