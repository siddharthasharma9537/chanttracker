import { createClient } from '@/lib/supabase/client'
import type { GrahaRow, ProjectRow } from '@/types/database'

export interface ProjectGrahaWithGraha {
  id: string
  graha_id: number
  target_count: number
  completed_count: number
  grahas: Pick<GrahaRow, 'name' | 'color' | 'orbit_order' | 'mantra_id'> | null
}

export interface ProjectWithProgress extends ProjectRow {
  project_grahas: ProjectGrahaWithGraha[]
  /** The signed-in user's role in this project. */
  my_role: 'organizer' | 'chanter'
}

const PROJECT_SELECT =
  '*, project_grahas(id, graha_id, target_count, completed_count, grahas(name, color, orbit_order, mantra_id))'

function withRole(p: any, userId: string): ProjectWithProgress {
  return {
    ...p,
    project_grahas: (p.project_grahas ?? []).sort(
      (a: any, b: any) => (a.grahas?.orbit_order ?? 99) - (b.grahas?.orbit_order ?? 99)
    ),
    my_role: p.organizer_id === userId ? 'organizer' : 'chanter',
  }
}

export async function listMyProjects(userId: string): Promise<ProjectWithProgress[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []).map((p: any) => withRole(p, userId))
}

export async function getProject(id: string, userId: string): Promise<ProjectWithProgress> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('projects')
    .select(PROJECT_SELECT)
    .eq('id', id)
    .single()
  if (error) throw error
  return withRole(data, userId)
}

/** Reference list of grahas with their linked mantra (for target defaults). */
export async function listGrahas(): Promise<
  (GrahaRow & { mantras: { default_target: number; name_en: string | null } | null })[]
> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('grahas')
    .select('*, mantras(default_target, name_en)')
    .not('mantra_id', 'is', null)
    .order('orbit_order')
  if (error) throw error
  // Dedupe alias rows (e.g. Mangal/Mangala) that share the same mantra
  const seen = new Set<string>()
  return (data ?? []).filter((g: any) => {
    if (seen.has(g.mantra_id)) return false
    seen.add(g.mantra_id)
    return true
  }) as any
}

export async function createProject(input: {
  userId: string
  beneficiaryName: string
  beneficiaryGotra?: string
  beneficiaryNakshatra?: string
  intention?: string
  description?: string
  deadline?: string
  grahas: { grahaId: number; targetCount: number }[]
}): Promise<ProjectRow> {
  const supabase = createClient()
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      organizer_id: input.userId,
      beneficiary_name: input.beneficiaryName,
      beneficiary_gotra: input.beneficiaryGotra || null,
      beneficiary_nakshatra: input.beneficiaryNakshatra || null,
      intention: input.intention || null,
      description: input.description || null,
      deadline: input.deadline || null,
    })
    .select()
    .single()
  if (error) throw error

  const { error: pgError } = await supabase.from('project_grahas').insert(
    input.grahas.map((g) => ({
      project_id: project.id,
      graha_id: g.grahaId,
      target_count: g.targetCount,
    }))
  )
  if (pgError) throw pgError

  // Organizer is also a member so they can chant in their own project
  const { error: pmError } = await supabase.from('project_members').insert({
    project_id: project.id,
    user_id: input.userId,
    role: 'organizer',
  })
  if (pmError) throw pmError

  return project as ProjectRow
}

/** Join as a chanter via 6-char invite code. Returns the project id. */
export async function joinProject(inviteCode: string): Promise<string> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('join_project', {
    p_invite_code: inviteCode.trim(),
  })
  if (error) throw error
  return data as string
}

export interface ProjectMember {
  user_id: string
  role: 'organizer' | 'chanter'
  assigned_graha_ids: number[]
  display_name: string | null
  email: string | null
  joined_at: string
}

/** Members of a project with display names — profiles is locked to
 *  own-row RLS, so this goes through a scoped RPC instead. */
export async function listProjectMembers(projectId: string): Promise<ProjectMember[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('list_project_members', {
    p_project_id: projectId,
  })
  if (error) throw error
  return (data ?? []) as ProjectMember[]
}

/** Organizer restricts a chanter to specific grahas. Empty array = any. */
export async function setMemberAssignment(
  projectId: string,
  userId: string,
  grahaIds: number[]
): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase
    .from('project_members')
    .update({ assigned_graha_ids: grahaIds })
    .eq('project_id', projectId)
    .eq('user_id', userId)
  if (error) throw error
}

export interface ProjectContribution {
  graha_id: number
  graha_name: string
  graha_color: string | null
  orbit_order: number | null
  user_id: string
  display_name: string | null
  email: string | null
  total_count: number
}

/** Who chanted how much on each graha — the audit trail behind the
 *  aggregate completed_count shown on the progress bars. */
export async function listProjectContributions(
  projectId: string
): Promise<ProjectContribution[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('list_project_contributions', {
    p_project_id: projectId,
  })
  if (error) throw error
  return (data ?? []) as ProjectContribution[]
}

export interface ShareCodeRow {
  beneficiary_name: string
  beneficiary_gotra: string | null
  beneficiary_nakshatra: string | null
  intention: string | null
  description: string | null
  status: string
  created_at: string
  completed_at: string | null
  deadline: string | null
  graha_name: string
  graha_color: string | null
  target_count: number
  completed_count: number
}

/** No-account read used by the beneficiary page and the certificate page. */
export async function getProjectByShareCode(code: string): Promise<ShareCodeRow[]> {
  const supabase = createClient()
  const { data, error } = await supabase.rpc('project_progress_by_share_code', {
    p_share_code: code,
  })
  if (error) throw error
  return (data ?? []) as ShareCodeRow[]
}

/** Japas/day needed to finish `remaining` by `deadline`. Null once there's
 *  no deadline or nothing left. daysLeft <= 0 means the deadline has passed. */
export function dailyQuota(
  remaining: number,
  deadline: string | null
): { daysLeft: number; perDay: number } | null {
  if (!deadline || remaining <= 0) return null
  const today = new Date(new Date().toLocaleDateString('sv'))
  const due = new Date(deadline)
  const daysLeft = Math.ceil((due.getTime() - today.getTime()) / 86_400_000)
  return { daysLeft, perDay: Math.ceil(remaining / Math.max(daysLeft, 1)) }
}
