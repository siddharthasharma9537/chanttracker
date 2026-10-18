'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, RotateCcw } from 'lucide-react'
import { displayText, type Mantra } from '@/lib/api/mantras'
import { logSession } from '@/lib/api/sessions'
import { getMantraTotals } from '@/lib/api/progress'
import { useAuth } from '@/hooks/useAuth'
import { useWakeLock } from '@/hooks/useWakeLock'
import { useVoiceCounter } from '@/hooks/useVoiceCounter'
import { copy } from '@/lib/voice-count/copy'
import { forget } from '@/lib/voiceTemplates'
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
  /** project_grahas.completed_count as of opening this graha — the team's
   *  baseline before this sitting's taps. Lets a chanter picking up where
   *  someone else left off see the shared total, not just their own tally. */
  projectCompletedBefore?: number
  onBack: () => void
}

export function Counter({
  mantra,
  projectId,
  grahaId,
  target,
  projectCompletedBefore,
  onBack,
}: CounterProps) {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(false)
  const [mainCount, setMainCount] = useState(0)
  const [adhiCount, setAdhiCount] = useState(0)
  const [pratyaCount, setPratyaCount] = useState(0)
  const [malaFlash, setMalaFlash] = useState(false)
  const startedAt = useRef<number | null>(null)

  const [mode, setMode] = useState<'tap' | 'voice'>('tap')
  const [consent, setConsent] = useState(false)
  const [usedVoice, setUsedVoice] = useState(false)
  const [unsure, setUnsure] = useState(false)
  const [frozen, setFrozen] = useState(false)
  const [announcedCount, setAnnouncedCount] = useState(0)
  const mainRef = useRef(0)
  const usedVoiceRef = useRef(false)
  const snapshot = useRef<{ main: number; adhi: number; pratya: number; duration: number; voice: boolean } | null>(null)
  const written = useRef(new Set<string>())
  const lastAnnouncement = useRef(0)
  const voice = useVoiceCounter(mantra.id, event => {
    if (snapshot.current) return
    if (event.type === 'count') {
      usedVoiceRef.current = true
      setUsedVoice(true)
      incrementMain(1, true)
    }
    else setUnsure(true)
  }, () => { usedVoiceRef.current = true; setUsedVoice(true) })

  useEffect(() => {
    if (voice.state === 'denied' || voice.state === 'error') setMode('tap')
  }, [voice.state])

  useEffect(() => {
    if (!unsure) return
    const timer = setTimeout(() => setUnsure(false), 4000)
    return () => clearTimeout(timer)
  }, [unsure])

  useEffect(() => {
    const announce = () => {
      const now = Date.now()
      if (mainRef.current % MALA === 0 || now - lastAnnouncement.current >= 5000) {
        setAnnouncedCount(mainRef.current)
        lastAnnouncement.current = now
      }
    }
    announce()
    const timer = setInterval(announce, 5000)
    return () => clearInterval(timer)
  }, [mainCount])

  const chooseVoice = () => {
    setMode('voice')
    setUnsure(false)
    let allowed = false
    try { allowed = localStorage.getItem('voiceConsent:v1') === 'yes' } catch { /* Explain again. */ }
    setConsent(!allowed)
    if (allowed) void voice.start()
  }
  const chooseTap = () => { voice.stop(); setMode('tap'); setConsent(false); setUnsure(false) }

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
      const frozenCounts = snapshot.current!
      const durationSecs = frozenCounts.duration
      const entries: { mantraId: string; count: number; isMain: boolean }[] = [
        { mantraId: mantra.id, count: frozenCounts.main, isMain: true },
        ...(mantra.adhidevata ? [{ mantraId: mantra.adhidevata.id, count: frozenCounts.adhi, isMain: false }] : []),
        ...(mantra.pratyadhidevata
          ? [{ mantraId: mantra.pratyadhidevata.id, count: frozenCounts.pratya, isMain: false }]
          : []),
      ].filter((e) => e.count > 0)

      for (const e of entries) {
        if (written.current.has(e.mantraId)) continue
        await logSession({
          userId: user!.id,
          mantraId: e.mantraId,
          count: e.count,
          durationSecs,
          projectId: e.isMain ? projectId : undefined,
          grahaId: e.isMain ? grahaId : undefined,
          method: e.isMain && frozenCounts.voice ? 'voice_count' : 'tap',
        })
        written.current.add(e.mantraId)
      }
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

  const incrementMain = (delta: number, detected = false) => {
    if (saved || snapshot.current) return
    if (delta > 0 && startedAt.current === null) startedAt.current = Date.now()
    const next = Math.max(0, mainRef.current + delta)
    mainRef.current = next
    setMainCount(next)
    if (delta > 0) {
      if (next % MALA === 0) {
        vibrate([40, 30, 40, 30, 40])
        setMalaFlash(true)
        setTimeout(() => setMalaFlash(false), 1500)
      } else if (mode === 'voice' && next % 27 === 0) vibrate(12)
      else if (!detected) vibrate(12)
    }
  }
  const tapMain = () => incrementMain(1)
  const tapDeity = (set: typeof setAdhiCount) => {
    if (saved || snapshot.current) return
    if (startedAt.current === null) startedAt.current = Date.now()
    set(c => c + 1)
  }
  const finish = () => {
    if (!snapshot.current) {
      snapshot.current = {
        main: mainRef.current, adhi: adhiCount, pratya: pratyaCount,
        duration: startedAt.current === null ? 0 : Math.round((Date.now() - startedAt.current) / 1000),
        voice: usedVoiceRef.current,
      }
      setFrozen(true)
      voice.stop()
      setConsent(false)
      setUnsure(false)
    }
    save.mutate()
  }

  const totalCount = mainCount + adhiCount + pratyaCount
  const malaCount = Math.floor(mainCount / MALA)
  const beadInMala = mainCount % MALA

  /** Visible progress caption — `before` is whatever baseline applies
   *  (this chanter's personal lifetime total, or the project's shared
   *  total-so-far), so picking up where someone else left off is never
   *  a silent hover-only tooltip. */
  const progressBar = (before: number, tapped: number, goal: number, label: string) => {
    const total = before + tapped
    const pct = goal ? Math.min(100, Math.round((total / goal) * 100)) : 0
    return (
      <div className="mt-1">
        <div className="h-1 overflow-hidden rounded-full bg-white/10">
          <div className="h-full rounded-full bg-white/40" style={{ width: `${pct}%` }} />
        </div>
        <p className="mt-0.5 text-[11px] tabular-nums text-white/40">
          {total.toLocaleString()} / {goal.toLocaleString()} {label} ({pct}%)
        </p>
      </div>
    )
  }
  const lifetimeBar = (mantraId: string, tapped: number, goal: number) =>
    progressBar(totals?.[mantraId] ?? 0, tapped, goal, 'lifetime')

  const deityPanel = (label: string, emoji: string, m: Mantra | undefined, tapped: number, onTap: () => void) =>
    m && (
      <button
        onClick={saved || frozen ? undefined : onTap}
        disabled={saved || frozen}
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
    <div className={`flex flex-col gap-3 [&_button]:focus-visible:outline [&_button]:focus-visible:outline-2 [&_button]:focus-visible:outline-sacred-400 ${mode === 'voice' ? 'min-h-[calc(100vh-9rem)] lg:min-h-[calc(100vh-7rem)]' : 'h-[calc(100vh-9rem)] lg:h-[calc(100vh-7rem)]'}`}>
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
      {projectId
        ? progressBar(projectCompletedBefore ?? 0, mainCount, mainGoal, 'project total')
        : lifetimeBar(mantra.id, mainCount, mainGoal)}

      <div className="flex shrink-0 gap-2" role="group" aria-label={copy.title.en}>
        <button disabled={saved || frozen} aria-pressed={mode === 'tap'} onClick={chooseTap}
          className={`rounded-lg border px-4 py-2 ${mode === 'tap' ? 'border-sacred-400 bg-sacred-500/20' : 'border-white/15'}`}>{copy.tap.en}</button>
        <button disabled={saved || frozen} aria-pressed={mode === 'voice'} onClick={chooseVoice}
          className={`rounded-lg border px-4 py-2 ${mode === 'voice' ? 'border-sacred-400 bg-sacred-500/20' : 'border-white/15'}`}>{copy.voice.en}</button>
      </div>
      <div aria-live="polite" className="sr-only">{announcedCount}</div>
      {mode === 'voice' && !frozen && !saved && (
        <div className="shrink-0 rounded-xl border border-white/15 bg-white/[0.04] p-3 text-sm">
          {consent ? <>
            <h2 className="font-semibold">{copy.title.en}</h2>
            <p className="mt-2 text-white/70">{copy.body.en}</p>
            <div className="mt-3 flex flex-wrap gap-3">
              <button className="rounded-lg bg-sacred-500/80 px-3 py-2" onClick={() => {
                setConsent(false)
                try { localStorage.setItem('voiceConsent:v1', 'yes') } catch { /* Explain again next time. */ }
                void voice.start()
              }}>{copy.allow.en}</button>
              <button className="rounded-lg border border-white/15 px-3 py-2" onClick={chooseTap}>{copy.instead.en}</button>
            </div>
          </> : <>
            {voice.state === 'calibrating' && <>
              <p>{copy.calibration.en}</p>
              <p className="mt-2 text-sacred-300">● {copy.listening.en}</p>
              <div className="mt-2 flex flex-wrap gap-3">
                <button className="rounded-lg border border-white/15 px-3 py-2" onClick={voice.done}>{copy.done.en}</button>
                <button className="rounded-lg border border-white/15 px-3 py-2" onClick={voice.addSample} disabled={voice.sampleCount >= 2}>{copy.another.en}</button>
                <button className="rounded-lg border border-white/15 px-3 py-2" onClick={chooseTap}>{copy.cancel.en}</button>
              </div>
            </>}
            {voice.state === 'listening' && <div className="flex items-center justify-between gap-2">
              <p className="text-sacred-300">● {copy.listening.en}</p>
              <button className="rounded-lg border border-white/15 px-3 py-2" onClick={() => voice.stop()}>{copy.stop.en}</button>
            </div>}
            {voice.state === 'paused-hidden' && <p>{copy.paused.en}</p>}
            {(voice.state === 'idle' || voice.state === 'paused-hidden') && <button className="mt-2 rounded-lg border border-white/15 px-3 py-2" onClick={() => void voice.start()}>{copy.resume.en}</button>}
            {voice.state === 'requesting' && <button className="rounded-lg border border-white/15 px-3 py-2" onClick={chooseTap}>{copy.cancel.en}</button>}
          </>}
        </div>
      )}
      {voice.message && <p role="status" className="text-sm text-amber-200">{voice.message}</p>}
      {unsure && !frozen && <p className="text-sm text-amber-200">{copy.unsure.en}</p>}
      {(mode === 'voice' || usedVoice) && <div className="flex shrink-0 gap-3">
        <button className="rounded-lg border border-white/15 px-5 py-2" disabled={saved || frozen || mainCount === 0} onClick={() => incrementMain(-1)}>{copy.minus.en}</button>
        <button className="rounded-lg border border-white/15 px-5 py-2" disabled={saved || frozen} onClick={tapMain}>{copy.plus.en}</button>
      </div>}
      <button className="self-start rounded text-xs text-white/50 underline" disabled={saved || frozen} onClick={() => { forget(mantra.id); chooseTap() }}>{copy.forget.en}</button>

      {/* Main tap area */}
      <button
        onClick={tapMain}
        style={mode === 'voice' ? { minHeight: 192 } : undefined}
        disabled={saved || frozen}
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
            () => tapDeity(setAdhiCount)
          )}
          {deityPanel(
            mantra.pratyadhidevata?.name_en ?? 'Pratyadhidevata',
            '⚔️',
            mantra.pratyadhidevata,
            pratyaCount,
            () => tapDeity(setPratyaCount)
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
                mainRef.current = 0
                startedAt.current = null
                usedVoiceRef.current = false
                setUsedVoice(false)
                voice.reset()
                setUnsure(false)
                setMainCount(0)
                setAdhiCount(0)
                setPratyaCount(0)
              }}
              disabled={frozen || (totalCount === 0 && !usedVoice)}
              className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-white/70 hover:bg-white/10 disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              onClick={finish}
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
