'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useSessionCounter } from '@/hooks/useSessionCounter'
import { useStartSession, useUpdateSessionCount } from '@/hooks/useSessions'
import { useOfflineStore } from '@/store/offlineStore'
import { MantrasDropdown } from '@/components/chant/MantrasDropdown'
import { CounterDisplay } from '@/components/chant/CounterDisplay'
import { SessionControls } from '@/components/chant/SessionControls'

interface SelectedMantra {
  id: string
  name: string
  name_devanagari: string
  color?: string
}

export default function ChantPage() {
  const router = useRouter()
  const { isSignedIn, isLoading: authLoading } = useAuth()
  const {
    state: counterState,
    start,
    increment,
    decrement,
    pause,
    resume,
    complete,
    abandon,
  } = useSessionCounter()
  const startSessionMutation = useStartSession()
  const updateSessionCountMutation = useUpdateSessionCount()
  const { isOnline, addPending, removePending } = useOfflineStore((store) => ({
    isOnline: store.isOnline,
    addPending: store.addPending,
    removePending: store.removePending,
  }))

  const [selectedMantra, setSelectedMantra] = useState<SelectedMantra | null>(
    null
  )
  const [isStarting, setIsStarting] = useState(false)

  // Redirect if not authenticated (skip in development)
  useEffect(() => {
    // Always allow in development mode
    if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
      return
    }
    if (!authLoading && !isSignedIn) {
      router.push('/auth/signin')
    }
  }, [isSignedIn, authLoading, router])

  // Redirect to dashboard if idle after completing/abandoning a session
  useEffect(() => {
    if (
      (counterState.state === 'completed' ||
        counterState.state === 'abandoned') &&
      !authLoading
    ) {
      const timer = setTimeout(() => {
        router.push('/dashboard')
      }, 1000)
      return () => clearTimeout(timer)
    }
  }, [counterState.state, authLoading, router])

  const handleSelectMantra = async (mantraId: string, mantra: SelectedMantra) => {
    console.log('[Chant] Selecting mantra:', mantra.name)
    setSelectedMantra(mantra)
    setIsStarting(true)

    try {
      console.log('[Chant] Creating session for mantra:', mantraId)
      const session = await startSessionMutation.mutateAsync(mantraId)
      console.log('[Chant] Session created:', session)

      if (!session?.id) {
        throw new Error('Session creation failed: no session ID returned')
      }

      console.log('[Chant] Starting counter with sessionId:', session.id)
      start(session.id, mantraId, 108)
      console.log('[Chant] Counter started, state should be active now')

      // If offline, add to pending queue
      if (!isOnline) {
        addPending({
          id: `pending-${Date.now()}`,
          sessionId: session.id,
          count: 0,
          durationSecs: 0,
          createdAt: Date.now(),
        })
      }
    } catch (err) {
      console.error('[Chant] Failed to start session:', err)
      console.error('[Chant] Error details:', err instanceof Error ? err.message : JSON.stringify(err))
      // Keep selectedMantra set to show counter even if session creation failed
      // setSelectedMantra(null)
      // Show error toast here
    } finally {
      setIsStarting(false)
    }
  }

  const handleIncrement = () => {
    increment()
    // Sync to database after incrementing
    if (counterState.sessionId) {
      updateSessionCountMutation.mutate({
        sessionId: counterState.sessionId,
        count: counterState.count + 1,
      })
    }
  }

  const handleDecrement = () => {
    decrement()
    // Sync to database after decrementing
    if (counterState.sessionId && counterState.count > 0) {
      updateSessionCountMutation.mutate({
        sessionId: counterState.sessionId,
        count: counterState.count - 1,
      })
    }
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-600">Loading...</p>
      </div>
    )
  }

  // Allow dev mode to bypass auth
  const isDev = typeof window !== 'undefined' && process.env.NODE_ENV === 'development'
  if (!isSignedIn && !isDev) {
    return null // Redirect will handle this
  }

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <div className="border-b border-gray-200 px-4 py-4">
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex items-center gap-2 text-temple-600 hover:text-temple-700 font-medium"
        >
          <ChevronLeft className="w-5 h-5" />
          Dashboard
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {/* Mantra Selector */}
        <div className="px-4 pt-6 pb-4 max-w-sm mx-auto w-full">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Today&apos;s Mantra
          </label>
          <MantrasDropdown
            onSelect={handleSelectMantra}
            isLoading={isStarting}
          />
        </div>

        {/* Counter Display */}
        {selectedMantra && (
          <CounterDisplay
            count={counterState.count}
            target={counterState.target}
            mantraName={selectedMantra.name}
            mantraDevanagari={selectedMantra.name_devanagari}
            durationSecs={counterState.durationSecs}
            state={counterState.state}
            color={selectedMantra.color}
          />
        )}
      </div>

      {/* Controls */}
      {selectedMantra && counterState.state !== 'idle' && (
        <SessionControls
          onIncrement={handleIncrement}
          onDecrement={handleDecrement}
          onPause={pause}
          onResume={resume}
          onComplete={complete}
          onAbandon={abandon}
          state={counterState.state}
          sessionId={counterState.sessionId}
          count={counterState.count}
          target={counterState.target}
          isLoading={isStarting}
        />
      )}
    </div>
  )
}
