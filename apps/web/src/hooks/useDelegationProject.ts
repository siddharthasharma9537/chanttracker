'use client'

import { useQuery } from '@tanstack/react-query'
import { getProjectStatus } from '@chanttracker/api'

interface GrahaBreakdown {
  graha_id: string
  graha_name: string
  target: number
  completed: number
  completion_pct: number
  assigned_priests: Array<{
    priest_id: string
    priest_name: string
    assignment_type: string
  }>
}

interface ProjectStatusData {
  project_code: string
  client_name: string
  status: string
  overall_completion_pct: number
  total_target: number
  total_completed: number
  graha_breakdown: GrahaBreakdown[]
}

interface UseDelegationProjectOptions {
  enabled?: boolean
  refetchInterval?: number | false
}

/**
 * Hook to fetch and manage delegation project status
 * Provides real-time updates via React Query polling
 */
export function useDelegationProject(
  projectId: string,
  options: UseDelegationProjectOptions = {}
) {
  const { enabled = true, refetchInterval = 5000 } = options

  return useQuery<ProjectStatusData, Error>({
    queryKey: ['delegation-project', projectId],
    queryFn: async () => {
      const { data, error } = await getProjectStatus(projectId)
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Project not found')

      // Transform single RPC response to our format
      const result = data[0]
      return {
        project_code: result.project_code || '',
        client_name: result.client_name,
        status: result.status,
        overall_completion_pct: result.overall_completion_pct,
        total_target: result.total_target,
        total_completed: result.total_completed,
        graha_breakdown: result.graha_breakdown || [],
      }
    },
    enabled: !!projectId && enabled,
    refetchInterval,
    staleTime: 2000,
  })
}
