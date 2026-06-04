'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useDelegationProject } from '@/hooks/useDelegationProject'
import { GrahaProgressCard } from './GrahaProgressCard'
import { PriestContributionsModal } from './PriestContributionsModal'
import { AssignPriestModal } from './AssignPriestModal'
import { AlertCircle, RefreshCw, Plus, UserPlus, Zap } from 'lucide-react'

interface ProjectDashboardProps {
  projectId: string
  onNavigateToAssignPriests?: () => void
  onNavigateToHistory?: () => void
}

export function ProjectDashboard({
  projectId,
  onNavigateToAssignPriests,
  onNavigateToHistory,
}: ProjectDashboardProps) {
  const router = useRouter()
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const [selectedGraha, setSelectedGraha] = useState<{
    id: string
    name: string
  } | null>(null)
  const [showContributionsModal, setShowContributionsModal] = useState(false)
  const [showAssignModal, setShowAssignModal] = useState(false)

  const {
    data: projectData,
    isLoading,
    error,
    refetch,
  } = useDelegationProject(projectId, {
    refetchInterval: 5000, // Poll every 5 seconds
  })

  // Update timestamp when data changes
  useEffect(() => {
    setLastUpdated(new Date())
  }, [projectData])

  const handleShowContributions = (grahaId: string, grahaName: string) => {
    setSelectedGraha({ id: grahaId, name: grahaName })
    setShowContributionsModal(true)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-temple-50 to-white p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          {/* Skeleton Loading State */}
          <div className="space-y-6">
            {/* Header Skeleton */}
            <div>
              <div className="h-8 bg-gray-200 rounded w-1/3 mb-2 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/4 animate-pulse" />
            </div>

            {/* Overall Progress Skeleton */}
            <div className="bg-white rounded-lg border border-temple-100 p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
              <div className="h-16 bg-gray-200 rounded mb-4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>

            {/* Grahas Skeleton */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-temple-100 p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-3" />
                <div className="h-2 bg-gray-200 rounded mb-2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-temple-50 to-white p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-start gap-4 p-6 bg-red-50 rounded-lg border border-red-200">
            <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Failed to Load Project
              </h2>
              <p className="text-red-800 text-sm mb-4">
                {error.message || 'An error occurred while loading the project'}
              </p>
              <button
                onClick={() => refetch()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!projectData) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-temple-50 to-white p-4 sm:p-6">
        <div className="max-w-2xl mx-auto text-center py-12">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Project not found</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-temple-50 to-white p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-temple-900 mb-2">
            {projectData.client_name}
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">Project Status</p>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <span>
                Updated {formatTimeAgo(lastUpdated)}
              </span>
              <button
                onClick={() => refetch()}
                className="p-1 hover:bg-gray-100 rounded transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Overall Completion Card */}
        <div className="bg-white rounded-lg border border-temple-100 p-6 sm:p-8 mb-8 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Overall Completion
          </h2>

          {/* Large Progress Ring */}
          <div className="flex items-center justify-center mb-6">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke="#e5e7eb"
                  strokeWidth="8"
                />
                <circle
                  cx="60"
                  cy="60"
                  r="45"
                  fill="none"
                  stroke={
                    projectData.overall_completion_pct === 100
                      ? '#22c55e'
                      : projectData.overall_completion_pct >= 66
                      ? '#3b82f6'
                      : projectData.overall_completion_pct >= 33
                      ? '#eab308'
                      : '#ef4444'
                  }
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={`${(projectData.overall_completion_pct / 100) * (2 * Math.PI * 45)} ${2 * Math.PI * 45}`}
                  className="transition-all duration-300"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <div className="text-4xl font-bold text-temple-900">
                  {projectData.overall_completion_pct}%
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="text-center mb-4">
            <p className="text-gray-600 mb-1">
              {projectData.total_completed.toLocaleString()} of{' '}
              {projectData.total_target.toLocaleString()} mantras completed
            </p>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-temple-500 to-sacred-500 transition-all duration-300"
              style={{
                width: `${Math.min(projectData.overall_completion_pct, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Priest Count Badge */}
        {projectData.graha_breakdown && projectData.graha_breakdown.length > 0 && (
          <div className="mb-6 flex items-center gap-2 text-sm text-gray-600">
            <span className="inline-block px-3 py-1 bg-temple-100 text-temple-700 rounded-full font-medium">
              {projectData.graha_breakdown.reduce((acc, graha) => {
                const priestIds = new Set(
                  (graha.assigned_priests || []).map((p) => p.priest_id)
                )
                return acc + priestIds.size
              }, 0)} Priests
            </span>
          </div>
        )}

        {/* Grahas Breakdown */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Graha-wise Progress
          </h2>

          {projectData.graha_breakdown && projectData.graha_breakdown.length > 0 ? (
            <div>
              {projectData.graha_breakdown.map((graha) => (
                <GrahaProgressCard
                  key={graha.graha_id}
                  grahaName={graha.graha_name}
                  completed={graha.completed}
                  target={graha.target}
                  completionPct={graha.completion_pct}
                  assignedPriests={graha.assigned_priests || []}
                  onShowContributions={() =>
                    handleShowContributions(graha.graha_id, graha.graha_name)
                  }
                />
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-lg border border-temple-100 p-6 text-center">
              <p className="text-gray-500 mb-4">No grahas assigned yet</p>
              <button
                onClick={() => {
                  onNavigateToAssignPriests?.()
                }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-sacred-500 hover:bg-sacred-600 text-white rounded-lg font-medium transition-colors"
              >
                <Plus className="w-4 h-4" />
                Assign Grahas
              </button>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {projectData.graha_breakdown && projectData.graha_breakdown.length > 0 && (
          <div className="space-y-3 mb-8">
            <button
              onClick={() => router.push(`/delegation/projects/${projectId}/chant`)}
              className="w-full px-4 py-3 bg-gradient-to-r from-sacred-500 to-temple-500 hover:from-sacred-600 hover:to-temple-600 text-white rounded-lg font-semibold transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              <Zap className="w-5 h-5" />
              Chant for Project
            </button>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                onClick={() => setShowAssignModal(true)}
                className="px-4 py-3 bg-temple-500 hover:bg-temple-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Assign Priest
              </button>
              <button
                onClick={() => onNavigateToAssignPriests?.()}
                className="px-4 py-3 bg-sacred-500 hover:bg-sacred-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Manage Grahas
              </button>
              <button
                onClick={() => onNavigateToHistory?.()}
                className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
              >
                View History
              </button>
            </div>
          </div>
        )}

        {/* Status Indicator */}
        <div className="bg-white rounded-lg border border-temple-100 p-4 text-center text-sm">
          <p className="text-gray-600">
            Status:{' '}
            <span className="font-semibold text-gray-900 capitalize">
              {projectData.status}
            </span>
          </p>
        </div>
      </div>

      {/* Priest Contributions Modal */}
      {selectedGraha && (
        <PriestContributionsModal
          isOpen={showContributionsModal}
          grahaName={selectedGraha.name}
          projectId={projectId}
          grahaId={selectedGraha.id}
          onClose={() => {
            setShowContributionsModal(false)
            setSelectedGraha(null)
          }}
        />
      )}

      {/* Assign Priest Modal */}
      <AssignPriestModal
        isOpen={showAssignModal}
        projectId={projectId}
        onClose={() => setShowAssignModal(false)}
        onSuccess={() => refetch()}
      />

    </div>
  )
}

/**
 * Format time elapsed since a given date
 */
function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 10) return 'just now'
  if (seconds < 60) return `${seconds}s ago`

  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes}m ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`

  const days = Math.floor(hours / 24)
  return `${days}d ago`
}
