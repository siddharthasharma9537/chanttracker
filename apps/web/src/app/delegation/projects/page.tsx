'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useProjectsList } from '@/hooks/useDelegation'
import { MainLayout } from '@/components/layout/MainLayout'
import { AssignPriestModal } from '@/components/delegation/AssignPriestModal'
import { Plus, Calendar, Users, Zap, UserPlus } from 'lucide-react'
import Link from 'next/link'
import { clsx } from 'clsx'

interface ProjectItem {
  id: string
  client_name: string
  overall_completion_pct: number
  total_target: number
  total_completed: number
  grahas_count?: number
  priests_count?: number
  created_at?: string
  status?: string
  project_code?: string
}

export default function ProjectsListPage() {
  const router = useRouter()
  const { isSignedIn, isLoading: authLoading } = useAuth()
  const { data: projects, isLoading: projectsLoading } = useProjectsList()
  const [filterMode, setFilterMode] = useState<'all' | 'host' | 'priest'>('all')
  const [selectedProjectForAssign, setSelectedProjectForAssign] = useState<{ id: string; code: string } | null>(null)

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

  const projectList = (projects || []) as ProjectItem[]

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Recently'
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  const getCompletionColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500'
    if (percent >= 75) return 'bg-blue-500'
    if (percent >= 50) return 'bg-yellow-500'
    if (percent >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header Section */}
        <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-2" style={{ fontFamily: 'Merriweather, serif' }}>
              Delegation Projects
            </h1>
            <p className="text-lg text-white/70">
              Manage and track all your hosted projects
            </p>
          </div>
          <Link
            href="/delegation/new"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sacred-500/20 border border-sacred-400/50 text-white font-semibold hover:bg-sacred-500/30 hover:border-sacred-400/70 transition-all duration-300 hover:shadow-lg hover:shadow-sacred-500/20 active:scale-95 whitespace-nowrap"
          >
            <Plus className="w-5 h-5" />
            Create Project
          </Link>
        </div>

        {/* Filter Tabs */}
        <div className="mb-8 flex gap-3 border-b border-white/10 pb-4">
          {[
            { mode: 'all' as const, label: 'All Projects' },
            { mode: 'host' as const, label: 'As Host' },
            { mode: 'priest' as const, label: 'As Priest' },
          ].map((tab) => (
            <button
              key={tab.mode}
              onClick={() => setFilterMode(tab.mode)}
              className={clsx(
                'px-4 py-2 rounded-lg font-medium transition-colors text-sm sm:text-base',
                filterMode === tab.mode
                  ? 'bg-white/20 text-white'
                  : 'text-white/70 hover:text-white hover:bg-white/10'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Projects Grid */}
        {projectsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-80 glassmorphic animate-pulse rounded-2xl"
              />
            ))}
          </div>
        ) : projectList.length === 0 ? (
          <div className="glassmorphic rounded-2xl p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-white/50" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              No projects yet
            </h3>
            <p className="text-white/70 mb-6 max-w-sm mx-auto">
              Create your first delegation project to get started with managing grahas and priests
            </p>
            <Link
              href="/delegation/new"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sacred-500/20 border border-sacred-400/50 text-white font-semibold hover:bg-sacred-500/30 hover:border-sacred-400/70 transition-all duration-300"
            >
              <Plus className="w-5 h-5" />
              Create Your First Project
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectList.map((project) => (
              <div
                key={project.id}
                className="group relative glassmorphic rounded-2xl p-6 text-left overflow-hidden flex flex-col"
              >
                {/* Background accent */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-sacred-500/10 via-transparent to-transparent pointer-events-none" />

                {/* Content */}
                <div className="relative z-10 flex-1">
                  {/* Header */}
                  <div className="mb-4">
                    <h3 className="text-lg sm:text-xl font-bold text-white mb-1 line-clamp-2">
                      {project.client_name}
                    </h3>
                    <p className="text-xs sm:text-sm text-white/60">
                      {formatDate(project.created_at)}
                    </p>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-white/70">Progress</span>
                      <span className="text-sm font-bold text-white">
                        {Math.round(project.overall_completion_pct)}%
                      </span>
                    </div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={clsx(
                          'h-full rounded-full transition-all duration-300',
                          getCompletionColor(project.overall_completion_pct)
                        )}
                        style={{ width: `${Math.min(project.overall_completion_pct, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-xs text-white/60 mb-1">Completed</p>
                      <p className="text-base sm:text-lg font-bold text-white">
                        {project.total_completed}/{project.total_target}
                      </p>
                    </div>
                    <div className="bg-white/5 rounded-lg p-2">
                      <p className="text-xs text-white/60 mb-1">Priests</p>
                      <p className="text-base sm:text-lg font-bold text-white">
                        {project.priests_count || 0}
                      </p>
                    </div>
                  </div>

                  {/* Status Badge */}
                  {project.status && (
                    <div className="inline-block px-3 py-1 rounded-full bg-sacred-500/20 border border-sacred-400/40 text-xs font-medium text-sacred-300 mb-4">
                      {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => router.push(`/delegation/projects/${project.id}`)}
                    className="flex-1 px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors text-sm"
                  >
                    View Details
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setSelectedProjectForAssign({ id: project.id, code: project.project_code || '' })
                    }}
                    className="px-3 py-2 bg-temple-500/20 hover:bg-temple-500/30 text-temple-300 rounded-lg font-medium transition-colors text-sm flex items-center gap-1"
                  >
                    <UserPlus className="w-4 h-4" />
                    Assign
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-white/50 text-sm">
          <p>Click on any project to view details and manage assignments</p>
        </div>
      </div>

      {/* Assign Priest Modal */}
      {selectedProjectForAssign && (
        <AssignPriestModal
          isOpen={!!selectedProjectForAssign}
          projectId={selectedProjectForAssign.id}
          projectCode={selectedProjectForAssign.code}
          onClose={() => setSelectedProjectForAssign(null)}
          onSuccess={() => {
            setSelectedProjectForAssign(null)
          }}
        />
      )}
    </MainLayout>
  )
}
