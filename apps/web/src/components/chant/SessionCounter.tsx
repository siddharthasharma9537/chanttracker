'use client'

import { useState, useEffect, useMemo } from 'react'
import { Pause, Play, Minus, Check, X } from 'lucide-react'
import { RudrakshaBead } from './RudrakshaBead'
import { useOfflineStore } from '@/store/offlineStore'

interface SessionCounterProps {
  grahaName: string
  projectId: string
  grahaId: string
  assignmentType: 'assigned' | 'volunteer'
  onComplete: (count: number, durationSecs: number) => Promise<void>
  onCancel: () => void
}

export function SessionCounter({
  grahaName,
  projectId,
  grahaId,
  assignmentType,
  onComplete,
  onCancel,
}: SessionCounterProps) {
  const [state, setState] = useState<'active' | 'paused'>('active')
  const [count, setCount] = useState(0)
  const [durationSecs, setDurationSecs] = useState(0)
  const [showEndConfirm, setShowEndConfirm] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { isOnline, pendingSessions } = useOfflineStore((store) => ({
    isOnline: store.isOnline,
    pendingSessions: store.pendingSessions,
  }))

  // Timer effect
  useEffect(() => {
    if (state !== 'active') return

    const interval = setInterval(() => {
      setDurationSecs((prev) => prev + 1)
    }, 1000)

    return () => clearInterval(interval)
  }, [state])

  const hasPending = pendingSessions.length > 0

  const timeString = useMemo(() => {
    const m = Math.floor(durationSecs / 60)
    const s = durationSecs % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }, [durationSecs])

  const statusLabel = state === 'active' ? 'Chanting' : 'Paused'

  const statusTone = state === 'active' ? 'text-amber-400' : 'text-yellow-400'

  const handleIncrement = () => {
    setCount((prev) => prev + 1)
  }

  const handleDecrement = () => {
    setCount((prev) => Math.max(0, prev - 1))
  }

  const handlePauseResume = () => {
    setState(state === 'active' ? 'paused' : 'active')
  }

  const handleComplete = async () => {
    try {
      setIsSubmitting(true)
      await onComplete(count, durationSecs)
      setShowEndConfirm(false)
    } catch (err) {
      console.error('Failed to complete session:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    onCancel()
  }

  // Progress ring geometry
  const R = 46
  const C = 2 * Math.PI * R
  const progress = 0 // No target in delegation sessions - just count

  const secondaryBtn =
    'flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border transition active:scale-95 disabled:opacity-40 disabled:active:scale-100'

  const mantraColor = assignmentType === 'assigned' ? '#d946ef' : '#0ea5e9'

  return (
    <div className="w-full h-screen flex flex-col bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Offline strip */}
      {!isOnline && hasPending && (
        <div className="flex items-center justify-center gap-2 bg-yellow-500/15 py-1 text-xs text-yellow-200">
          <span className="h-1.5 w-1.5 rounded-full bg-yellow-400" />
          Offline — changes will sync
        </div>
      )}

      {/* Header */}
      <div className="shrink-0 border-b border-white/10 bg-black/20 px-4 sm:px-6 py-4 sm:py-5">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-lg sm:text-xl font-bold text-white mb-1">
            {grahaName}
          </h2>
          <div className="flex items-center justify-between">
            <p className="text-xs sm:text-sm text-white/60">
              {assignmentType === 'assigned' ? 'Assigned Work' : 'Volunteer Opportunity'}
            </p>
            <button
              onClick={handleCancel}
              className="px-3 py-1 text-xs font-medium text-white/70 hover:text-white transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-6 sm:py-8">
        <div className="w-full max-w-sm space-y-8">
          {/* Timer + Status on left */}
          <div className="flex items-center gap-6">
            <div className="flex flex-col items-start leading-tight">
              <span className="font-mono text-2xl sm:text-3xl font-semibold tabular-nums text-white/85">
                {timeString}
              </span>
              <span className={`flex items-center gap-1.5 text-xs font-semibold mt-2 ${statusTone}`}>
                <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                {statusLabel}
              </span>
            </div>

            {/* Count display on right */}
            <div className="ml-auto text-right">
              <div className="text-5xl sm:text-6xl font-bold text-white mb-1">
                {count}
              </div>
              <p className="text-xs sm:text-sm text-white/60">
                mantras counted
              </p>
            </div>
          </div>

          {/* Bead wrapped in progress ring */}
          <div className="flex justify-center">
            <div className="relative h-[120px] w-[120px] sm:h-[140px] sm:w-[140px]">
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
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <RudrakshaBead
                  onClick={handleIncrement}
                  disabled={state !== 'active'}
                  color={mantraColor}
                  isActive={state === 'active'}
                  size="large"
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            {/* Decrement button */}
            <button
              onClick={handleDecrement}
              disabled={state !== 'active' || count === 0}
              className={`${secondaryBtn} border-white/15 bg-white/5 text-white hover:bg-white/10`}
              title="Decrement"
            >
              <Minus className="h-5 w-5" />
            </button>

            {/* Pause/Resume button */}
            <button
              onClick={handlePauseResume}
              className={`${secondaryBtn} border-sacred-400/30 bg-sacred-500/15 text-sacred-300 hover:bg-sacred-500/25`}
              title={state === 'active' ? 'Pause' : 'Resume'}
            >
              {state === 'active' ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </button>

            {/* Complete button */}
            <button
              onClick={() => setShowEndConfirm(true)}
              className={`${secondaryBtn} border-green-400/30 bg-green-500/15 text-green-300 hover:bg-green-500/25`}
              title="Complete session"
            >
              <Check className="h-5 w-5" />
            </button>

            {/* Abandon button */}
            <button
              onClick={handleCancel}
              className={`${secondaryBtn} border-red-400/30 bg-red-500/15 text-red-300 hover:bg-red-500/25`}
              title="Abandon session"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Info text */}
          <div className="text-center text-xs text-white/50">
            <p>Tap the bead to count mantras</p>
            <p className="mt-1">Long press bead to increment quickly</p>
          </div>
        </div>
      </div>

      {/* End confirmation dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 z-50 flex items-end bg-black/50">
          <div className="mx-auto w-full max-w-sm space-y-5 rounded-t-3xl border-t border-white/20 bg-gradient-to-br from-slate-800 to-slate-900 p-6 sm:p-8">
            <h3 className="text-lg font-bold text-white sm:text-xl">Complete session?</h3>
            <p className="text-sm text-white/80 sm:text-base">
              You&apos;ve counted{' '}
              <span className="font-semibold" style={{ color: mantraColor }}>
                {count}
              </span>{' '}
              mantras for <span className="font-semibold">{grahaName}</span>. This will save
              your progress.
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
