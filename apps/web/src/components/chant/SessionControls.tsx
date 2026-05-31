'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pause, Play, Plus, Minus, Check, X, AlertCircle } from 'lucide-react'
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
  isLoading?: boolean
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
  isLoading,
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

  const handleComplete = async () => {
    if (!sessionId) return

    try {
      setIsSubmitting(true)
      onComplete()
      await completeSessionMutation.mutateAsync(sessionId)
      router.push('/dashboard')
    } catch (err) {
      console.error('Failed to complete session:', err)
      // Show error toast here
    } finally {
      setIsSubmitting(false)
      setShowEndConfirm(false)
    }
  }

  const handleAbandon = () => {
    onAbandon()
    router.push('/dashboard')
  }

  const isIdle = state === 'idle'
  const isActive = state === 'active'
  const isPaused = state === 'paused'
  const isCompleted = state === 'completed'
  const isAbandoned = state === 'abandoned'

  return (
    <div className="space-y-4 pb-8">
      {/* Offline badge */}
      {!isOnline && hasPending && (
        <div className="mx-auto max-w-sm bg-yellow-50 border border-yellow-200 rounded-lg p-3 flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-yellow-600" />
          <span className="text-sm text-yellow-800">Offline — pending sync</span>
        </div>
      )}

      {/* Main controls */}
      <div className="flex flex-col items-center gap-4 max-w-sm mx-auto">
        {/* Increment button */}
        <button
          onClick={onIncrement}
          disabled={!isActive || isLoading}
          className="w-32 h-32 rounded-full bg-gradient-to-br from-temple-500 to-temple-600 hover:from-temple-600 hover:to-temple-700 disabled:from-gray-400 disabled:to-gray-500 text-white shadow-lg hover:shadow-xl transition-all active:scale-95 flex items-center justify-center"
        >
          <Plus className="w-16 h-16" />
        </button>

        {/* Secondary controls */}
        <div className="flex gap-4 justify-center w-full">
          {/* Decrement */}
          <button
            onClick={onDecrement}
            disabled={!isActive || count === 0 || isLoading}
            className="px-6 py-3 rounded-lg bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-800 font-medium transition min-h-[44px] flex items-center justify-center"
          >
            <Minus className="w-5 h-5" />
          </button>

          {/* Pause/Resume */}
          <button
            onClick={isActive ? onPause : onResume}
            disabled={isIdle || isCompleted || isAbandoned || isLoading}
            className="px-6 py-3 rounded-lg bg-yellow-100 hover:bg-yellow-200 disabled:bg-gray-100 text-yellow-800 font-medium transition min-h-[44px] flex items-center justify-center"
          >
            {isActive ? (
              <Pause className="w-5 h-5" />
            ) : (
              <Play className="w-5 h-5" />
            )}
          </button>

          {/* Complete/End Session */}
          <button
            onClick={() => setShowEndConfirm(true)}
            disabled={isIdle || isCompleted || isAbandoned || isLoading}
            className="px-6 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium transition min-h-[44px] flex items-center justify-center"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>

        {/* Abandon button */}
        <button
          onClick={handleAbandon}
          disabled={isIdle || isCompleted || isAbandoned || isLoading}
          className="px-6 py-3 rounded-lg bg-gray-300 hover:bg-gray-400 disabled:bg-gray-100 text-gray-800 font-medium transition min-h-[44px] flex items-center justify-center gap-2"
        >
          <X className="w-5 h-5" />
          Abandon
        </button>
      </div>

      {/* End confirmation dialog */}
      {showEndConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-end z-50">
          <div className="w-full bg-white rounded-t-2xl p-6 space-y-4 max-w-sm mx-auto">
            <h3 className="text-lg font-bold text-gray-900">End session?</h3>
            <p className="text-sm text-gray-600">
              You&apos;ve completed <strong>{count}</strong> out of{' '}
              <strong>{target}</strong> chants. This will save your progress.
            </p>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowEndConfirm(false)}
                className="flex-1 px-4 py-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-900 font-medium transition"
              >
                Continue
              </button>
              <button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex-1 px-4 py-3 rounded-lg bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-medium transition"
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
