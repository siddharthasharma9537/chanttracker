'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MainLayout } from '@/components/layout/MainLayout'
import { PriestDashboard } from '@/components/delegation'

export default function PriestDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = params.id as string

  if (!user) {
    return null
  }

  const handleNavigateToProjectDashboard = () => {
    router.push(`/delegation/projects/${projectId}`)
  }

  const handleNavigateToHome = () => {
    router.push('/dashboard')
  }

  return (
    <MainLayout>
      <PriestDashboard
        projectId={projectId}
        priestId={user.id}
        onNavigateToProjectDashboard={handleNavigateToProjectDashboard}
        onNavigateToHome={handleNavigateToHome}
      />
    </MainLayout>
  )
}
