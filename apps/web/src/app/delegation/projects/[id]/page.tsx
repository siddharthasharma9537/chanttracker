'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MainLayout } from '@/components/layout/MainLayout'
import { ProjectDashboard } from '@/components/delegation'

export default function ProjectPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = params.id as string

  if (!user) {
    return null
  }

  const handleNavigateToAssignPriests = () => {
    router.push(`/delegation/projects/${projectId}/assign`)
  }

  const handleNavigateToHistory = () => {
    router.push(`/delegation/projects/${projectId}/history`)
  }

  return (
    <MainLayout>
      <ProjectDashboard
        projectId={projectId}
        onNavigateToAssignPriests={handleNavigateToAssignPriests}
        onNavigateToHistory={handleNavigateToHistory}
      />
    </MainLayout>
  )
}
