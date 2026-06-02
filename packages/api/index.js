// ChantTracker · Unified Supabase Client
// Integrates: chanttracker-app (GitHub) + Supabase backend (this session)
// npm i @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

if (!URL || !KEY) {
  console.error('Missing Supabase environment variables:', { URL: !!URL, KEY: !!KEY })
  throw new Error('Supabase configuration is missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY environment variables.')
}

export const supabase = createClient(URL, KEY, {
  auth: { persistSession: true, autoRefreshToken: true },
})

/* ─────────────────────────── AUTH ─────────────────────────── */
export const signUp = (email, password, display_name, preferred_language = 'en') =>
  supabase.auth.signUp({ email, password, options: { data: { full_name: display_name, preferred_language } } })
export const signIn  = (email, password) => supabase.auth.signInWithPassword({ email, password })
export const signOut = () => supabase.auth.signOut()
export const me      = async () => (await supabase.auth.getUser()).data.user

/* ─────────────────────── DASHBOARD ────────────────────────── */
// Unified dashboard: today's progress + streak + panchang + active anushthanas
// Returns: { done, target, pct, streak, total }
export const getDashboard = () => supabase.rpc('get_today_progress')

// Panchang (public — no auth needed) returns { tithi, nakshatra, weekday_lord, mantra_name }
export const getPanchang = (date = null) =>
  supabase.rpc('panchang', { for_date: date ?? new Date().toISOString().slice(0, 10) })

// Weekly chart (7-day history for the stats sparkline) returns { date, day_of_week, total_count }
export const getWeeklyChart = () =>
  supabase.from('v_weekly_chart').select('*').order('date')

// User lifetime stats returns { lifetime_count, active_days, avg_daily }
export const getUserStats = () =>
  supabase.from('v_user_stats').select('*').single()

// Top mantra returns { id, name, name_te, total_count }
export const getTopMantra = () =>
  supabase.from('v_top_mantra').select('*').single()

/* ─────────────────────────── PROFILE ──────────────────────── */
export const getProfile   = (uid) => supabase.from('profiles').select('*').eq('id', uid).single()
export const updateProfile = (uid, patch) => supabase.from('profiles').update(patch).eq('id', uid)
// patch can include: display_name, preferred_language (te/hi/en/sa), timezone,
//                    daily_goal, theme, haptics_enabled, chant_sound_enabled, reminder_time

/* ──────────────────────── MANTRA CATALOG ──────────────────── */
// Full catalog — system + user custom (RLS-scoped)
export const listMantras = (filters = {}) => {
  let q = supabase.from('mantras').select('*').eq('is_active', true)
  if (filters.category)   q = q.eq('category', filters.category)   // navagraha|devata|beeja|custom
  if (filters.mantra_type)q = q.eq('mantra_type', filters.mantra_type) // graha|adhidevata|pratyadhidevata|devata
  if (filters.weekday !== undefined) q = q.contains('weekday_tags', [filters.weekday]) // 0=Mon..6=Sun
  return q.order('category').order('mantra_type')
}

// Navagraha grouped (matches GitHub's GET /mantras/navagraha)
export const getNavagraha = () =>
  supabase.from('mantras').select(`
    *, children:mantras!parent_graha_id(*)
  `).eq('mantra_type', 'graha').eq('is_active', true).order('accent_color')

// Today's recommended mantras — fetches mantras for current weekday (0=Mon..6=Sun)
export const getMantrasForToday = () => {
  const dow = ((new Date().getDay() + 6) % 7) // JS getDay() returns 0=Sun, convert to 0=Mon
  return supabase.rpc('mantras_for_weekday', { p_dow: dow })
}

// One mantra by slug
export const getMantra = (slug) => supabase.from('mantras').select('*').eq('slug', slug).single()

export const addCustomMantra = (uid, m) =>
  supabase.from('mantras').insert({ ...m, owner_id: uid })

/* ───────────────────────── CHANT SESSIONS ─────────────────── */
// Session lifecycle: start → (increment*N) → complete | abandon
// Matches GitHub's POST /sessions → POST /sessions/{id}/increment → POST /sessions/{id}/complete

export const startSession = (uid, mantraId, sankalpId = null, anushthanaId = null) =>
  supabase.from('chant_sessions').insert({
    user_id: uid, mantra_id: mantraId, mode: 'counter',
    count: 0, target: 108, session_status: 'active',
    sankalpa_id: sankalpId, anushthana_id: anushthanaId,
    started_at: new Date().toISOString(),
  }).select().single()

