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
import { startChantRecording, type ChantRecorder } from '@/lib/chant-analysis/recorder'
import { RemoteChantAnalyzer } from '@/lib/chant-analysis/remote-analyzer'
import { analyzeAndDecideRepetition } from '@/lib/chant-analysis/pipeline'
import type { JevDecision } from '@/lib/jev/types'

const MALA = 108
const vibrate = (pattern: number | number[]) => navigator.vibrate?.(pattern)
const TELUGU = '"Noto Sans Telugu", sans-serif'
const DEVANAGARI = '"Noto Sans Devanagari", serif'

interface CounterProps {
  mantra: Mantra
  projectId?: string
  grahaId?: number
  target?: number
  projectCompletedBefore?: number
  onBack: () => void
}

export function Counter({ mantra, projectId, grahaId, target, projectCompletedBefore, onBack }: CounterProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [mainCount, setMainCount] = useState(0)
  const [adhiCount, setAdhiCount] = useState(0)
  const [pratyaCount, setPratyaCount] = useState(0)
  const [malaFlash, setMalaFlash] = useState(false)
  const [isRecording, setIsRecording] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [chantDecision, setChantDecision] = useState<JevDecision | null>(null)
  const [chantError, setChantError] = useState<string | null>(null)
  const recorderRef = useRef<ChantRecorder | null>(null)
  const recentDecisions = useRef<JevDecision[]>([])
  const startedAt = useRef<number | null>(null)
  const analyzer = useMemo(() => new RemoteChantAnalyzer(), [])

  useWakeLock(!saved)

  const mainGoal = target ?? mantra.default_target
  const mainText = displayText(mantra)
  const font = mainText.match(/[ఀ-౿]/) ? TELUGU : DEVANAGARI

  useEffect(() => () => recorderRef.current?.cancel(), [])

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
      const durationSecs = startedAt.current ? Math.round((Date.now() - startedAt.current) / 1000) : 0
      const entries: { mantraId: string; count: number; isMain: boolean }[] = [
        { mantraId: mantra.id, count: mainCount, isMain: true },
        ...(mantra.adhidevata ? [{ mantraId: mantra.adhidevata.id, count: adhiCount, isMain: false }] : []),
        ...(mantra.pratyadhidevata ? [{ mantraId: mantra.pratyadhidevata.id, count: pratyaCount, isMain: false }] : []),
      ].filter((e) => e.count > 0)
      await Promise.all(entries.map((e) => logSession({
        userId: user!.id, mantraId: e.mantraId, count: e.count, durationSecs,
        projectId: e.isMain ? projectId : undefined, grahaId: e.isMain ? grahaId : undefined,
      })))
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['streak'] })
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      queryClient.invalidateQueries({ queryKey: ['mantra-progress'] })
      if (projectId) queryClient.invalidateQueries({ queryKey: ['project-contributions', projectId] })
      setSaved(true)
    },
  })

  useEffect(() => {
    if (!saved) return
    const t = setTimeout(onBack, 2500)
    return () => clearTimeout(t)
  }, [saved, onBack])

  const acceptMainCount = () => {
    if (startedAt.current === null) startedAt.current = Date.now()
    setMainCount((c) => {
      const next = c + 1
      if (next % MALA === 0) {
        vibrate([40, 30, 40, 30, 40])
        setMalaFlash(true)
        setTimeout(() => setMalaFlash(false), 1500)
      } else vibrate(12)
      return next
    })
  }

  const tapMain = async () => {
    if (saved || isAnalyzing) return
    setChantError(null)
    if (!isRecording) {
      try {
        recorderRef.current = await startChantRecording()
        setChantDecision(null)
        setIsRecording(true)
      } catch (error) {
        setChantError(error instanceof Error ? error.message : 'Unable to start microphone')
      }
      return
    }

    const recorder = recorderRef.current
    recorderRef.current = null
    setIsRecording(false)
    if (!recorder) return
    setIsAnalyzing(true)
    try {
      const recording = await recorder.stop()
      const window = recentDecisions.current.slice(-10)
      const recentMistakes = window.filter((d) => d !== 'ACCEPT').length
      const result = await analyzeAndDecideRepetition({
        analyzer,
        audio: recording.audio,
        mantraId: mantra.id,
        expectedText: mainText,
        currentCount: mainCount,
        recentMistakes,
        recentWindow: window.length,
      })
      recentDecisions.current = [...window, result.decision].slice(-10)
      setChantDecision(result.decision)
      if (result.decision === 'ACCEPT') acceptMainCount()
      else vibrate([25, 35, 25])
    } catch (error) {
      // Fail closed: an analyzer/Jev/network failure must never silently add a japa.
      setChantError(error instanceof Error ? error.message : 'Chant verification failed')
    } finally {
      setIsAnalyzing(false)
    }
  }

  const totalCount = mainCount + adhiCount + pratyaCount
  const malaCount = Math.floor(mainCount / MALA)
  const beadInMala = mainCount % MALA

  const progressBar = (before: number, tapped: number, goal: number, label: string) => {
    const total = before + tapped
    const pct = goal ? Math.min(100, Math.round((total / goal) * 100)) : 0
    return <div className="mt-1"><div className="h-1 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-white/40" style={{ width: `${pct}%` }} /></div><p className="mt-0.5 text-[11px] tabular-nums text-white/40">{total.toLocaleString()} / {goal.toLocaleString()} {label} ({pct}%)</p></div>
  }
  const lifetimeBar = (mantraId: string, tapped: number, goal: number) => progressBar(totals?.[mantraId] ?? 0, tapped, goal, 'lifetime')

  const deityPanel = (label: string, emoji: string, m: Mantra | undefined, tapped: number, onTap: () => void) => m && (
    <button onClick={saved ? undefined : onTap} disabled={saved} className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.08] active:scale-[0.98] disabled:cursor-default disabled:active:scale-100">
      <div className="flex shrink-0 items-baseline justify-between gap-1"><span className="truncate text-[10px] font-semibold uppercase tracking-widest text-amber-300/80">{emoji} {label}</span><span className="shrink-0 text-xs font-bold tabular-nums text-white/70">{tapped}</span></div>
      {lifetimeBar(m.id, tapped, m.default_target)}
      <div className="mt-1.5 min-h-0 flex-1"><FitText text={displayText(m)} max={26} min={11} lineHeight={1.45} fontFamily={TELUGU} style={{ color: 'rgba(255,255,255,0.82)' }} /></div>
    </button>
  )

  const statusText = isRecording ? 'recording… tap when the mantra is complete' : isAnalyzing ? 'checking pronunciation & svara…' : chantDecision === 'ACCEPT' ? '✓ accepted — count added' : chantDecision === 'REPEAT' ? 'repeat this count' : chantDecision === 'CORRECT' ? 'correction needed — count not added' : chantDecision === 'VERIFY' ? 'verification required — count not added' : mainCount === 0 ? 'tap to start chanting' : `${malaCount} mala${malaCount === 1 ? '' : 's'} · ${beadInMala} / 108`

  return (
    <div className="flex h-[calc(100vh-9rem)] flex-col gap-3 lg:h-[calc(100vh-7rem)]">
      <div className="flex shrink-0 items-center gap-3"><button onClick={onBack} className="rounded-lg p-2 text-white/60 hover:bg-white/10 hover:text-white" aria-label="Back"><ArrowLeft className="h-5 w-5" /></button><span className="min-w-0 flex-1 truncate font-semibold text-white">{mantra.name_en}</span><span className="text-2xl font-bold tabular-nums" style={{ color: mantra.accent_color ?? '#f97316' }}>{mainCount}<span className="text-sm text-white/40"> / {mainGoal.toLocaleString()}</span></span></div>
      {projectId ? progressBar(projectCompletedBefore ?? 0, mainCount, mainGoal, 'project total') : lifetimeBar(mantra.id, mainCount, mainGoal)}

      <button onClick={tapMain} disabled={saved || isAnalyzing} className="group flex min-h-0 flex-1 flex-col rounded-2xl border border-white/15 bg-white/[0.07] p-4 text-left transition hover:bg-white/[0.10] active:scale-[0.995] active:bg-white/[0.13] disabled:opacity-60">
        <div className="min-h-0 flex-1"><FitText text={mainText} max={56} min={16} lineHeight={1.5} fontFamily={font} style={{ color: 'rgba(255,255,255,0.95)', fontWeight: 500 }} /></div>
        {!saved && <span className={`mt-1 shrink-0 text-center text-[10px] uppercase tracking-widest transition-colors ${malaFlash ? 'font-semibold text-sacred-400' : isRecording ? 'font-semibold text-red-300' : 'text-white/30 group-hover:text-white/50'}`}>{malaFlash ? `🪷 mala ${malaCount} complete` : statusText}</span>}
      </button>
      {chantError && <p className="shrink-0 text-center text-xs text-red-300">{chantError} — count not added</p>}

      {(mantra.adhidevata || mantra.pratyadhidevata) && <div className="grid shrink-0 basis-1/4 grid-cols-2 gap-3">
        {deityPanel(mantra.adhidevata?.name_en ?? 'Adhidevata', '✨', mantra.adhidevata, adhiCount, () => setAdhiCount((c) => c + 1))}
        {deityPanel(mantra.pratyadhidevata?.name_en ?? 'Pratyadhidevata', '⚔️', mantra.pratyadhidevata, pratyaCount, () => setPratyaCount((c) => c + 1))}
      </div>}

      <div className="flex shrink-0 gap-3">{saved ? <p className="flex-1 rounded-xl border border-green-400/30 bg-green-500/10 py-3 text-center font-semibold text-green-300">Session saved — {totalCount} japas 🙏</p> : <><button onClick={() => { recorderRef.current?.cancel(); recorderRef.current = null; setIsRecording(false); setMainCount(0); setAdhiCount(0); setPratyaCount(0); setChantDecision(null); recentDecisions.current = [] }} disabled={totalCount === 0 && !isRecording} className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-white/70 hover:bg-white/10 disabled:opacity-40"><RotateCcw className="h-4 w-4" /> Reset</button><button onClick={() => save.mutate()} disabled={totalCount === 0 || save.isPending || isRecording || isAnalyzing} className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-sacred-500/80 py-3 font-semibold text-white hover:bg-sacred-500 disabled:opacity-40"><Check className="h-5 w-5" />{save.isPending ? 'Saving…' : 'Finish session'}</button></>}</div>
      {save.error && <p className="shrink-0 text-sm text-red-300">{(save.error as Error).message}</p>}
    </div>
  )
}
