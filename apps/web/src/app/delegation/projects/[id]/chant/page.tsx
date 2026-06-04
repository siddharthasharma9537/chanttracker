'use client'

import { useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { ChevronLeft } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { useDelegationProject } from '@/hooks/useDelegationProject'
import { MainLayout } from '@/components/layout/MainLayout'
import { AssignedPriestChantPage } from '@/components/delegation/AssignedPriestChantPage'
import { AssignedPriestProjectHistory } from '@/components/delegation/AssignedPriestProjectHistory'

type TabType = 'chant' | 'history'

export default function HostProjectChantPage() {
  const params = useParams()
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user } = useAuth()
  const projectId = params.id as string
  const initialGrahaId = searchParams.get('graha') || undefined
  const [activeTab, setActiveTab] = useState<TabType>('chant')

  const { data: projectData } = useDelegationProject(projectId)

  if (!user) {
    return null
  }

  const projectName = projectData?.client_name || 'Project'

  return (
    <MainLayout>
      {/* Back + Tabs */}
      <div className="px-4 sm:px-6 pt-4 border-b border-white/10">
        <button
          onClick={() => router.push(`/delegation/projects/${projectId}`)}
          className="inline-flex items-center gap-1 text-sm text-white/60 hover:text-white transition-colors mb-3"
        >
          <ChevronLeft className="w-4 h-4" />
          Back to {projectName}
        </button>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('chant')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'chant'
                ? 'text-white border-b-2 border-sacred-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            Chant
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`pb-3 px-2 font-medium transition-colors ${
              activeTab === 'history'
                ? 'text-white border-b-2 border-sacred-500'
                : 'text-white/60 hover:text-white'
            }`}
          >
            History
          </button>
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1">
        {activeTab === 'chant' ? (
          <AssignedPriestChantPage
            projectId={projectId}
            priestId={user.id}
            projectName={projectName}
            initialGrahaId={initialGrahaId}
            onNavigateToHistory={() => setActiveTab('history')}
          />
        ) : (
          <AssignedPriestProjectHistory projectId={projectId} priestId={user.id} />
        )}
      </div>
    </MainLayout>
  )
}
