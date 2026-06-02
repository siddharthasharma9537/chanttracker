'use client'

import { useState } from 'react'
import { useQuery, useMutation } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { SessionCounter } from '@/components/chant/SessionCounter'
import { ArrowLeft, Play, AlertCircle, Loader } from 'lucide-react'

interface AssignedPriestDashboardProps {
  projectId: string
  priestId: string
  onBack: () => void
}

interface PriestAssignment {
  graha_id: string
  graha_name: string
  target: number
  completed: number
  completion_pct: number
}

interface ProjectGraha {
  graha_id: string
  graha_name: string
  completed_count: number
  total_target: number
}

export function AssignedPriestDashboard({
  projectId,
  priestId,
  onBack,
}: AssignedPriestDashboardProps) {
  const [activeSession, setActiveSession] = useState<{
    grahaId: string
    grahaName: string
  } | null>(null)
  const [showProjectHistory, setShowProjectHistory] = useState(false)

  // Fetch priest's assigned grahas
  const {
    data: assignedGrahas = [],
    isLoading: assignedLoading,
    error: assignedError,
    refetch: refetchAssigned,
  } = useQuery({
    queryKey: ['assigned-grahas', projectId, priestId],
    queryFn: async () => {
      const supabase = createClient()
      // Check if priest is assigned to this project
      const { data: assignments, error } = await supabase
        .from('priest_assignments')
        .select(`
          graha_id,
          grahas!priest_assignments_graha_id_fkey(
            id,
            name
          )
        `)
        .eq('project_id', projectId)
        .eq('priest_id', priestId)

      if (error) throw error

      // Fetch completion status for each graha
      const { data: grahas } = await supabase
        .from('project_grahas')
        .select('graha_id, graha_name, completed_count, total_target')
        .eq('project_id', projectId) as { data: ProjectGraha[] | null; error: any }

      // Match assignments with progress
      const result = assignments.map((assignment: any) => {
        const grahaData = grahas?.find((g: any) => g.graha_id === assignment.graha_id)
        return {
          graha_id: assignment.graha_id,
          graha_name: assignment.grahas?.name || 'Unknown',
          target: grahaData?.total_target || 0,
          completed: grahaData?.completed_count || 0,
          completion_pct: grahaData ? Math.round((grahaData.completed_count / grahaData.total_target) * 100) : 0,
        }
      })

      return result
    },
    enabled: !!projectId && !!priestId,
  })

  // Fetch project history (all grahas)
  const {
    data: projectGrahas = [],
    isLoading: projectLoading,
  } = useQuery({
    queryKey: ['project-grahas', projectId],
    queryFn: async () => {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('project_grahas')
        .select('graha_id, graha_name, completed_count, total_target')
        .eq('project_id', projectId)

      if (error) throw error
      return data || []
    },
    enabled: !!projectId,
  })

  // Log session mutation
  const logSessionMutation = useMutation({
    mutationFn: async (params: {
      grahaId: string
      count: number
      durationSecs: number
    }) => {
      const supabase = createClient()
      const { error } = await supabase.rpc('log_delegation_session', {
        p_project_id: projectId,
        p_priest_id: priestId,
        p_graha_id: params.grahaId,
        p_count: params.count,
        p_duration_secs: params.durationSecs,
      } as any)

      if (error) throw error
    },
    onSuccess: () => {
      setActiveSession(null)
      setShowProjectHistory(true)
      refetchAssigned()
    },
  })

  if (assignedError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-start gap-3 p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-red-200 mb-1">Not Assigned to Project</h3>
            <p className="text-red-100 text-sm">
              {assignedError.message || 'You are not assigned to this project. Please check your project ID and try again.'}
            </p>
            <button
              onClick={onBack}
              className="mt-3 text-sm px-3 py-1.5 bg-red-500/30 hover:bg-red-500/40 text-red-200 rounded transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (activeSession) {
    return (
      <SessionCounter
        grahaName={activeSession.grahaName}
        projectId={projectId}
        grahaId={activeSession.grahaId}
        assignmentType="assigned"
        onComplete={async (count, durationSecs) => {
          await logSessionMutation.mutateAsync({
            grahaId: activeSession.grahaId,
            count,
            durationSecs,
          })
        }}
        onCancel={() => setActiveSession(null)}
      />
    )
  }

  const isLoading = assignedLoading || projectLoading

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 pb-24 lg:pb-8">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <button
            onClick={onBack}
            className="inline-flex items-center gap-2 text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">Back to Project ID</span>
          </button>
          <h1 className="text-3xl font-bold text-white">My Assigned Work</h1>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 text-temple-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Assigned Grahas Section */}
          {assignedGrahas.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-semibold text-white mb-4">My Assigned Grahas</h2>
              <div className="space-y-3">
                {assignedGrahas.map((item: PriestAssignment) => {
                  const progressPct = Math.min(item.completion_pct, 100)
                  const remaining = item.target - item.completed

                  return (
                    <div
                      key={item.graha_id}
                      className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-lg p-4 sm:p-5 hover:bg-white/10 transition-colors"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-white mb-2">{item.graha_name}</h3>
                          <div className="flex items-center gap-4 text-sm text-white/70">
                            <span>
                              <span className="font-semibold text-white">{item.completed.toLocaleString()}</span>
                              {' / '}
                              {item.target.toLocaleString()}
                            </span>
                            <span className="text-white/40">•</span>
                            <span>
                              <span className="font-semibold text-white">{remaining.toLocaleString()}</span>
                              {' remaining'}
                            </span>
                          </div>
                        </div>
                        <div className="inline-flex items-center gap-1 px-2 py-1 bg-temple-500/20 text-temple-400 rounded-full text-xs font-semibold">
                          ASSIGNED
                        </div>
                      </div>

                      <div className="mb-4">
                        <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-temple-500 to-temple-600 transition-all duration-300"
                            style={{ width: `${progressPct}%` }}
                          />
                        </div>
                        <div className="mt-1 text-right">
                          <span className="text-xs font-medium text-white/60">{item.completion_pct}%</span>
                        </div>
                      </div>

                      <button
                        onClick={() =>
                          setActiveSession({
                            grahaId: item.graha_id,
                            grahaName: item.graha_name,
                          })
                        }
                        className="w-full px-4 py-2 bg-temple-500 hover:bg-temple-600 text-white rounded-lg font-medium transition-colors flex items-center justify-center gap-2 text-sm"
                      >
                        <Play className="w-4 h-4" />
                        Start Session
                      </button>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Project History Section */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4">Project Progress</h2>

            {projectGrahas.length === 0 ? (
              <p className="text-white/60 text-sm">No grahas in this project yet.</p>
            ) : (
              <div className="space-y-4">
                {projectGrahas.map((graha: ProjectGraha) => {
                  const isAssigned = assignedGrahas.some((a: PriestAssignment) => a.graha_id === graha.graha_id)
                  const progressPct = Math.min(
                    Math.round((graha.completed_count / graha.total_target) * 100),
                    100
                  )
                  const remaining = graha.total_target - graha.completed_count

                  return (
                    <div key={graha.graha_id} className="border border-white/10 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold text-white flex items-center gap-2">
                          {graha.graha_name}
                          {isAssigned && (
                            <span className="text-xs px-2 py-1 bg-temple-500/20 text-temple-400 rounded-full">
                              Assigned to You
                            </span>
                          )}
                        </h3>
                        <span className="text-sm text-white/60">{progressPct}%</span>
                      </div>

                      <p className="text-xs text-white/50 mb-3">
                        <span className="font-semibold text-white">{graha.completed_count.toLocaleString()}</span>
                        {' / '}
                        {graha.total_target.toLocaleString()}
                        {remaining > 0 && (
                          <>
                            {' • '}
                            <span className="font-semibold text-white">{remaining.toLocaleString()}</span>
                            {' remaining'}
                          </>
                        )}
                      </p>

                      <div className="relative h-2 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-sacred-400 to-sacred-500 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
