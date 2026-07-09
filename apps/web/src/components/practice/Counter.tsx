'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, RotateCcw } from 'lucide-react'
import { displayText, type Mantra } from '@/lib/api/mantras'
import { logSession } from '@/lib/api/sessions'
import { getMantraTotals } from '@/lib/api/progress'
import { useAuth } from '@/hooks/useAuth'
import { useWakeLock } from '@/hooks/useWakeLock'
import { FitText } from './FitText'

const MALA = 108
/** Short tap pulse vs. a longer 3-pulse buzz on completing a mala. */
const vibrate = (pattern: number | number[]) => navigator.vibrate?.(pattern)

const TELUGU = '"Noto Sans Telugu", sans-serif'
const DEVANAGARI = '"Noto Sans Devanagari", serif'

interface CounterProps {
  mantra: Mantra
  /** Set for project chanting so the session rolls into project progress. */
  projectId?: string
  grahaId?: number
  target?: number
  onBack: () => void
}

export function Counter({ mantra, projectId, grahaId, target, onBack }: CounterProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [mainCount, setMainCount] = useState(0)
  const [adhiCount, setAdhiCount] = useState(0)
  const [pratyaCount, setPratyaCount] = useState(0)
  const [malaFlash, setMalaFlash] = useState(false)
  const startedAt = useRef<number | null>(null)

  useWakeLock(!saved)

  const mainGoal = target ?? mantra.default_target
  const mainText = displayText(mantra)
  const font = mainText.match(/[ఀ-౿]/) ? TELUGU : DEVANAGARI

  const progressIds = useMemo(
    () => [mantra.id, mantra.adhidevata?.id, mantra.pratyadhidevata?.id].filter(Boolean) as string[],
    [mantra.id, mantra.adhidevata?.id, mantra.pratyadhidevata?.id]
  )
  const { data: totals } = useQuery({
    queryKey: ['mantra-progress', user?.id, progressIds],
    queryFn: () => getMantraTotals(user!.id, progressIds),
    enabled: !!user,
  })

  const save = useMutation({
    mutationFn: async () => {
      const durationSecs = startedAt.current
        ? Math.round((Date.now() - startedAt.current) / 1000)
        : 0
      const entries: { mantraId: string; count: number; isMain: boolean }[] = [
        { mantraId: mantra.id, count: mainCount, isMain: true },
        ...(mantra.adhidevata ? [{ mantraId: mantra.adhidevata.id, count: adhiCount, isMain: false }] : []),
        ...(mantra.pratyadhidevata
          ? [{ mantraId: mantra.pratyadhidevata.id, count: pratyaCount, isMain: false }]
          : []),
      ].filter((e) => e.count > 0)

      await Promise.all(
        entries.map((e) =>
          logSession({
            userId: user!.id,
            mantraId: e.mantraId,
            count: e.count,
            durationSecs,
            // Deity sadhana is personal — only the graha's own session
            // rolls into a project's shared target.
            projectId: e.isMain ? projectId : undefined,
            grahaId: e.isMain ? grahaId : undefined,
          })
        )
      )
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['streak'] })
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      queryClient.invalidateQueries({ queryKey: ['mantra-progress'] })
      if (projectId) {
        queryClient.invalidateQueries({ queryKey: ['project-contributions', projectId] })
      }
      setSaved(true)
    },
  })

  // After the "Session saved" confirmation, return to the picker on its own.
  useEffect(() => {
    if (!saved) return
    const t = setTimeout(onBack, 2500)
    return () => clearTimeout(t)
  }, [saved, onBack])

  const tapMain = () => {
    if (saved) return
    if (startedAt.current === null) startedAt.current = Date.now()
    setMainCount((c) => {
      const next = c + 1
      if (next % MALA === 0) {
        vibrate([40, 30, 40, 30, 40])
        setMalaFlash(true)
        setTimeout(() => setMalaFlash(false), 1500)
      } else {
        vibrate(12)
      }
      return next
    })
  }

  const totalCount = mainCount + adhiCount + pratyaCount
  const malaCount = Math.floor(mainCount / MALA)
  const beadInMala = mainCount % MALA

  const lifetimeBar = (mantraId: string, tapped: number, goal: number) => {
    const before = totals?.[mantraId] ?? 0
    const pct = goal ? Math.min(100, Math.round(((before + tapped) / goal) * 100)) : 0
    return (
      <div className="mt-1 h-1 overflow-hidden rounded-full bg-white/10">
        <div
          className="h-full rounded-full bg-white/40"
          style={{ width: `${pct}%` }}
          title={`${(before + tapped).toLocaleString()} / ${goal.toLocaleString()} lifetime`}
        />
      </div>
    )
  }

  const deityPanel = (label: string, emoji: string, m: Mantra | undefined, tapped: number, onTap: () => void) =>
    m && (
      <button
        onClick={saved ? undefined : onTap}
        disabled={saved}
        className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.08] active:scale-[0.98] disabled:cursor-default disabled:active:scale-100"
      >
        <div className="flex shrink-0 items-baseline justify-between gap-1">
          <span className="truncate text-[10px] font-semibold uppercase tracking-widest text-amber-300/80">
            {emoji} {label}
          </span>
          <span className="shrink-0 text-xs font-bold tabular-nums text-white/70">{tapped}</span>
        </div>
        {lifetimeBar(m.id, tapped, m.default_target)}
        <div className="mt-1.5 min-h-0 flex-1">
          <FitText
            text={displayText(m)}
            max={26}
            min={11}
            lineHeight={1.45}
            fontFamily={TELUGU}
            style={{ color: 'rgba(255,255,255,0.82)' }}
          />
        </div>
      </button>
    )

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-3 lg:h-[calc(100vh-7rem)]">
      {/* Top bar */}
      <div className="flex shrink-0 items-center gap-3">
        <button
          onClick={onBack}
          className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <span className="min-w-0 flex-1 truncate font-semibold text-white">
          {mantra.name_en}
        </span>
        <span
          className="text-2xl font-bold tabular-nums"
          style={{ color: mantra.accent_color ?? '#f97316' }}
        >
          {mainCount}
          <span className="text-sm text-white/40"> / {mainGoal.toLocaleString()}</span>
        </span>
      </div>
      {lifetimeBar(mantra.id, mainCount, mainGoal)}

      {/* Main tap area */}
      <button
        onClick={tapMain}
        disabled={saved}
        className="group flex min-h-0 flex-1 flex-col rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-left transition hover:bg-white/[0.10] active:scale-[0.995] active:bg-white/[0.13] disabled:opacity-60"
      >
        <div className="min-h-0 flex-1">
          <FitText
            text={mainText}
            max={56}
            min={16}
            lineHeight={1.5}
            fontFamily={font}
            style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }}
          />
        </div>
        {!saved && (
          <span
            className={`mt-1 shrink-0 text-center text-[10px] uppercase tracking-widest transition-colors ${
              malaFlash ? 'font-semibold text-sacred-400' : 'text-white/30 group-hover:text-white/50'
            }`}
          >
            {malaFlash
              ? `🪷 mala ${malaCount} complete`
              : mainCount === 0
                ? 'tap anywhere to count'
                : `${malaCount} mala${malaCount === 1 ? '' : 's'} · ${beadInMala} / 108`}
          </span>
        )}
      </button>

      {/* Deity panels — each is its own tap target with its own lifetime goal */}
      {(mantra.adhidevata || mantra.pratyadhidevata) && (
        <div className="grid shrink-0 basis-1/4 grid-cols-2 gap-3">
          {deityPanel(
            mantra.adhidevata?.name_en ?? 'Adhidevata',
            '✨',
            mantra.adhidevata,
            adhiCount,
            () => setAdhiCount((c) => c + 1)
          )}
          {deityPanel(
            mantra.pratyadhidevata?.name_en ?? 'Pratyadhidevata',
            '⚔️',
            mantra.pratyadhidevata,
            pratyaCount,
            () => setPratyaCount((c) => c + 1)
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex shrink-0 gap-3">
        {saved ? (
          <p className="flex-1 rounded-xl border border-green-400/30 bg-green-500/10 py-3 text-center font-semibold text-green-300">
            Session saved — {totalCount} japas 🙏
          </p>
        ) : (
          <>
            <button
              onClick={() => {
                setMainCount(0)
                setAdhiCount(0)
                setPratyaCount(0)
              }}
              disabled={totalCount === 0}
              className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-white/70 hover:bg-white/10 disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              onClick={() => save.mutate()}
              disabled={totalCount === 0 || save.isPending}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sacred-500/80 py-3 font-semibold text-white hover:bg-sacred-500 disabled:opacity-40"
            >
              <Check className="h-5 w-5" />
              {save.isPending ? 'Saving…' : 'Finish session'}
            </button>
          </>
        )}
      </div>
      {save.error && (
        <p className="shrink-0 text-sm text-red-300">{(save.error as Error).message}</p>
      )}
    </div>
  )
}