export const completeSession = (sessionId, count, durationSecs) =>
  supabase.rpc('complete_chant_session', {
    p_session_id: sessionId,
    p_count: count,
    p_duration_secs: durationSecs,
  })

export const abandonSession = (sessionId) =>
  supabase.from('chant_sessions').update({ session_status: 'abandoned', ended_at: new Date().toISOString() })
    .eq('id', sessionId)

// List sessions (matches GitHub's GET /sessions?status=)
export const listSessions = (uid, status = null, limit = 50) => {
  let q = supabase.from('chant_sessions')
    .select('*, mantras(devanagari,transliteration,accent_color,slug)')
    .eq('user_id', uid).order('started_at', { ascending: false }).limit(limit)
  if (status) q = q.eq('session_status', status)
  return q
}

/* ────────────────────── SANKALPA (daily intent) ───────────── */
// Matches GitHub's POST /sankalpas, GET /sankalpas, GET /sankalpas/today
export const createSankalpa = (uid, mantraId, targetCount, intentionText = null, purpose = 'spiritual_growth') =>
  supabase.from('sankalpas').insert({
    user_id: uid, mantra_id: mantraId,
    for_date: new Date().toLocaleDateString('sv'),  // YYYY-MM-DD in local tz
    target_count: targetCount, achieved_count: 0,
    sankalpa_status: 'active', purpose,
    intention_text: intentionText,
  }).select().single()

export const getTodaySankalpas = (uid) =>
  supabase.from('sankalpas')
    .select('*, mantras(devanagari,transliteration,accent_color)')
    .eq('user_id', uid)
    .eq('for_date', new Date().toLocaleDateString('sv'))

export const listSankalpas = (uid, status = null, limit = 50) => {
  let q = supabase.from('sankalpas')
    .select('*, mantras(devanagari,transliteration)')
    .eq('user_id', uid).order('for_date', { ascending: false }).limit(limit)
  if (status) q = q.eq('sankalpa_status', status)
  return q
}

/* ──────────────────── ANUSHTHANA (multi-day vow) ──────────── */
// Matches GitHub's full anushthana lifecycle
export const createAnushthana = (uid, { mantraId, title, intention, dailyTarget, totalDays, strictMode = true }) => {
  const start = new Date().toLocaleDateString('sv')
  const end = new Date(Date.now() + (totalDays - 1) * 86400000).toLocaleDateString('sv')
  return supabase.from('anushthanas').insert({
    user_id: uid, mantra_id: mantraId, title, intention,
    daily_target_count: dailyTarget, total_days: totalDays,
    start_date: start, end_date: end,
    strict_mode: strictMode, status: 'active',
  }).select().single()
}

export const listAnushthanas = (uid, status = null) => {
  let q = supabase.from('anushthanas')
    .select('*, mantras(devanagari,transliteration,accent_color), anushthana_progress(*)')
    .eq('user_id', uid).order('created_at', { ascending: false })
  if (status) q = q.eq('status', status)
  return q
}

// Mark today complete — fires trigger that detects breaks + completes the vow
export const markAnushthanaDay = (anushthanaId, achievedCount) =>
  supabase.rpc('mark_anushthana_day', {
    p_anushthana_id: anushthanaId,
    p_achieved_count: achievedCount,
  })

export const abandonAnushthana = (anushthanaId) =>
  supabase.from('anushthanas').update({ status: 'abandoned' }).eq('id', anushthanaId)

/* ──────────────────────── GOALS ────────────────────────────── */
export const listGoals   = (uid) => supabase.from('goals').select('*').eq('user_id', uid)
export const updateGoal  = (uid, period, target) =>
  supabase.from('goals').upsert({ user_id: uid, period, target_japas: target }, { onConflict: 'user_id,period' })

/* ─────────────────────── STREAKS ───────────────────────────── */
export const getStreak = (uid) =>
  supabase.from('streaks').select('current_streak,longest_streak,last_chant_date').eq('user_id', uid).single()

/* ──────────────────── ACHIEVEMENTS (badges) ───────────────── */
export const allBadges = () => supabase.from('achievements').select('*').order('sort_order')
export const myBadges  = (uid) =>
  supabase.from('user_achievements').select('unlocked_at, achievements(*)').eq('user_id', uid)

