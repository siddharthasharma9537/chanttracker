'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useSessions } from '@/hooks/useSessions'
import { MainLayout } from '@/components/layout/MainLayout'
import { DateSelector } from '@/components/history/DateSelector'
import { SessionList } from '@/components/history/SessionList'
import { ChevronLeft } from 'lucide-react'

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

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header with Back Button */}
        <div className="mb-8 flex items-center gap-4">
          <button
            onClick={() => router.push('/dashboard')}
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
              Practice History
            </h1>
            <p className="text-white/70 text-base sm:text-lg">
              Review your chanting sessions and track your practice over time
            </p>
          </div>
        </div>

        {/* Date Selector */}
        <div className="mb-6">
          <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />
        </div>

        {/* Session List */}
        <SessionList
          sessions={sessions}
          selectedDate={selectedDate}
          isLoading={isLoading}
          error={error}
          onRetry={() => refetch()}
        />
      </div>
    </MainLayout>
  )
}
