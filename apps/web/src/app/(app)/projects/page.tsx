'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, KeyRound } from 'lucide-react'
import { listMyProjects, joinProject } from '@/lib/api/projects'
import { useAuth } from '@/hooks/useAuth'

export default function ProjectsPage() {
  const router = useRouter()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [code, setCode] = useState('')

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => listMyProjects(user!.id),
    enabled: !!user,
  })

  const join = useMutation({
    mutationFn: () => joinProject(code),
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      router.push(`/projects/${projectId}`)
    },
  })

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-white">Projects</h1>
        <button
          onClick={() => router.push('/projects/new')}
          className="flex items-center gap-2 rounded-xl bg-sacred-500/80 px-4 py-2 font-semibold text-white hover:bg-sacred-500"
        >
          <Plus className="h-4 w-4" /> New project
        </button>
      </div>

      {/* Join by invite code */}
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (code.trim()) join.mutate()
        }}
        className="mb-8 flex max-w-md gap-2"
      >
        <div className="relative flex-1">
          <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-white/40" />
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Invite code (e.g. A1B2C3)"
            maxLength={6}
            className="w-full rounded-xl border border-white/15 bg-white/[0.06] py-2 pl-9 pr-3 font-mono tracking-widest text-white placeholder:font-sans placeholder:tracking-normal placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-sacred-500"
          />
        </div>
        <button
          type="submit"
          disabled={code.trim().length < 6 || join.isPending}
          className="rounded-xl border border-white/15 px-4 py-2 text-white/80 hover:bg-white/10 disabled:opacity-40"
        >
          {join.isPending ? 'Joining…' : 'Join'}
        </button>
      </form>
      {join.error && (
        <p className="-mt-4 mb-6 text-sm text-red-300">{(join.error as Error).message}</p>
      )}

      {isLoading ? (
        <p className="text-white/50">Loading…</p>
      ) : !projects?.length ? (
        <p className="text-white/50">
          No projects yet. Create one to organize shared chanting, or join with an
          invite code from an organizer.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {projects.map((p) => {
            const target = p.project_grahas.reduce((s, g) => s + g.target_count, 0)
            const done = p.project_grahas.reduce((s, g) => s + g.completed_count, 0)
            const pct = target ? Math.min(100, Math.round((done / target) * 100)) : 0
            return (
              <button
                key={p.id}
                onClick={() => router.push(`/projects/${p.id}`)}
                className="rounded-xl border border-white/10 bg-white/[0.05] p-4 text-left transition hover:bg-white/[0.10]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate font-semibold text-white">
                    {p.beneficiary_name}
                  </span>
                  <span className="shrink-0 rounded bg-white/10 px-2 py-0.5 text-[10px] uppercase tracking-wide text-white/60">
                    {p.my_role}
                  </span>
                </div>
                {p.description && (
                  <p className="mt-1 truncate text-sm text-white/50">{p.description}</p>
                )}
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-sacred-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className="mt-1 text-xs tabular-nums text-white/50">
                  {done.toLocaleString()} / {target.toLocaleString()} ({pct}%)
                </p>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
