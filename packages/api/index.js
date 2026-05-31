// ChantTracker · Unified Supabase Client
// Integrates: chanttracker-app (GitHub) + Supabase backend (this session)
// npm i @supabase/supabase-js

import { createClient } from '@supabase/supabase-js'

const URL = import.meta.env.VITE_SUPABASE_URL
const KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

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
// Returns: { done, target, pct, streak, total, active_anushthanas, weekday, tithi, weekday_lord }
export const getDashboard = () => supabase.rpc('get_today_progress')

// Panchang (public — no auth needed) matches GitHub's GET /api/v1/panchang
export const getPanchang = (date = null, lat = 23.1765, lon = 75.7885) =>
  supabase.rpc('panchang', { p_date: date ?? new Date().toISOString().slice(0, 10), p_lat: lat, p_lon: lon })

// Weekly chart (7-day history for the stats sparkline)
export const getWeeklyChart = (uid) =>
  supabase.from('v_weekly_chart').select('*').eq('user_id', uid).order('chant_date')

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

// Today's recommended mantras (matches GitHub's GET /mantras/today)
export const getMantrasForToday = () => {
  const dow = ((new Date().getDay() + 6) % 7) // 0=Mon..6=Sun
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

export const completeSession = (sessionId, count, durationSecs, japasPerMin, voiceAccuracy = null) =>
  supabase.from('chant_sessions').update({
    count, duration_seconds: durationSecs, japas_per_min: japasPerMin,
    voice_accuracy: voiceAccuracy, session_status: 'completed',
    ended_at: new Date().toISOString(),
  }).eq('id', sessionId).select().single()

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
export const markAnushthanaDay = (uid, anushthanaId, achievedCount) =>
  supabase.rpc('mark_anushthana_day', {
    p_user: uid, p_anushthana: anushthanaId, p_achieved: achievedCount,
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

export const userStats = (uid) => supabase.from('v_user_stats').select('*').eq('user_id', uid).single()
export const topMantra = (uid) => supabase.from('v_top_mantra').select('*').eq('user_id', uid).single()
