'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MainLayout } from '@/components/layout/MainLayout'
import { SettingsForm } from '@/components/settings/SettingsForm'
import { LoadingSkeleton } from '@/components/states/LoadingSkeleton'
import { ChevronLeft, Sliders } from 'lucide-react'

export default function SettingsPage() {
  const router = useRouter()
  const { isSignedIn, isLoading } = useAuth()

  useEffect(() => {
    if (!isLoading && !isSignedIn) {
      router.push('/auth/signin')
    }
  }, [isSignedIn, isLoading, router])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/30 border-t-amber-400"></div>
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
            className="inline-flex items-center gap-2 text-amber-400 hover:text-amber-300 transition-colors p-2 hover:bg-white/10 rounded-lg"
            title="Back to Dashboard"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
              Settings
            </h1>
            <p className="text-white/70 text-base sm:text-lg">
              Manage your profile and preferences
            </p>
          </div>
        </div>

        {/* Settings Form */}
        <SettingsForm />
      </div>
    </MainLayout>
  )
}
