'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useSessions } from '@/hooks/useSessions'
import { MainLayout } from '@/components/layout/MainLayout'
import { DateSelector } from '@/components/history/DateSelector'
import { SessionList } from '@/components/history/SessionList'
import { LoadingSkeleton } from '@/components/states/LoadingSkeleton'
import { EmptyState } from '@/components/states/EmptyState'
import { ErrorState } from '@/components/states/ErrorState'
import { ChevronLeft, Clock } from 'lucide-react'

export default function HistoryPage() {
  const router = useRouter()
  const { isSignedIn, isLoading: authLoading } = useAuth()
  const { data: sessions = [], isLoading, error, refetch } = useSessions(500)
  const [selectedDate, setSelectedDate] = useState(new Date())

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isSignedIn) {
      router.push('/auth/signin')
    }
  }, [authLoading, isSignedIn, router])

  if (authLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-amber-400" />
        </div>
      </MainLayout>
    )
  }

  if (!isSignedIn) {
    return null
  }

  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.started_at).toLocaleDateString('sv')
    const selectedDateStr = selectedDate.toLocaleDateString('sv')
    return sessionDate === selectedDateStr
  })

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors p-2 hover:bg-white/10 rounded-lg"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
              Practice History
            </h1>
            <p className="text-white/70 text-base sm:text-lg">
              Review your chanting sessions and track your practice over time
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-8">
          <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {/* Session List */}
        {isLoading ? (
          <LoadingSkeleton variant="card" count={3} />
        ) : error ? (
          <ErrorState
            message="Failed to load sessions"
            details="Could not fetch your session history. Please try again."
            onRetry={() => refetch()}
          />
        ) : filteredSessions.length === 0 ? (
          <EmptyState
            icon={<Clock className="w-12 h-12 text-white/40" />}
            heading="No sessions yet"
            description={`You haven't recorded any sessions for ${selectedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}`}
            ctaLabel="Start Chanting"
            onCTA={() => router.push('/chant')}
          />
        ) : (
          <SessionList
            sessions={filteredSessions}
            selectedDate={selectedDate}
            isLoading={isLoading}
            error={error}
            onRetry={() => refetch()}
          />
        )}
      </div>
    </MainLayout>
  )
}
