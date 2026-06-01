import { useCallback } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { createClient } from '@/lib/supabase/client'
import { useAuth } from './useAuth'
import {
  HostProjectFormData,
  PriestAssignment,
  ProjectCreateResponse,
  ProjectStatus,
  Graha,
} from '@/types/delegation'

export function useGrahas() {
  // Mock grahas data for development/testing
  // TODO: Replace with actual database query once grahas table is seeded
  const mockGrahas: Graha[] = [
    { id: '1', name: 'Surya', position: 0, color: '#F59E0B' },
    { id: '2', name: 'Chandra', position: 1, color: '#F3F4F6' },
    { id: '3', name: 'Mangal', position: 2, color: '#DC2626' },
    { id: '4', name: 'Budha', position: 3, color: '#10B981' },
    { id: '5', name: 'Brihaspati', position: 4, color: '#FBBF24' },
    { id: '6', name: 'Shukra', position: 5, color: '#F9FAFB' },
    { id: '7', name: 'Shani', position: 6, color: '#1F2937' },
    { id: '8', name: 'Rahu', position: 7, color: '#6B7280' },
    { id: '9', name: 'Ketu', position: 8, color: '#FB923C' },
  ]

  return useQuery({
    queryKey: ['grahas'],
    queryFn: async () => {
      // Try to fetch from database first
      const supabase = createClient()
      const { data, error } = await supabase
        .from('grahas')
        .select('*')

      // If database fetch fails or returns no data, use mock data
      if (error || !data || data.length === 0) {
        return mockGrahas
      }
      return data as Graha[]
    },
    staleTime: 1000 * 60 * 60, // 1 hour
  })
}

export function useCreateProject() {
  const supabase = createClient()
  const { user } = useAuth()

  return useMutation({
    mutationFn: async (formData: HostProjectFormData) => {
      if (!user?.id) {
        throw new Error('User not authenticated')
      }

      // Step 1: Create project with selected grahas
      const { data: projectData, error: projectError } = await supabase.rpc(
        'create_project',
        {
          p_host_priest_id: user.id,
          p_client_name: formData.clientName,
          p_description: `Hosted by ${formData.hostPriestName}`,
          p_graha_ids: formData.selectedGrahas.map(id => parseInt(id, 10)),
        } as any
      ) as any

      if (projectError) throw projectError
      if (!projectData || (Array.isArray(projectData) && projectData.length === 0)) {
        throw new Error('Failed to create project')
      }

      const projectId = Array.isArray(projectData) ? projectData[0].project_id : projectData.project_id

      // Step 2: Assign priests to grahas
      if (formData.priestAssignments.length > 0) {
        const priestAssignmentsJsonb = formData.priestAssignments
          .filter((pa) => pa.assignedGrahas.length > 0) // Only include assignments with at least one graha
          .map((pa) => ({
            priest_id: user.id, // In the form context, we'll handle actual priest selection
            priest_name: pa.priestName,
            assigned_graha_ids: pa.assignedGrahas.map(id => parseInt(id, 10)),
          }))

        if (priestAssignmentsJsonb.length > 0) {
          const { error: assignError } = await (supabase.rpc('assign_priests', {
            p_project_id: projectId,
            p_priest_assignments: priestAssignmentsJsonb,
          } as any) as any)

          if (assignError) {
            // Log assignment error but don't fail - project was created successfully
            console.warn('Priest assignment warning:', assignError)
          }
        }
      }

      const totalTarget = Array.isArray(projectData) ? projectData[0].total_target_count : projectData.total_target_count

      return {
        project_id: projectId,
        status: 'active',
        total_target_count: totalTarget,
      } as ProjectCreateResponse
    },
  })
}

export function useProjectStatus(projectId: string | null) {
  const supabase = createClient()
  const { user } = useAuth()

  return useQuery({
    queryKey: ['projectStatus', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required')

      const { data, error } = await supabase.rpc('get_project_status', {
        p_project_id: projectId,
      } as any) as any

      if (error) throw error
      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('Project not found')
      }

      return (Array.isArray(data) ? data[0] : data) as ProjectStatus
    },
    enabled: !!projectId && !!user,
    staleTime: 1000 * 30, // 30 seconds
  })
}

export function useProjectsList() {
  const supabase = createClient()
  const { user } = useAuth()

  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('v_project_status')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user,
    staleTime: 1000 * 60, // 1 minute
  })
}

export function usePriestContributions(projectId: string | null) {
  const supabase = createClient()
  const { user } = useAuth()

  return useQuery({
    queryKey: ['priestContributions', projectId],
    queryFn: async () => {
      if (!projectId) throw new Error('Project ID is required')

      const { data, error } = await supabase
        .from('v_priest_contributions')
        .select('*')
        .eq('project_id', projectId)
        .order('priest_id')

      if (error) throw error
      return data || []
    },
    enabled: !!projectId && !!user,
    staleTime: 1000 * 30,
  })
}

export interface PriestDashboardItem {
  graha_id: string
  graha_name: string
  target: number
  completed: number
  completion_pct: number
  assignment_type: 'assigned' | 'unassigned'
  can_volunteer: boolean
}

export function usePriestDashboard(projectId: string | null, priestId: string | null, options = {}) {
  const supabase = createClient()
  const { user } = useAuth()
  const { refetchInterval = 5000 } = options as { refetchInterval?: number }

  return useQuery<PriestDashboardItem[], Error>({
    queryKey: ['priestDashboard', projectId, priestId],
    queryFn: async () => {
      if (!projectId || !priestId) throw new Error('Project ID and Priest ID are required')

      const { data, error } = await (supabase.rpc('get_priest_dashboard', {
        p_project_id: projectId,
        p_priest_id: priestId,
      } as any) as any)

      if (error) throw error
      return (data || []) as PriestDashboardItem[]
    },
    enabled: !!projectId && !!priestId && !!user,
    refetchInterval,
    staleTime: 2000,
  })
}

export function useLogDelegationSession() {
  const supabase = createClient()

  return useMutation({
    mutationFn: async ({
      projectId,
      priestId,
      grahaId,
      count,
      durationSecs,
      assignmentType,
    }: {
      projectId: string
      priestId: string
      grahaId: string
      count: number
      durationSecs?: number
      assignmentType: 'assigned' | 'volunteer'
    }) => {
      const { data, error } = await (supabase.rpc('log_delegation_session', {
        p_project_id: projectId,
        p_priest_id: priestId,
        p_graha_id: grahaId,
        p_count: count,
        p_duration_secs: durationSecs ?? null,
        p_assignment_type: assignmentType,
      } as any) as any)

      if (error) throw error
      return data
    },
  })
}
