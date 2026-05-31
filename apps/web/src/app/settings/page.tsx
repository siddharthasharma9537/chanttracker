'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MainLayout } from '@/components/layout/MainLayout'
import { SettingsForm } from '@/components/settings/SettingsForm'

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
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-temple-500"></div>
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
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your profile and preferences</p>
        </div>
        <SettingsForm />
      </div>
    </MainLayout>
  )
}
