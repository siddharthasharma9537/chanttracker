'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePriestDashboard, useLogDelegationSession } from '@/hooks/useDelegation'
import { useDelegationProject } from '@/hooks/useDelegationProject'
import { AssignedGrahasSection } from './AssignedGrahasSection'
import { VolunteerOpportunitiesSection } from './VolunteerOpportunitiesSection'
import { SessionCounter } from '@/components/chant/SessionCounter'
import { AlertCircle, RefreshCw, Home } from 'lucide-react'

interface PriestDashboardProps {
  projectId: string
  priestId: string
  onNavigateToProjectDashboard?: () => void
  onNavigateToHome?: () => void
}

export function PriestDashboard({
  projectId,
  priestId,
  onNavigateToProjectDashboard,
  onNavigateToHome,
}: PriestDashboardProps) {
  const router = useRouter()
  const [activeSession, setActiveSession] = useState<{
    grahaId: string
    grahaName: string
    assignmentType: 'assigned' | 'volunteer'
  } | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())

  const {
    data: dashboardData,
    isLoading,
    error,
    refetch,
  } = usePriestDashboard(projectId, priestId, {
    refetchInterval: 5000,
  })

  const {
    data: projectData,
    isLoading: projectLoading,
  } = useDelegationProject(projectId, {
    refetchInterval: 5000,
  })

  const logSessionMutation = useLogDelegationSession()

  // Update timestamp when data changes
  useEffect(() => {
    if (dashboardData) {
      setLastUpdated(new Date())
    }
  }, [dashboardData])

  const handleStartSession = useCallback(
    (grahaId: string, grahaName: string, assignmentType: 'assigned' | 'volunteer') => {
      setActiveSession({ grahaId, grahaName, assignmentType })
    },
    []
  )

  const handleCompleteSession = useCallback(
    async (count: number, durationSecs: number) => {
      if (!activeSession) return

      try {
        await logSessionMutation.mutateAsync({
          projectId,
          priestId,
          grahaId: activeSession.grahaId,
          count,
          durationSecs,
          assignmentType: activeSession.assignmentType,
        })

        // Refetch dashboard data to get updated counts
        await refetch()
        setActiveSession(null)
      } catch (err) {
        console.error('Failed to log delegation session:', err)
      }
    },
    [activeSession, projectId, priestId, logSessionMutation, refetch]
  )

  // If session is active, show session counter
  if (activeSession) {
    return (
      <SessionCounter
        grahaName={activeSession.grahaName}
        projectId={projectId}
        grahaId={activeSession.grahaId}
        assignmentType={activeSession.assignmentType}
        onComplete={handleCompleteSession}
        onCancel={() => setActiveSession(null)}
      />
    )
  }

  if (isLoading || projectLoading) {
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

            {/* Overall Stats Skeleton */}
            <div className="bg-white rounded-lg border border-temple-100 p-6">
              <div className="h-6 bg-gray-200 rounded w-1/4 mb-4 animate-pulse" />
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4 animate-pulse" />
              <div className="h-2 bg-gray-200 rounded mb-4 animate-pulse" />
            </div>

            {/* Grahas Skeleton */}
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-lg border border-temple-100 p-4 animate-pulse space-y-3">
                <div className="h-4 bg-gray-200 rounded w-1/4" />
                <div className="h-2 bg-gray-200 rounded" />
                <div className="h-10 bg-gray-200 rounded" />
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
                Failed to Load Dashboard
              </h2>
              <p className="text-red-800 text-sm mb-4">
                {error.message || 'An error occurred while loading your assignments'}
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

  if (!dashboardData || dashboardData.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-temple-50 to-white p-4 sm:p-6">
        <div className="max-w-2xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-temple-900 mb-2">
              Priest Dashboard
            </h1>
            <p className="text-gray-600">No assignments yet</p>
          </div>

          <div className="bg-white rounded-lg border border-temple-100 p-8 text-center">
            <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 mb-6">
              You don&apos;t have any assignments for this project yet.
            </p>
            <button
              onClick={() => onNavigateToHome?.()}
              className="inline-flex items-center gap-2 px-4 py-2 bg-temple-500 hover:bg-temple-600 text-white rounded-lg font-medium transition-colors"
            >
              <Home className="w-4 h-4" />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Calculate summary stats
  const assignedItems = dashboardData.filter((item) => item.assignment_type === 'assigned')
  const volunteerItems = dashboardData.filter((item) => item.assignment_type === 'unassigned' && item.can_volunteer)

  const totalAssignedTarget = assignedItems.reduce((sum, item) => sum + item.target, 0)
  const totalAssignedCompleted = assignedItems.reduce((sum, item) => sum + item.completed, 0)
  const totalVolunteerTarget = volunteerItems.reduce((sum, item) => sum + item.target, 0)
  const totalVolunteerCompleted = volunteerItems.reduce((sum, item) => sum + item.completed, 0)

  const totalTarget = totalAssignedTarget + totalVolunteerTarget
  const totalCompleted = totalAssignedCompleted + totalVolunteerCompleted
  const overallPct = totalTarget > 0 ? Math.round((totalCompleted / totalTarget) * 100) : 0

  return (
    <div className="min-h-screen bg-gradient-to-b from-temple-50 to-white p-4 sm:p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-temple-900 mb-2">
            Priest Dashboard
          </h1>
          <div className="flex items-center justify-between">
            <p className="text-gray-600">
              {projectData?.client_name ? `Project: ${projectData.client_name}` : 'Delegation Project'}
            </p>
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

        {/* Overall Progress Card */}
        <div className="bg-white rounded-lg border border-temple-100 p-6 sm:p-8 mb-8 shadow-sm">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-4">
            Overall Progress
          </h2>

          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-gray-600 text-sm mb-1">Total Assignment</p>
              <p className="text-3xl font-bold text-temple-900">
                {totalCompleted.toLocaleString()}
              </p>
              <p className="text-gray-600 text-sm">
                of {totalTarget.toLocaleString()} mantras
              </p>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold text-temple-600 mb-2">
                {overallPct}%
              </div>
              <p className="text-gray-600 text-xs">Complete</p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-temple-500 to-sacred-500 transition-all duration-300"
              style={{
                width: `${Math.min(overallPct, 100)}%`,
              }}
            />
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-white rounded-lg border border-temple-100 p-4 text-center">
            <p className="text-gray-600 text-xs uppercase font-semibold tracking-wide mb-2">
              Assigned Work
            </p>
            <p className="text-2xl font-bold text-temple-900">
              {totalAssignedCompleted.toLocaleString()}
            </p>
            <p className="text-gray-500 text-xs">
              of {totalAssignedTarget.toLocaleString()}
            </p>
          </div>
          <div className="bg-white rounded-lg border border-sacred-100 p-4 text-center">
            <p className="text-gray-600 text-xs uppercase font-semibold tracking-wide mb-2">
              Volunteer Work
            </p>
            <p className="text-2xl font-bold text-sacred-600">
              {totalVolunteerCompleted.toLocaleString()}
            </p>
            <p className="text-gray-500 text-xs">
              of {totalVolunteerTarget.toLocaleString()}
            </p>
          </div>
        </div>

        {/* Assigned Grahas Section */}
        <AssignedGrahasSection
          items={dashboardData}
          onStartSession={handleStartSession}
        />

        {/* Volunteer Opportunities Section */}
        <VolunteerOpportunitiesSection
          items={dashboardData}
          onStartSession={handleStartSession}
        />

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <button
            onClick={() => onNavigateToProjectDashboard?.()}
            className="flex-1 px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-900 rounded-lg font-medium transition-colors"
          >
            View Project Dashboard
          </button>
          <button
            onClick={() => onNavigateToHome?.()}
            className="flex-1 px-4 py-3 bg-temple-500 hover:bg-temple-600 text-white rounded-lg font-medium transition-colors"
          >
            Personal Chanting
          </button>
        </div>
      </div>
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
