'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { useProjectsList } from '@/hooks/useDelegation'
import { MainLayout } from '@/components/layout/MainLayout'
import { AssignPriestModal } from '@/components/delegation/AssignPriestModal'
import { Card } from '@/components/cards/Card'
import { Badge } from '@/components/feedback/Badge'
import { Progress } from '@/components/feedback/Progress'
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
}

export default function ProjectsListPage() {
  const router = useRouter()
  const { isSignedIn, isLoading: authLoading } = useAuth()
  const { data: projects, isLoading: projectsLoading } = useProjectsList()
  const [filterMode, setFilterMode] = useState<'all' | 'host' | 'priest'>('all')
  const [selectedProjectForAssign, setSelectedProjectForAssign] = useState<string | null>(null)

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
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center max-w-sm">
              <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-6">
                <Zap className="w-8 h-8 text-white/50" />
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                No projects yet
              </h3>
              <p className="text-white/70 mb-8">
                Create your first delegation project to get started with managing grahas and priests
              </p>
              <Link
                href="/delegation/new"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sacred-500/20 border border-sacred-400/50 text-white font-semibold hover:bg-sacred-500/30 hover:border-sacred-400/70 transition-all duration-300 active:scale-95"
              >
                <Plus className="w-5 h-5" />
                Create Your First Project
              </Link>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {projectList.map((project) => (
              <div key={project.id}>
                <div className="group h-full relative flex flex-col">
                  <Card
                    variant="featured"
                    className="flex flex-col h-full cursor-pointer"
                    onClick={() => router.push(`/delegation/projects/${project.id}`)}
                  >
                    {/* Header with Title and Date */}
                    <div className="mb-6 pb-4 border-b border-white/10">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <h3 className="text-2xl font-bold text-white line-clamp-2 flex-1">
                          {project.client_name}
                        </h3>
                        {project.status && (
                          <Badge variant={project.status === 'active' ? 'success' : 'info'} size="sm" className="flex-shrink-0 mt-1">
                            {project.status.charAt(0).toUpperCase() + project.status.slice(1)}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-white/50">
                        {formatDate(project.created_at)}
                      </p>
                    </div>

                    {/* Progress Section */}
                    <div className="mb-6 flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-white/70">Progress</span>
                        <span className="text-sm font-bold text-white">
                          {Math.round(project.overall_completion_pct)}%
                        </span>
                      </div>
                      <Progress
                        value={Math.min(project.overall_completion_pct, 100)}
                        showLabel={false}
                        variant="linear"
                        size="sm"
                      />
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4 mb-6 pb-4 border-b border-white/10">
                      <div>
                        <p className="text-xs text-white/60 mb-2">Completed</p>
                        <p className="text-xl font-bold text-white">
                          {project.total_completed}
                        </p>
                        <p className="text-xs text-white/50">of {project.total_target}</p>
                      </div>
                      <div>
                        <p className="text-xs text-white/60 mb-2">Priests</p>
                        <p className="text-xl font-bold text-white">
                          {project.priests_count || 0}
                        </p>
                        <p className="text-xs text-white/50">assigned</p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 mt-auto pt-2">
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          router.push(`/delegation/projects/${project.id}`)
                        }}
                        className="flex-1 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-lg font-medium transition-colors text-sm"
                      >
                        Details
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedProjectForAssign(project.id)
                        }}
                        className="px-4 py-2.5 bg-sacred-500/20 hover:bg-sacred-500/30 border border-sacred-400/50 text-sacred-300 rounded-lg font-medium transition-colors text-sm flex items-center gap-1 whitespace-nowrap"
                      >
                        <UserPlus className="w-4 h-4" />
                        Assign
                      </button>
                    </div>
                  </Card>
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
          projectId={selectedProjectForAssign}
          onClose={() => setSelectedProjectForAssign(null)}
          onSuccess={() => {
            setSelectedProjectForAssign(null)
          }}
        />
      )}
    </MainLayout>
  )
}
