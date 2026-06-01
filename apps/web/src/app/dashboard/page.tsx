'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDashboard } from '@/hooks/useDashboard'
import { MainLayout } from '@/components/layout/MainLayout'
import { TodaysPractice } from '@/components/dashboard/TodaysPractice'
import { ActivityGraph } from '@/components/dashboard/ActivityGraph'
import { QuickStatsCards } from '@/components/dashboard/QuickStatsCards'
import { RecentSessions } from '@/components/dashboard/RecentSessions'

export default function DashboardPage() {
  const router = useRouter()
  const { isSignedIn, isLoading: authLoading } = useAuth()
  const { data: dashboardData, isLoading: dataLoading, error: dataError, refetch } = useDashboard()

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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-orange-500" />
        </div>
      </MainLayout>
    )
  }

  if (!isSignedIn) {
    return null
  }

  const isLoading = dataLoading
  const hasError = dataError && !dashboardData

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="mb-12 sm:mb-16">
          <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            Welcome back
          </h2>
          <p className="text-lg sm:text-xl text-white/70 font-light max-w-2xl">
            Continue your spiritual practice and track your daily mantras
          </p>
        </div>

        {/* Error State */}
        {hasError && (
          <div className="mb-8 bg-red-500/20 border border-red-500/30 rounded-xl p-4 sm:p-6 flex items-start justify-between backdrop-blur">
            <div>
              <h3 className="text-sm font-semibold text-red-200 mb-1">
                Unable to load dashboard
              </h3>
              <p className="text-sm text-red-200/80">
                {dataError?.message || 'An error occurred while fetching your data.'}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="text-sm font-semibold text-red-300 hover:text-red-200 whitespace-nowrap ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-8 lg:space-y-10">
          {/* Featured Section: Today's Practice */}
          {isLoading ? (
            <div className="glassmorphic h-96 animate-pulse" />
          ) : (
            <TodaysPractice
              done={dashboardData?.done ?? 0}
              target={dashboardData?.target ?? 0}
            />
          )}

          {/* Activity Graph - Full Width */}
          {isLoading ? (
            <div className="glassmorphic h-64 animate-pulse" />
          ) : (
            <ActivityGraph isLoading={isLoading} />
          )}

          {/* Quick Stats Cards - Two Column Grid */}
          <QuickStatsCards
            streak={dashboardData?.streak ?? 0}
            total={dashboardData?.total ?? 0}
            isLoading={isLoading}
          />

          {/* Recent Sessions */}
          <RecentSessions isLoading={isLoading} />
        </div>
      </div>
    </MainLayout>
  )
}
