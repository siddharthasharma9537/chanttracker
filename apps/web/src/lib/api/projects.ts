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
  description?: string
  grahas: { grahaId: number; targetCount: number }[]
}): Promise<ProjectRow> {
  const supabase = createClient()
  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      organizer_id: input.userId,
      beneficiary_name: input.beneficiaryName,
      description: input.description || null,
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
