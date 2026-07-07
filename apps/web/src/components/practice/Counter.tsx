'use client'

import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft, Check, RotateCcw } from 'lucide-react'
import { displayText, type Mantra } from '@/lib/api/mantras'
import { logSession } from '@/lib/api/sessions'
import { useAuth } from '@/hooks/useAuth'
import { FitText } from './FitText'

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
  const [count, setCount] = useState(0)
  const [saved, setSaved] = useState(false)
  const startedAt = useRef<number | null>(null)

  const goal = target ?? mantra.default_target
  const mainText = displayText(mantra)
  const font = mainText.match(/[ఀ-౿]/) ? TELUGU : DEVANAGARI

  const save = useMutation({
    mutationFn: () =>
      logSession({
        userId: user!.id,
        mantraId: mantra.id,
        count,
        durationSecs: startedAt.current
          ? Math.round((Date.now() - startedAt.current) / 1000)
          : 0,
        projectId,
        grahaId,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      queryClient.invalidateQueries({ queryKey: ['streak'] })
      queryClient.invalidateQueries({ queryKey: ['achievements'] })
      setSaved(true)
    },
  })

  const tap = () => {
    if (saved) return
    if (startedAt.current === null) startedAt.current = Date.now()
    setCount((c) => c + 1)
  }

  const deityPanel = (label: string, emoji: string, m?: Mantra) =>
    m && (
      <div className="flex min-h-0 flex-col rounded-xl border border-white/10 bg-white/[0.04] p-3">
        <span className="shrink-0 truncate text-[10px] font-semibold uppercase tracking-widest text-amber-300/80">
          {emoji} {label}
        </span>
        <div className="mt-1 min-h-0 flex-1">
          <FitText
            text={displayText(m)}
            max={26}
            min={11}
            lineHeight={1.45}
            fontFamily={TELUGU}
            style={{ color: 'rgba(255,255,255,0.82)' }}
          />
        </div>
      </div>
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
          {count}
          <span className="text-sm text-white/40"> / {goal.toLocaleString()}</span>
        </span>
      </div>

      {/* Main tap area */}
      <button
        onClick={tap}
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
          <span className="mt-1 shrink-0 text-center text-[10px] uppercase tracking-widest text-white/30 group-hover:text-white/50">
            tap anywhere to count
          </span>
        )}
      </button>

      {/* Deity panels */}
      {(mantra.adhidevata || mantra.pratyadhidevata) && (
        <div className="grid shrink-0 basis-1/4 grid-cols-2 gap-3">
          {deityPanel(mantra.adhidevata?.name_en ?? 'Adhidevata', '✨', mantra.adhidevata)}
          {deityPanel(
            mantra.pratyadhidevata?.name_en ?? 'Pratyadhidevata',
            '⚔️',
            mantra.pratyadhidevata
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex shrink-0 gap-3">
        {saved ? (
          <p className="flex-1 rounded-xl border border-green-400/30 bg-green-500/10 py-3 text-center font-semibold text-green-300">
            Session saved — {count} japas 🙏
          </p>
        ) : (
          <>
            <button
              onClick={() => setCount(0)}
              disabled={count === 0}
              className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-3 text-white/70 hover:bg-white/10 disabled:opacity-40"
            >
              <RotateCcw className="h-4 w-4" /> Reset
            </button>
            <button
              onClick={() => save.mutate()}
              disabled={count === 0 || save.isPending}
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
