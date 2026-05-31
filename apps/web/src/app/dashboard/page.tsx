'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useDashboard } from '@/hooks/useDashboard'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProgressRing } from '@/components/dashboard/ProgressRing'
import { QuickStats } from '@/components/dashboard/QuickStats'
import { PanchangWidget } from '@/components/dashboard/PanchangWidget'
import { ChevronRight } from 'lucide-react'

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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-sacred-500" />
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
      <div className="max-w-7xl mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-20">
        {/* Hero Section */}
        <div className="mb-16 sm:mb-24">
          <h2 className="text-5xl sm:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'Merriweather, serif' }}>
            Welcome back
          </h2>
          <p className="text-xl text-white/70 font-light max-w-2xl">
            Track your spiritual practice and mantras with intention
          </p>
        </div>

        {/* Error State */}
        {hasError && (
          <div className="mb-8 bg-red-50 border border-red-200 rounded-lg p-4 sm:p-6 flex items-start justify-between">
            <div>
              <h3 className="text-sm font-semibold text-red-900 mb-1">
                Unable to load dashboard
              </h3>
              <p className="text-sm text-red-700">
                {dataError?.message || 'An error occurred while fetching your data.'}
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="text-sm font-semibold text-red-600 hover:text-red-700 whitespace-nowrap ml-2"
            >
              Retry
            </button>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          {/* Progress Ring - Full Width on Mobile/Tablet */}
          <div className="lg:col-span-2 order-1 lg:order-1">
            <div className="glassmorphic p-8 sm:p-12 h-full">
              {isLoading ? (
                <div className="flex justify-center py-20">
                  <div className="animate-spin rounded-full h-12 w-12 border-4 border-temple-100 border-t-temple-500" />
                </div>
              ) : (
                <ProgressRing
                  done={dashboardData?.done ?? 0}
                  target={dashboardData?.target ?? 0}
                />
              )}
            </div>
          </div>

          {/* Quick Stats - Right Column */}
          <div className="order-2 lg:order-2">
            <QuickStats
              streak={dashboardData?.streak ?? 0}
              total={dashboardData?.total ?? 0}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* Secondary Content Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Panchang Widget */}
          <div>
            <PanchangWidget />
          </div>

          {/* Upcoming Features Card */}
          <div className="bg-gradient-to-br from-temple-50 to-dawn-50 rounded-lg p-6 shadow-sm border border-temple-100">
            <h3 className="font-semibold text-gray-900 mb-4">
              Track Your Progress
            </h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-temple-500 rounded-full" />
                <span className="text-gray-700">Daily chanting streaks</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-temple-500 rounded-full" />
                <span className="text-gray-700">Achieve goals and unlock milestones</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="w-2 h-2 bg-temple-500 rounded-full" />
                <span className="text-gray-700">Personalized anushthana (vows)</span>
              </li>
            </ul>
          </div>
        </div>

        {/* CTA Section */}
        <div className="glassmorphic bg-gradient-to-r from-sacred-500/30 to-amber-500/30 p-12 sm:p-16 text-center border-2 border-sacred-400/40 backdrop-blur-2xl">
          <h3 className="text-4xl sm:text-5xl font-bold text-white mb-6" style={{ fontFamily: 'Merriweather, serif' }}>
            Ready to chant?
          </h3>
          <p className="text-lg text-white/80 mb-10 max-w-2xl mx-auto font-light">
            Start a new chanting session and deepen your spiritual practice
          </p>
          <button
            onClick={() => router.push('/chant')}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-sacred-500 to-amber-500 text-white font-bold px-10 py-4 rounded-xl hover:from-sacred-600 hover:to-amber-600 transition-all shadow-2xl hover:shadow-3xl transform hover:scale-110 text-lg"
          >
            Start Chanting
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
    </MainLayout>
  )
}
