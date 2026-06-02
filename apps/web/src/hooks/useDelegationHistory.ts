'use client'

import { useQuery } from '@tanstack/react-query'
import { getProjectHistory, getProjectStatus, getPriestContributions, getGrahaContributions } from '@chanttracker/api'

/* ─────────────────────────── Types ─────────────────────────── */

export interface DelegationSession {
  session_date: string
  priest_name: string
  priest_id: string
  graha_name: string
  graha_id: string
  count: number
  duration_secs?: number
  assignment_type: 'assigned' | 'volunteer'
  session_id: string
}

export interface GrahaContribution {
  priest_id: string
  priest_name: string
  completed_count: number
  assignment_type: 'assigned' | 'volunteer'
  sessions_count: number
}

export interface PriestContribution {
  graha_id: string
  graha_name: string
  target: number
  completed: number
  completion_pct: number
  assignment_type: 'assigned' | 'volunteer'
  sessions_count: number
}

export interface ProjectGrahaBreakdown {
  graha_id: string
  graha_name: string
  target: number
  completed: number
  completion_pct: number
  assigned_priests?: Array<{
    priest_id: string
    priest_name: string
    assignment_type: string
  }>
}

/* ─────────────────────────── Hooks ─────────────────────────── */

/**
 * Hook to fetch project history with filtering
 */
export function useDelegationHistory(
  projectId: string,
  options?: {
    startDate?: string | null
    endDate?: string | null
    priestId?: string | null
    grahaId?: string | null
    enabled?: boolean
  }
) {
  const { startDate, endDate, priestId, grahaId, enabled = true } = options || {}

  return useQuery<DelegationSession[], Error>({
    queryKey: ['delegation-history', projectId, startDate, endDate, priestId, grahaId],
    queryFn: async () => {
      const { data, error } = await getProjectHistory(projectId, startDate || undefined, endDate || undefined, priestId || undefined, grahaId || undefined)
      if (error) throw error
      return (data || []) as DelegationSession[]
    },
    enabled: !!projectId && enabled,
    staleTime: 30000, // 30 seconds
  })
}

/**
 * Hook to fetch project grahas with priest contributions
 */
export function useProjectGrahas(
  projectId: string,
  options?: {
    enabled?: boolean
  }
) {
  const { enabled = true } = options || {}

  return useQuery<ProjectGrahaBreakdown[], Error>({
    queryKey: ['project-grahas', projectId],
    queryFn: async () => {
      const { data, error } = await getProjectStatus(projectId)
      if (error) throw error
      if (!data || data.length === 0) throw new Error('Project not found')

      const result = data[0]
      return (result.graha_breakdown || []) as ProjectGrahaBreakdown[]
    },
    enabled: !!projectId && enabled,
    staleTime: 30000,
  })
}

/**
 * Hook to fetch priest contributions for a specific graha
 */
export function useGrahaContributions(
  projectId: string,
  grahaId: string,
  options?: {
    enabled?: boolean
  }
) {
  const { enabled = true } = options || {}

  return useQuery<GrahaContribution[], Error>({
    queryKey: ['graha-contributions', projectId, grahaId],
    queryFn: async () => {
      const { data, error } = await getGrahaContributions(projectId, grahaId)
      if (error) throw error
      return (data || []) as GrahaContribution[]
    },
    enabled: !!projectId && !!grahaId && enabled,
    staleTime: 30000,
  })
}

/**
 * Hook to fetch priest contributions across all grahas
 */
export function usePriestContributions(
  projectId: string,
  priestId: string,
  options?: {
    enabled?: boolean
  }
) {
  const { enabled = true } = options || {}

  return useQuery<PriestContribution[], Error>({
    queryKey: ['priest-contributions', projectId, priestId],
    queryFn: async () => {
      const { data, error } = await getPriestContributions(projectId, priestId)
      if (error) throw error
      return (data || []) as PriestContribution[]
    },
    enabled: !!projectId && !!priestId && enabled,
    staleTime: 30000,
  })
}
