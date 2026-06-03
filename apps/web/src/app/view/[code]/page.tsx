'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { MainLayout } from '@/components/layout/MainLayout'
import { getProjectByCode } from '@chanttracker/api'

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
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-white/20 border-t-orange-500" />
        </div>
      </MainLayout>
    )
  }

  if (error || !projectData) {
    return (
      <MainLayout>
        <div className="min-h-screen flex flex-col items-center justify-center px-4">
          <div className="text-center max-w-md">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4v2m0-6a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm0 10a7 7 0 1 1 0-14 7 7 0 0 1 0 14z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">Project Not Found</h1>
            <p className="text-white/60 mb-6">
              {error ? 'Unable to load project. Please check the code and try again.' : 'The project code you entered is invalid.'}
            </p>
            <button
              onClick={() => router.push('/view')}
              className="bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 px-6 rounded-lg transition"
            >
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

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-yellow-50">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-600 to-yellow-600 text-white py-8 sm:py-12">
          <div className="max-w-6xl mx-auto px-4">
            <button
              onClick={() => router.push('/view')}
              className="flex items-center text-orange-100 hover:text-white transition mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </button>
            <div>
              <h1 className="text-3xl sm:text-4xl font-bold mb-2">{projectData.name}</h1>
              <p className="text-orange-100">Code: <span className="font-mono font-semibold">{projectData.project_code}</span></p>
              <p className="text-orange-100 mt-1">Client: {projectData.client_name}</p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-6xl mx-auto px-4 py-12">
          {/* Overall Progress */}
          <div className="bg-white rounded-lg shadow-lg p-6 sm:p-8 border border-orange-200 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Overall Progress</h2>

            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-700 font-semibold">{totalCompleted.toLocaleString()} / {totalTarget.toLocaleString()} Mantras</span>
                <span className="text-2xl font-bold text-orange-600">{Math.round(overallProgress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-500 to-yellow-500 h-full rounded-full transition-all duration-500"
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-8">
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <p className="text-gray-600 text-sm font-medium">Status</p>
                <p className="text-2xl font-bold text-orange-600 capitalize mt-1">{projectData.status}</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                <p className="text-gray-600 text-sm font-medium">Total Grahas</p>
                <p className="text-2xl font-bold text-blue-600 mt-1">{projectData.grahas.length}</p>
              </div>
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <p className="text-gray-600 text-sm font-medium">Remaining</p>
                <p className="text-2xl font-bold text-green-600 mt-1">{(totalTarget - totalCompleted).toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Grahas/Mantras */}
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Mantra Progress by Graha</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {projectData.grahas.map((graha) => {
                const grahaProgress = graha.total_target > 0 ? (graha.completed / graha.total_target) * 100 : 0
                return (
                  <div key={graha.id} className="bg-white rounded-lg shadow-lg p-6 border border-orange-200 hover:shadow-xl transition">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{graha.name}</h3>
                        {graha.priests.length > 0 && (
                          <p className="text-sm text-gray-600 mt-1">
                            👨‍🙏 {graha.priests.join(', ')}
                          </p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-orange-600">{Math.round(grahaProgress)}%</p>
                        <p className="text-xs text-gray-500">{graha.completed}/{graha.total_target}</p>
                      </div>
                    </div>

                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-orange-500 to-yellow-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${grahaProgress}%` }}
                      />
                    </div>

                    {grahaProgress === 100 && (
                      <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-3 text-center">
                        <p className="text-green-700 font-semibold text-sm">✓ Completed</p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {projectData.grahas.length === 0 && (
              <div className="bg-white rounded-lg shadow-lg p-8 text-center border border-orange-200">
                <p className="text-gray-600">No grahas assigned yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gray-100 py-8 mt-12">
          <div className="max-w-6xl mx-auto px-4 text-center text-gray-600">
            <p>🙏 ChantTracker • Track your spiritual progress in real-time</p>
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
