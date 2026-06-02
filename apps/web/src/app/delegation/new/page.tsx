'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MainLayout } from '@/components/layout/MainLayout'
import { HostProjectForm } from '@/components/delegation/HostProjectForm'

export default function NewProjectPage() {
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
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
            Create Host Project
          </h1>
          <p className="text-lg text-white/70">
            Set up a new delegation project for client grahas
          </p>
        </div>

        {/* Form Container */}
        <div className="glassmorphic rounded-2xl p-6 sm:p-8">
          <HostProjectForm />
        </div>
      </div>
    </MainLayout>
  )
}
