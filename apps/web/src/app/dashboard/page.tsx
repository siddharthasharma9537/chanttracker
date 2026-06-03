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
import { Card } from '@/components/cards/Card'
import { Badge } from '@/components/feedback/Badge'
import { Progress } from '@/components/feedback/Progress'
import { ErrorState } from '@/components/states/ErrorState'
import { LoadingSkeleton } from '@/components/states/LoadingSkeleton'
import { Zap, Target, Flame } from 'lucide-react'

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
          <div className="mb-8">
            <ErrorState
              message="Unable to load dashboard"
              details={dataError?.message || 'An error occurred while fetching your data.'}
              onRetry={() => refetch()}
            />
          </div>
        )}

        {/* Main Content */}
        {!hasError && (
          <div className="space-y-8 lg:space-y-10">
            {/* Featured Section: Today's Practice */}
            {isLoading ? (
              <LoadingSkeleton variant="card" count={1} />
            ) : (
              <TodaysPractice
                done={dashboardData?.done ?? 0}
                target={dashboardData?.target ?? 0}
              />
            )}

            {/* Quick Stats - Three Card Grid */}
            {isLoading ? (
              <LoadingSkeleton variant="card" count={3} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Streak Card */}
                <Card variant="standard">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-white/70 mb-2">Current Streak</p>
                      <h3 className="text-3xl font-bold text-white">{dashboardData?.streak ?? 0}</h3>
                    </div>
                    <div className="p-3 bg-orange-500/20 rounded-lg">
                      <Flame className="w-6 h-6 text-orange-400" />
                    </div>
                  </div>
                  {(dashboardData?.streak ?? 0) > 0 && (
                    <Badge variant="success" size="sm">
                      Active
                    </Badge>
                  )}
                </Card>

                {/* Total Sessions Card */}
                <Card variant="standard">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="text-sm font-medium text-white/70 mb-2">Total Sessions</p>
                      <h3 className="text-3xl font-bold text-white">{dashboardData?.total ?? 0}</h3>
                    </div>
                    <div className="p-3 bg-blue-500/20 rounded-lg">
                      <Zap className="w-6 h-6 text-blue-400" />
                    </div>
                  </div>
                  <p className="text-xs text-white/50">All-time sessions</p>
                </Card>

                {/* Today's Progress Card */}
                <Card variant="standard">
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-medium text-white/70">Today&apos;s Target</p>
                      <Badge variant={((dashboardData?.pct) ?? 0) >= 100 ? 'success' : 'info'} size="sm">
                        {dashboardData?.pct ?? 0}%
                      </Badge>
                    </div>
                    <p className="text-xs text-white/50 mb-3">
                      {dashboardData?.done ?? 0} / {dashboardData?.target ?? 0}
                    </p>
                    <Progress
                      value={Math.min(dashboardData?.pct ?? 0, 100)}
                      showLabel={false}
                      variant="linear"
                      size="sm"
                    />
                  </div>
                </Card>
              </div>
            )}

            {/* Activity Graph - Full Width */}
            {isLoading ? (
              <LoadingSkeleton variant="card" count={1} />
            ) : (
              <ActivityGraph isLoading={isLoading} />
            )}

            {/* Recent Sessions */}
            {isLoading ? (
              <LoadingSkeleton variant="card" count={3} />
            ) : (
              <RecentSessions isLoading={isLoading} />
            )}
          </div>
        )}
      </div>
    </MainLayout>
  )
}