/* ─────────────────── HISTORY / STATISTICS ──────────────────── */
export const dailyHistory = (uid, date) =>
  supabase.from('chant_sessions')
    .select('*, mantras(devanagari,transliteration,accent_color)')
    .eq('user_id', uid).eq('chant_date', date).order('started_at')

/* ══════════════════════════════════════════════════════════════
   HOST / DELEGATION SYSTEM: Project management + priest assignments
   ══════════════════════════════════════════════════════════════ */

/* ───────────────────── PROJECT MANAGEMENT ───────────────────── */

/**
 * create_project(host_priest_id, client_name, description, graha_ids)
 * Creates a new delegation project with optional initial grahas.
 * @param {UUID} hostPriestId - ID of priest hosting the project
 * @param {string} clientName - Name of the client/requester
 * @param {string} [description] - Optional project description
 * @param {UUID[]} [grahaIds] - Array of graha IDs to include (default: 108000 target per graha)
 * @returns {Promise} { project_id, status, total_target_count }
 */
export const createProject = (hostPriestId, clientName, description = null, grahaIds = null) =>
  supabase.rpc('create_project', {
    p_host_priest_id: hostPriestId,
    p_client_name: clientName,
    p_description: description,
    p_graha_ids: grahaIds,
  })

/**
 * assign_priests(project_id, priestAssignments)
 * Bulk assigns priests to grahas within a project.
 * @param {UUID} projectId - Project ID
 * @param {Object[]} priestAssignments - Array of assignment objects:
 *   { priest_id: UUID, priest_name: string, assigned_graha_ids: UUID[] }
 * @returns {Promise} { success, assigned_count }
 */
export const assignPriests = (projectId, priestAssignments) =>
  supabase.rpc('assign_priests', {
    p_project_id: projectId,
    p_priest_assignments: priestAssignments,
  })

/**
 * get_project_status(project_id)
 * Retrieves comprehensive project status with graha-level breakdown and priest assignments.
 * @param {UUID} projectId - Project ID
 * @returns {Promise} {
 *   client_name, status, overall_completion_pct, total_target, total_completed,
 *   graha_breakdown: [{graha_id, graha_name, target, completed, completion_pct, assigned_priests}...]
 * }
 */
export const getProjectStatus = (projectId) =>
  supabase.rpc('get_project_status', {
    p_project_id: projectId,
  })

/* ───────────────────── PRIEST DASHBOARD ───────────────────── */

/**
 * get_priest_assignments(project_id, priest_id)
 * Lists all assigned grahas for a priest within a project.
 * @param {UUID} projectId - Project ID
 * @param {UUID} priestId - Priest ID
 * @returns {Promise} [{graha_id, graha_name, target, completed, completion_pct, assignment_type}...]
 */
export const getPriestAssignments = (projectId, priestId) =>
  supabase.rpc('get_priest_assignments', {
    p_project_id: projectId,
    p_priest_id: priestId,
  })

/**
 * get_priest_dashboard(project_id, priest_id)
 * Returns assigned grahas + all incomplete grahas available for volunteering.
 * @param {UUID} projectId - Project ID
 * @param {UUID} priestId - Priest ID
 * @returns {Promise} [{
 *   graha_id, graha_name, target, completed, completion_pct,
 *   assignment_type ('assigned'|'unassigned'),
 *   can_volunteer (boolean)
 * }...]
 */
export const getPriestDashboard = (projectId, priestId) =>
  supabase.rpc('get_priest_dashboard', {
    p_project_id: projectId,
    p_priest_id: priestId,
  })

/* ────────────────────── SESSION LOGGING ─────────────────────── */

/**
 * log_delegation_session(project_id, priest_id, graha_id, count, duration_secs, assignment_type)
 * Logs a chanting session for a priest on a graha within a project.
 * Automatically updates project_grahas.completed_count and projects.overall_completion_pct.
 * @param {UUID} projectId - Project ID
 * @param {UUID} priestId - Priest ID logging the session
 * @param {UUID} grahaId - Graha ID
 * @param {number} count - Number of japas completed
 * @param {number} [durationSecs] - Optional duration in seconds
 * @param {string} [assignmentType] - 'assigned' or 'volunteer' (default: 'assigned')
 * @returns {Promise} { session_id, session_date }
 */
