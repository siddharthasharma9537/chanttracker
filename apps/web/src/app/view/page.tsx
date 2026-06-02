'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MainLayout } from '@/components/layout/MainLayout'

export default function ClientViewPage() {
  const router = useRouter()
  const { isSignedIn, isLoading: authLoading } = useAuth()

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

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4" style={{ fontFamily: 'Merriweather, serif' }}>
            Client View
          </h1>
          <p className="text-lg sm:text-xl text-white/70 font-light">View project progress and real-time updates</p>
        </div>
      </div>
    </MainLayout>
  )
}
