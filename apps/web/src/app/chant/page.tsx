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
  name_te?: string
  adhidevata_te?: string
  adhidevata_devanagari?: string
  adhidevata_mantra_te?: string
  adhidevata_mantra_devanagari?: string
  pratyadhidevata_te?: string
  pratyadhidevata_devanagari?: string
  pratyadhidevata_mantra_te?: string
  pratyadhidevata_mantra_devanagari?: string
  mantra_te?: string
  mantra_devanagari?: string
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
    <div className="flex h-[100dvh] flex-col overflow-hidden">
      {/* Compact header: back + mantra selector on one row */}
      <div className="z-20 flex shrink-0 items-center gap-3 border-b border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md sm:px-6 sm:py-2.5">
        <button
          onClick={() => router.push('/dashboard')}
          className="inline-flex shrink-0 items-center gap-1 text-sacred-400 transition-colors hover:text-sacred-300"
          aria-label="Back to dashboard"
        >
          <ChevronLeft className="h-5 w-5" />
          <span className="hidden text-sm font-medium sm:inline">Dashboard</span>
        </button>
        <div className="min-w-0 flex-1">
          <MantrasDropdown onSelect={handleSelectMantra} isLoading={isStarting} />
        </div>
      </div>

      {/* Cockpit — fills remaining height, never scrolls */}
      <div className="min-h-0 flex-1 px-2 py-2 sm:px-4 sm:py-3">
        {selectedMantra ? (
          <CounterDisplay
            count={counterState.count}
            target={counterState.target}
            mantraName={selectedMantra.name}
            mantraDevanagari={selectedMantra.name_devanagari}
            name_te={selectedMantra.name_te}
            adhidevata_te={selectedMantra.adhidevata_te}
            adhidevata_devanagari={selectedMantra.adhidevata_devanagari}
            adhidevata_mantra_te={selectedMantra.adhidevata_mantra_te}
            adhidevata_mantra_devanagari={selectedMantra.adhidevata_mantra_devanagari}
            pratyadhidevata_te={selectedMantra.pratyadhidevata_te}
            pratyadhidevata_devanagari={selectedMantra.pratyadhidevata_devanagari}
            pratyadhidevata_mantra_te={selectedMantra.pratyadhidevata_mantra_te}
            pratyadhidevata_mantra_devanagari={selectedMantra.pratyadhidevata_mantra_devanagari}
            mantra_te={selectedMantra.mantra_te}
            mantra_devanagari={selectedMantra.mantra_devanagari}
            durationSecs={counterState.durationSecs}
            state={counterState.state}
            color={selectedMantra.color}
            onIncrement={handleIncrement}
          />
        ) : (
          <div className="flex h-full items-center justify-center text-center text-white/50">
            <p className="text-sm sm:text-base">Select a mantra to begin</p>
          </div>
        )}
      </div>

      {/* Compact control bar — sticky bottom */}
      {selectedMantra && counterState.state !== 'idle' && (
        <div className="shrink-0 border-t border-white/15 bg-white/5 backdrop-blur-md">
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
            durationSecs={counterState.durationSecs}
            isLoading={isStarting}
            mantraColor={selectedMantra.color}
          />
        </div>
      )}
    </div>
  )
}
