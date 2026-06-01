export interface Graha {
  id: string
  name: string
  position: number
  day_of_week: number | null
  color: string | null
  created_at: string
}

export interface PriestAssignment {
  priestName: string
  assignedGrahas: string[] // array of graha IDs
}

export interface HostProjectFormData {
  clientName: string
  selectedGrahas: string[] // array of graha IDs
  hostPriestName: string
  priestAssignments: PriestAssignment[]
}

export interface ProjectCreateResponse {
  project_id: string
  status: string
  total_target_count: number
}

export interface AssignedPriest {
  priest_id: string
  priest_name: string
  assignment_type: string
}

export interface ProjectGrahaBreakdown {
  graha_id: string
  graha_name: string
  target: number
  completed: number
  completion_pct: number
  assigned_priests?: AssignedPriest[]
}

export interface ProjectStatus {
  client_name: string
  status: string
  overall_completion_pct: number
  total_target: number
  total_completed: number
  graha_breakdown: ProjectGrahaBreakdown[]
}
