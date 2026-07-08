'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Copy, Check, Play, KeyRound, Link as LinkIcon } from 'lucide-react'
import { getProject, type ProjectGrahaWithGraha } from '@/lib/api/projects'
import { listMantras } from '@/lib/api/mantras'
import { Counter } from '@/components/practice/Counter'
import { useAuth } from '@/hooks/useAuth'

function ShareRow({
  icon: Icon,
  label,
  hint,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  hint: string
  value: string
  mono?: boolean
}) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      // Clipboard permission denied — nothing to recover; value is still selectable.
    }
  }
  return (
    <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-3">
      <Icon className="h-4 w-4 shrink-0 text-white/40" />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-white/50">{label}</p>
        <p
          className={`truncate text-sm text-white ${mono ? 'font-mono font-semibold tracking-widest' : ''}`}
          title={value}
        >
          {value}
        </p>
        <p className="mt-0.5 truncate text-xs text-white/40">{hint}</p>
      </div>
      <button
        onClick={copy}
        className="flex shrink-0 items-center gap-1.5 rounded-lg border border-white/15 px-3 py-1.5 text-xs font-medium text-white/80 hover:bg-white/10"
      >
        {copied ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-400" /> Copied
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" /> Copy
          </>
        )}
      </button>
    </div>
  )
}

export default function ProjectPage() {
  const { id } = useParams<{ id: string }>()
  const router = useRouter()
  const { user } = useAuth()
  const [chanting, setChanting] = useState<ProjectGrahaWithGraha | null>(null)

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['projects', id],
    queryFn: () => getProject(id, user!.id),
    enabled: !!user && !!id,
  })
  // Same cached catalog Practice uses — includes texts + deity sub-mantras
  const { data: mantras } = useQuery({ queryKey: ['mantras'], queryFn: listMantras })

  if (isLoading) return <p className="text-white/50">Loading…</p>
  if (error || !project)
    return <p className="text-red-300">Could not load project: {(error as Error)?.message}</p>

  // ---- Chanting mode: reuse the exact Practice counter ----
  if (chanting) {
    const mantra = mantras?.find((m) => m.id === chanting.grahas?.mantra_id)
    if (!mantra) return <p className="text-white/50">Loading mantra…</p>
    return (
      <Counter
        mantra={mantra}
        projectId={project.id}
        grahaId={chanting.graha_id}
        target={chanting.target_count}
        onBack={() => setChanting(null)}
      />
    )
  }

  const target = project.project_grahas.reduce((s, g) => s + g.target_count, 0)
  const done = project.project_grahas.reduce((s, g) => s + g.completed_count, 0)
  const pct = target ? Math.min(100, Math.round((done / target) * 100)) : 0

  return (
    <div className="max-w-3xl">
      <div className="mb-1 flex items-center gap-3">
        <button
          onClick={() => router.push('/projects')}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <h1 className="min-w-0 flex-1 truncate text-2xl font-bold text-white">
          {project.beneficiary_name}
        </h1>
        <span className="rounded bg-white/10 px-2 py-1 text-[10px] uppercase tracking-wide text-white/60">
          {project.my_role}
        </span>
      </div>
      {project.description && (
        <p className="mb-4 ml-12 text-white/60">{project.description}</p>
      )}

      {/* Overall progress */}
      <div className="mb-6 ml-12">
        <div className="h-2.5 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-sacred-500" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-1 text-sm tabular-nums text-white/60">
          {done.toLocaleString()} / {target.toLocaleString()} japas ({pct}%)
        </p>
      </div>

      {/* Organizer: codes */}
      {project.my_role === 'organizer' && (
        <div className="mb-6 space-y-2">
          <ShareRow
            icon={KeyRound}
            label="Chanter invite code"
            hint="Share with a priest so they can join and chant"
            value={project.invite_code}
            mono
          />
          <ShareRow
            icon={LinkIcon}
            label="Beneficiary link"
            hint="Share so they can watch progress — no account needed"
            value={`${typeof window !== 'undefined' ? window.location.origin : ''}/view/${project.share_code}`}
          />
        </div>
      )}

      {/* Per-graha progress + chant */}
      <div className="space-y-2">
        {project.project_grahas.map((g) => {
          const gp = g.target_count
            ? Math.min(100, Math.round((g.completed_count / g.target_count) * 100))
            : 0
          const complete = g.completed_count >= g.target_count
          return (
            <div
              key={g.id}
              className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.05] p-3"
            >
              <span
                className="h-3 w-3 shrink-0 rounded-full"
                style={{ backgroundColor: g.grahas?.color ?? '#f97316' }}
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="font-medium text-white">{g.grahas?.name}</span>
                  <span className="text-xs tabular-nums text-white/50">
                    {g.completed_count.toLocaleString()} / {g.target_count.toLocaleString()}
                  </span>
                </div>
                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${gp}%`,
                      backgroundColor: g.grahas?.color ?? '#f97316',
                    }}
                  />
                </div>
              </div>
              {complete ? (
                <span className="shrink-0 text-xs font-semibold text-green-400">✓ Done</span>
              ) : (
                <button
                  onClick={() => setChanting(g)}
                  className="flex shrink-0 items-center gap-1.5 rounded-lg bg-sacred-500/80 px-3 py-1.5 text-sm font-semibold text-white hover:bg-sacred-500"
                >
                  <Play className="h-3.5 w-3.5" /> Chant
                </button>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
