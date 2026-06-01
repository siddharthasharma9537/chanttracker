'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pause, Play, Minus, Check, X, AlertCircle } from 'lucide-react'
import { RudrakshaBead } from './RudrakshaBead'
import { useCompleteSession } from '@/hooks/useSessions'
import { useOfflineStore } from '@/store/offlineStore'

interface SessionControlsProps {
  onIncrement: () => void
  onDecrement: () => void
  onPause: () => void
  onResume: () => void
  onComplete: () => void
  onAbandon: () => void
  state: 'idle' | 'active' | 'paused' | 'completed' | 'abandoned'
  sessionId: string | null
  count: number
  target: number
  durationSecs: number
  isLoading?: boolean
  mantraColor?: string
}

export function SessionControls({
  onIncrement,
  onDecrement,
  onPause,
  onResume,
  onComplete,
  onAbandon,
  state,
  sessionId,
  count,
  target,
  durationSecs,
  isLoading,
  mantraColor = '#f97316',
}: SessionControlsProps) {
  const router = useRouter()
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { isOnline, pendingSessions } = useOfflineStore((store) => ({
    isOnline: store.isOnline,
    pendingSessions: store.pendingSessions,
  }))
  const completeSessionMutation = useCompleteSession()

  const hasPending = pendingSessions.length > 0
  const isIdle = state === 'idle'
  const isActive = state === 'active'
  const isCompleted = state === 'completed'
  const isAbandoned = state === 'abandoned'
  const isDone = count >= target

  const timeString = useMemo(() => {
    const m = Math.floor(durationSecs / 60)
    const s = durationSecs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [durationSecs])

  const statusLabel = isDone && isActive ? 'Complete!' : {
    idle: 'No session',
    active: 'Chanting',
    paused: 'Paused',
    completed: 'Completed',
    abandoned: 'Abandoned',
  }[state]

  const statusTone =
    isDone && isActive
      ? 'text-green-400'
      : state === 'active'
        ? 'text-amber-400'
        : state === 'paused'
          ? 'text-yellow-400'
          : 'text-white/50'

  const handleComplete = async () => {
    if (!sessionId) return
    try {
      setIsSubmitting(true)
      onComplete()
      await completeSessionMutation.mutateAsync({
        sessionId,
        count,
        durationSeconds: durationSecs,
      })
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to complete session:', err)
    } finally {
      setIsSubmitting(false)
      setShowEndConfirm(false)
    }
  }

  const handleAbandon = () => {
    onAbandon()
    router.push('/dashboard')
  }

  // Progress ring geometry
  const R = 46
  const C = 2 * Math.PI * R
  const progress = target > 0 ? Math.min(count / target, 1) : 0

  const secondaryBtn =
    'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border transition active:scale-95 disabled:opacity-40 disabled:active:scale-100'

  return (
    <div className="w-full">
      {/* Offline strip */}
      {!isOnline && hasPending && (
        <div className="flex items-center justify-center gap-2 bg-yellow-500/15 py-1 text-xs text-yellow-200">
          <AlertCircle className="h-3.5 w-3.5" />
          Offline — changes will sync
        </div>
      )}

      <div className="mx-auto flex w-full max-w-5xl items-center justify-between gap-2 px-3 py-2.5 sm:gap-4 sm:px-6 sm:py-3">
        {/* Left: timer + status */}
        <div className="flex min-w-[58px] flex-col items-start leading-tight sm:min-w-[80px]">
          <span className="font-mono text-base font-semibold tabular-nums text-white/85 sm:text-lg">
            {timeString}
          </span>
          <span className={`flex items-center gap-1 text-[11px] font-semibold sm:text-xs ${statusTone}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
            {statusLabel}
          </span>
        </div>

        {/* Center: decrement · bead(with ring) · pause */}
        <div className="flex items-center gap-2 sm:gap-4">
          <button
            onClick={onDecrement}
            disabled={!isActive || count === 0 || isLoading}
            className={`${secondaryBtn} border-white/15 bg-white/5 text-white hover:bg-white/10`}
            title="Decrement"
          >
            <Minus className="h-5 w-5" />
          </button>

          {/* Bead wrapped in progress ring */}
          <div className="relative h-[88px] w-[88px] shrink-0">
            <svg
              className="absolute inset-0 -rotate-90"
              viewBox="0 0 100 100"
              aria-hidden
            >
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke="rgba(255,255,255,0.12)"
                strokeWidth="4"
              />
              <circle
                cx="50"
                cy="50"
                r={R}
                fill="none"
                stroke={mantraColor}
                strokeWidth="4"
                strokeLinecap="round"
                strokeDasharray={C}
                strokeDashoffset={C * (1 - progress)}
                className="transition-[stroke-dashoffset] duration-500"
                style={{ filter: `drop-shadow(0 0 4px ${mantraColor}80)` }}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <RudrakshaBead
                onClick={onIncrement}
                disabled={isLoading || isIdle}
                color={mantraColor}
                isActive={isActive}
                size="medium"
              />
            </div>
          </div>

          <button
            onClick={isActive ? onPause : onResume}
            disabled={isIdle || isCompleted || isAbandoned || isLoading}
            className={`${secondaryBtn} border-sacred-400/30 bg-sacred-500/15 text-sacred-300 hover:bg-sacred-500/25`}
            title={isActive ? 'Pause' : 'Resume'}
          >
            {isActive ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
          </button>
        </div>

        {/* Right: complete + abandon */}
        <div className="flex min-w-[58px] items-center justify-end gap-2 sm:min-w-[80px]">
          <button
            onClick={() => setShowEndConfirm(true)}
            disabled={isIdle || isCompleted || isAbandoned || isLoading}
            className={`${secondaryBtn} border-green-400/30 bg-green-500/15 text-green-300 hover:bg-green-500/25`}
            title="Complete session"
          >
            <Check className="h-5 w-5" />
          </button>
          <button
            onClick={handleAbandon}
            disabled={isIdle || isCompleted || isAbandoned || isLoading}
            className={`${secondaryBtn} border-red-400/30 bg-red-500/15 text-red-300 hover:bg-red-500/25`}
            title="Abandon session"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* End confirmation dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <div className="mx-auto w-full max-w-sm space-y-5 rounded-t-3xl border-t border-white/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-white sm:text-xl">End session?</h3>
            <p className="text-sm text-white/80 sm:text-base">
              You&apos;ve completed{' '}
              <span className="font-semibold text-sacred-400">{count}</span> out of{' '}
              <span className="font-semibold text-sacred-400">{target}</span> chants.
              This will save your progress.
            </p>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 rounded-lg border border-white/20 bg-white/10 px-4 py-3 font-medium text-white transition hover:bg-white/20"
              >
                Continue
              </button>
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 rounded-lg border border-green-500/50 bg-green-600/80 px-4 py-3 font-medium text-white transition hover:bg-green-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save & Exit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
