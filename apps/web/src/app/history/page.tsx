'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useSessions } from '@/hooks/useSessions'
import { MainLayout } from '@/components/layout/MainLayout'
import { DateSelector } from '@/components/history/DateSelector'
import { SessionList } from '@/components/history/SessionList'

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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-temple-100 border-t-temple-500" />
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
            History
          </h1>
          <p className="text-gray-600 text-base sm:text-lg">
            Review your chanting sessions and track your practice over time
          </p>
        </div>

        {/* Date Selector */}
        <DateSelector selectedDate={selectedDate} onDateChange={setSelectedDate} />

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