export const logDelegationSession = (projectId, priestId, grahaId, count, durationSecs = null, assignmentType = 'assigned') =>
  supabase.rpc('log_delegation_session', {
    p_project_id: projectId,
    p_priest_id: priestId,
    p_graha_id: grahaId,
    p_count: count,
    p_duration_secs: durationSecs,
    p_assignment_type: assignmentType,
  })

/* ──────────────────────── CONTRIBUTIONS ─────────────────────── */

/**
 * get_graha_contributions(project_id, graha_id)
 * Aggregates all priests working on a specific graha within a project.
 * @param {UUID} projectId - Project ID
 * @param {UUID} grahaId - Graha ID
 * @returns {Promise} [{priest_id, priest_name, completed_count, assignment_type, sessions_count}...]
 */
export const getGrahaContributions = (projectId, grahaId) =>
  supabase.rpc('get_graha_contributions', {
    p_project_id: projectId,
    p_graha_id: grahaId,
  })

/**
 * get_priest_contributions(project_id, priest_id)
 * Shows both assigned and volunteer work for a priest across all grahas in a project.
 * @param {UUID} projectId - Project ID
 * @param {UUID} priestId - Priest ID
 * @returns {Promise} [{
 *   graha_id, graha_name, target, completed, completion_pct,
 *   assignment_type, sessions_count
 * }...]
 */
export const getPriestContributions = (projectId, priestId) =>
  supabase.rpc('get_priest_contributions', {
    p_project_id: projectId,
    p_priest_id: priestId,
  })

/* ──────────────────────── HISTORY & REPORTS ─────────────────── */

/**
 * get_project_history(project_id, start_date, end_date, priest_id, graha_id)
 * Retrieves detailed session history with optional filtering.
 * @param {UUID} projectId - Project ID
 * @param {Date|string} [startDate] - Filter from this date (YYYY-MM-DD)
 * @param {Date|string} [endDate] - Filter to this date (YYYY-MM-DD)
 * @param {UUID} [priestId] - Filter by priest
 * @param {UUID} [grahaId] - Filter by graha
 * @returns {Promise} [{
 *   session_date, priest_name, priest_id, graha_name, graha_id,
 *   count, duration_secs, assignment_type, session_id
 * }...]
 */
export const getProjectHistory = (
  projectId,
  startDate = null,
  endDate = null,
  priestId = null,
  grahaId = null
) =>
  supabase.rpc('get_project_history', {
    p_project_id: projectId,
    p_start_date: startDate,
    p_end_date: endDate,
    p_priest_id: priestId,
    p_graha_id: grahaId,
  })

/**
 * complete_delegation_project(project_id)
 * Marks a project as completed with timestamp.
 * @param {UUID} projectId - Project ID
 * @returns {Promise} { success, completion_timestamp }
 */
export const completeDelegationProject = (projectId) =>
  supabase.rpc('complete_delegation_project', {
    p_project_id: projectId,
  })

/* ──────────────────── DELEGATION VIEWS (raw queries) ──────────── */

/**
 * listProjects(hostPriestId)
 * Lists all projects hosted by a priest.
 */
export const listProjects = (hostPriestId) =>
  supabase.from('projects')
    .select('*')
    .eq('host_priest_id', hostPriestId)
    .order('created_at', { ascending: false })

/**
 * getProjectById(projectId)
 * Retrieves a single project by ID.
 */
export const getProjectById = (projectId) =>
  supabase.from('projects')
    .select('*')
    .eq('id', projectId)
    .single()

/**
 * listDelegationSessions(projectId, limit)
 * Lists recent delegation sessions for a project.
 */
export const listDelegationSessions = (projectId, limit = 50) =>
  supabase.from('delegation_sessions')
    .select('*, grahas(name), profiles(display_name)')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(limit)

/**
 * Direct view access for analytics
 * v_project_status — Project-level breakdown
 * v_priest_contributions — Per-priest per-project summary
 * v_graha_contributions — Per-graha contributor aggregation
 */
export const viewProjectStatus = (projectId) =>
  supabase.from('v_project_status')
    .select('*')
    .eq('id', projectId)
    .single()

export const viewPriestContributions = (priestId) =>
  supabase.from('v_priest_contributions')
    .select('*')
    .eq('priest_id', priestId)

export const viewGrahaContributions = (projectId, grahaId) =>
  supabase.from('v_graha_contributions')
    .select('*')
    .eq('project_id', projectId)
    .eq('graha_id', grahaId)
