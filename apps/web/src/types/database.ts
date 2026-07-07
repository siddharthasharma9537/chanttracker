// Minimal hand-maintained DB types for the tables/RPCs v2 actually uses.
// Regenerate-and-trim from `supabase gen types` when the schema changes.

export type MantraCategory = 'navagraha' | 'devata' | 'beeja' | 'custom'
export type MantraType = 'graha' | 'adhidevata' | 'pratyadhidevata' | 'devata' | 'salutation'
export type SessionStatus = 'active' | 'completed' | 'abandoned'

export interface MantraRow {
  id: string
  name_en: string | null
  name_te: string | null
  deity: string | null
  category: MantraCategory | null
  mantra_type: MantraType | null
  parent_graha_id: string | null
  default_target: number
  accent_color: string | null
  weekday_tags: number[] | null
  owner_id: string | null
  is_active: boolean
  is_archived: boolean | null
}

export interface MantraTextRow {
  id: string
  mantra_id: string
  lang: string
  script: string
  text: string
  has_swaras: boolean
}

export interface GrahaRow {
  id: number
  name: string
  english: string | null
  color: string | null
  orbit_order: number | null
  mantra_id: string | null
}

export interface SessionRow {
  id: string
  user_id: string
  mantra_id: string | null
  count: number
  duration_secs: number | null
  status: SessionStatus
  project_id: string | null
  graha_id: number | null
  started_at: string
  completed_at: string | null
}

export interface ProjectRow {
  id: string
  organizer_id: string
  beneficiary_name: string
  description: string | null
  status: 'active' | 'completed' | 'archived'
  invite_code: string
  share_code: string
  created_at: string
}

export interface ProjectGrahaRow {
  id: string
  project_id: string
  graha_id: number
  target_count: number
  completed_count: number
}

export interface ProjectMemberRow {
  id: string
  project_id: string
  user_id: string
  role: 'organizer' | 'chanter'
  assigned_graha_ids: number[]
  created_at: string
}

// Kept loose on purpose: we don't rely on supabase-js deep type inference.
export type Database = any
