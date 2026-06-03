'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/MainLayout'
import { getProjectByCode } from '@chanttracker/api'
import { ArrowLeft, AlertCircle } from 'lucide-react'
import { clsx } from 'clsx'

interface ProjectProgress {
  id: string
  name: string
  client_name: string
  project_code: string
  status: string
  grahas: GrahaProgress[]
}

interface GrahaProgress {
  id: string
  name: string
  total_target: number
  completed: number
  priests: string[]
}

export default function ProjectProgressPage() {
  const router = useRouter()
  const params = useParams()
  const code = params.code as string
  const [projectData, setProjectData] = useState<ProjectProgress | null>(null)

  const { data: project, isLoading, error } = useQuery({
    queryKey: ['project', code],
    queryFn: async () => {
      return await getProjectByCode(code)
    },
    enabled: !!code,
  })

  useEffect(() => {
    if (project) {
      setProjectData(project)
    }
  }, [project])

  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-sacred-500" />
        </div>
      </MainLayout>
    )
  }

  if (error || !projectData) {
    return (
      <MainLayout>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <button
            onClick={() => router.push('/view')}
            className="flex items-center text-white/70 hover:text-white transition mb-8"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            Back
          </button>

          <div className="glassmorphic rounded-2xl p-8 sm:p-12 text-center">
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-white/70" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Project Not Found</h1>
            <p className="text-white/70 max-w-md mx-auto mb-6">
              {error ? 'Unable to load project. Please check the code and try again.' : 'The project code you entered is invalid or does not exist.'}
            </p>
            <button
              onClick={() => router.push('/view')}
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-sacred-500/20 border border-sacred-400/50 text-white font-semibold hover:bg-sacred-500/30 hover:border-sacred-400/70 transition-all duration-300"
            >
              <ArrowLeft className="w-5 h-5" />
              Back to Code Entry
            </button>
          </div>
        </div>
      </MainLayout>
    )
  }

  const totalTarget = projectData.grahas.reduce((sum, g) => sum + g.total_target, 0)
  const totalCompleted = projectData.grahas.reduce((sum, g) => sum + g.completed, 0)
  const overallProgress = totalTarget > 0 ? (totalCompleted / totalTarget) * 100 : 0

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500'
    if (percent >= 75) return 'bg-blue-500'
    if (percent >= 50) return 'bg-yellow-500'
    if (percent >= 25) return 'bg-orange-500'
    return 'bg-red-500'
  }

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Back Button */}
        <button
          onClick={() => router.push('/view')}
          className="flex items-center text-white/70 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back to Code Entry
        </button>

        {/* Header Section */}
        <div className="mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-3" style={{ fontFamily: 'Merriweather, serif' }}>
            {projectData.name}
          </h1>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 text-white/70">
            <p>
              Code: <span className="font-mono font-semibold text-white">{projectData.project_code}</span>
            </p>
            <span className="hidden sm:inline">•</span>
            <p>
              Client: <span className="font-semibold text-white">{projectData.client_name}</span>
            </p>
          </div>
        </div>

        {/* Overall Progress Card */}
        <div className="glassmorphic rounded-2xl p-8 sm:p-10 mb-8">
          <h2 className="text-2xl font-bold text-white mb-8">Overall Progress</h2>

          <div className="mb-8">
            <div className="flex justify-between items-center mb-3">
              <span className="text-white/90 font-semibold">
                {totalCompleted.toLocaleString()} / {totalTarget.toLocaleString()} Mantras
              </span>
              <span className="text-3xl font-bold text-sacred-400">{Math.round(overallProgress)}%</span>
            </div>
            <div className="w-full bg-white/10 rounded-full h-3 overflow-hidden">
              <div
                className={clsx('h-full rounded-full transition-all duration-500', getProgressColor(overallProgress))}
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Status</p>
              <p className="text-xl font-bold text-white capitalize">{projectData.status}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Total Grahas</p>
              <p className="text-xl font-bold text-white">{projectData.grahas.length}</p>
            </div>
            <div className="bg-white/5 rounded-lg p-4 border border-white/10">
              <p className="text-xs font-semibold text-white/60 uppercase tracking-wider mb-2">Remaining</p>
              <p className="text-xl font-bold text-white">{(totalTarget - totalCompleted).toLocaleString()}</p>
            </div>
          </div>
        </div>

        {/* Grahas Grid */}
        {projectData.grahas.length === 0 ? (
          <div className="glassmorphic rounded-2xl p-8 sm:p-12 text-center">
            <p className="text-white/70">No grahas assigned to this project yet</p>
          </div>
        ) : (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Mantra Progress by Graha</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projectData.grahas.map((graha) => {
                const grahaProgress = graha.total_target > 0 ? (graha.completed / graha.total_target) * 100 : 0
                const isComplete = grahaProgress === 100

                return (
                  <div
                    key={graha.id}
                    className="group relative glassmorphic rounded-2xl p-6 overflow-hidden flex flex-col"
                  >
                    {/* Background accent */}
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity bg-gradient-to-br from-sacred-500/10 via-transparent to-transparent pointer-events-none" />

                    {/* Content */}
                    <div className="relative z-10 flex-1">
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <h3 className="text-lg sm:text-xl font-bold text-white mb-1">{graha.name}</h3>
                          {graha.priests.length > 0 && (
                            <p className="text-sm text-white/70">
                              👨‍🙏 {graha.priests.join(', ')}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-sacred-400">{Math.round(grahaProgress)}%</p>
                          <p className="text-xs text-white/60">
                            {graha.completed}/{graha.total_target}
                          </p>
                        </div>
                      </div>

                      {/* Progress Bar */}
                      <div className="mb-4">
                        <div className="w-full bg-white/10 rounded-full h-2 overflow-hidden">
                          <div
                            className={clsx(
                              'h-full rounded-full transition-all duration-500',
                              getProgressColor(grahaProgress)
                            )}
                            style={{ width: `${grahaProgress}%` }}
                          />
                        </div>
                      </div>

                      {/* Completion Badge */}
                      {isComplete && (
                        <div className="inline-block px-3 py-1 rounded-full bg-green-500/20 border border-green-400/40 text-xs font-semibold text-green-300">
                          ✓ Completed
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Footer Info */}
        <div className="mt-12 text-center text-white/50 text-sm">
          <p>🙏 Updates refresh automatically as grahas are completed</p>
        </div>
      </div>
    </MainLayout>
  )
}
