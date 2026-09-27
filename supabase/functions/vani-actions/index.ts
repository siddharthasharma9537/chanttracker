// SoHum/Vani API contract actions for ChantTracker.
// See github.com/SoHum-Digital-Services/sohum-contracts (docs/SOHUM_VANI_CONTRACT.md).
//
// ChantTracker has no custom backend by design (AGENTS.md): business
// logic lives in Postgres, the web app talks to Supabase directly. This
// function is the one exception -- it's the narrow, described surface a
// cross-product assistant (Vani) is allowed to call, so Vani never needs
// the Supabase service role key (which would bypass RLS entirely). Every
// read here runs as the calling user via their forwarded JWT, so Row
// Level Security applies exactly as it does in the web app. Only the
// idempotency ledger (vani_action_confirmations) is service-role, since
// its own RLS intentionally denies all direct client access.
//
// verify_jwt is disabled at the platform level because this function
// implements its own auth: manifest is deliberately public (no auth --
// it's a schema, not user data), while every other route requires and
// validates a forwarded Supabase JWT itself via requireUserId() below.
// Platform-level verify_jwt would reject the public manifest call before
// this code ever runs.

import { createClient, type SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
// Signs stateless propose->confirm tokens so a proposal doesn't need its
// own DB table -- confirm re-validates the signed payload instead of
// looking anything up. Must be set as a function secret before deploy.
const PROPOSAL_SECRET = Deno.env.get('VANI_PROPOSAL_SECRET')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
}

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  })
}

function errorResponse(code: string, message_en: string, message_te: string, status = 400): Response {
  return json({ error: { code, message_en, message_te } }, status)
}

function userClient(authHeader: string): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  })
}

function serviceClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SERVICE_ROLE_KEY)
}

async function requireUserId(req: Request): Promise<{ userId: string; client: SupabaseClient } | Response> {
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return errorResponse('UNAUTHORIZED', 'Missing SoHum identity token', 'SoHum గుర్తింపు టోకెన్ లేదు', 401)
  }
  const client = userClient(authHeader)
  const { data, error } = await client.auth.getUser()
  if (error || !data.user) {
    return errorResponse('UNAUTHORIZED', 'Invalid or expired token', 'చెల్లని లేదా గడువు ముగిసిన టోకెన్', 401)
  }
  return { userId: data.user.id, client }
}

async function hmac(body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(PROPOSAL_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign'],
  )
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(body))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

async function signProposal(payload: Record<string, unknown>): Promise<string> {
  const body = JSON.stringify(payload)
  const sig = await hmac(body)
  return `${btoa(body)}.${sig}`
}

async function verifyProposal(token: string): Promise<Record<string, unknown> | null> {
  const [bodyB64, sig] = token.split('.')
  if (!bodyB64 || !sig) return null
  const body = atob(bodyB64)
  const expected = await hmac(body)
  if (expected !== sig) return null
  try {
    return JSON.parse(body)
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------
// Action registry. This is the single source of truth for both routing
// and the published manifest (see buildManifest below) -- adding the
// next action (there will be more: projects, achievements, and whatever
// the other ~10 SoHum verticals eventually need) is one entry here, not
// a route to wire up separately and a manifest entry to keep in sync by
// hand.
// ---------------------------------------------------------------------

interface ActionContext {
  client: SupabaseClient
  userId: string
  req: Request
}

interface ReadAction {
  kind: 'read'
  description: string
  params: Record<string, string>
  handler: (ctx: ActionContext) => Promise<Response>
}

interface WriteAction {
  kind: 'write'
  description: string
  params: Record<string, string>
  propose: (ctx: ActionContext) => Promise<Response>
  confirm: (ctx: ActionContext) => Promise<Response>
}

type ActionDef = ReadAction | WriteAction

const ACTIONS: Record<string, ActionDef> = {
  list_mantras: {
    kind: 'read',
    description: 'List active mantras (navagraha, devata, custom) with display text',
    params: {},
    handler: ({ client }) => listMantras(client),
  },
  get_practice_status: {
    kind: 'read',
    description: "Get the caller's current streak and today's completed japa count",
    params: {},
    handler: ({ client, userId }) => getPracticeStatus(client, userId),
  },
  log_chant_session: {
    kind: 'write',
    description: 'Log a completed chanting session (personal practice, or towards a global yajna)',
    params: {
      mantra_id: 'string (uuid, from list_mantras)',
      count: 'integer (japa count)',
      duration_secs: 'integer (optional)',
      yajna_id: "string (uuid, optional, from list_yajnas -- rolls this session into that yajna's collective count)",
    },
    propose: ({ client, userId, req }) => proposeLogChantSession(client, userId, req),
    confirm: ({ client, userId, req }) => confirmLogChantSession(client, userId, req),
  },
  get_anushthana_status: {
    kind: 'read',
    description: "Get the caller's active anushthanas (multi-day japa vows) and their day-by-day progress",
    params: {},
    handler: ({ client }) => getAnushthanaStatus(client),
  },
  log_anushthana_day: {
    kind: 'write',
    description: "Mark today's day complete on an active anushthana (fails if the daily target wasn't met, or today was already marked)",
    params: {
      anushthana_id: 'string (uuid, from get_anushthana_status)',
      achieved_count: 'integer (japas completed today)',
    },
    propose: ({ client, userId, req }) => proposeLogAnushthanaDay(client, userId, req),
    confirm: ({ client, userId, req }) => confirmLogAnushthanaDay(client, userId, req),
  },
  get_sankalpa_status: {
    kind: 'read',
    description: "Get the caller's active sankalpa (daily intention) for today, if one is set",
    params: {},
    handler: ({ client, userId }) => getSankalpaStatus(client, userId),
  },
  log_sankalpa_progress: {
    kind: 'write',
    description: "Add to today's sankalpa progress (fails if no active sankalpa is set for today)",
    params: {
      delta: 'integer (japas to add towards the target)',
    },
    propose: ({ client, userId, req }) => proposeLogSankalpaProgress(client, userId, req),
    confirm: ({ client, userId, req }) => confirmLogSankalpaProgress(client, userId, req),
  },
  list_yajnas: {
    kind: 'read',
    description: 'List active global yajnas (open, joinable collective japa campaigns) with collective progress',
    params: {},
    handler: ({ client }) => listYajnasStatus(client),
  },
  join_yajna: {
    kind: 'write',
    description: 'Join a global yajna so future logged sessions can contribute to its leaderboard',
    params: {
      yajna_id: 'string (uuid, from list_yajnas)',
    },
    propose: ({ client, userId, req }) => proposeJoinYajna(client, userId, req),
    confirm: ({ client, userId, req }) => confirmJoinYajna(client, userId, req),
  },
}

function buildManifest() {
  return {
    product: 'chanttracker',
    version: '1.0',
    actions: Object.entries(ACTIONS).map(([name, action]) =>
      action.kind === 'read'
        ? {
            name,
            kind: 'read',
            description: action.description,
            method: 'GET',
            path: `/vani-actions/${name}`,
            params: action.params,
          }
        : {
            name,
            kind: 'write',
            description: action.description,
            propose: { method: 'POST', path: `/vani-actions/${name}/propose` },
            confirm: { method: 'POST', path: `/vani-actions/${name}/confirm` },
            params: action.params,
          },
    ),
  }
}

async function listMantras(client: SupabaseClient): Promise<Response> {
  const { data, error } = await client
    .from('mantras')
    .select('id, name_en, name_te, deity, category, mantra_type, default_target')
    .eq('is_active', true)
    .or('is_archived.is.null,is_archived.eq.false')
  if (error) return errorResponse('QUERY_FAILED', error.message, 'ప్రశ్న విఫలమైంది', 500)
  return json({ data })
}

async function getPracticeStatus(client: SupabaseClient, userId: string): Promise<Response> {
  const { data: streak, error: streakError } = await client
    .from('streaks')
    .select('current_streak, longest_streak, last_chant_date')
    .eq('user_id', userId)
    .maybeSingle()
  if (streakError) return errorResponse('QUERY_FAILED', streakError.message, 'ప్రశ్న విఫలమైంది', 500)

  const todayIso = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Kolkata' })
  const { data: sessionsToday, error: sessionsError } = await client
    .from('sessions')
    .select('count')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('completed_at', `${todayIso}T00:00:00+05:30`)
    .lte('completed_at', `${todayIso}T23:59:59+05:30`)
  if (sessionsError) return errorResponse('QUERY_FAILED', sessionsError.message, 'ప్రశ్న విఫలమైంది', 500)

  const todayTotal = (sessionsToday ?? []).reduce((sum, row) => sum + (row.count ?? 0), 0)

  return json({
    data: {
      current_streak: streak?.current_streak ?? 0,
      longest_streak: streak?.longest_streak ?? 0,
      last_chant_date: streak?.last_chant_date ?? null,
      today_total_japas: todayTotal,
    },
  })
}

async function proposeLogChantSession(client: SupabaseClient, userId: string, req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const mantraId = body?.mantra_id
  const count = Number(body?.count)
  const durationSecs = body?.duration_secs != null ? Number(body.duration_secs) : undefined
  const yajnaId = body?.yajna_id ?? null

  if (!mantraId || !Number.isFinite(count) || count <= 0) {
    return errorResponse(
      'VALIDATION_ERROR',
      'mantra_id and a positive count are required',
      'mantra_id మరియు ధనాత్మక లెక్క అవసరం',
      400,
    )
  }

  const { data: mantra, error } = await client
    .from('mantras')
    .select('id, name_en, name_te')
    .eq('id', mantraId)
    .maybeSingle()
  if (error) return errorResponse('QUERY_FAILED', error.message, 'ప్రశ్న విఫలమైంది', 500)
  if (!mantra) {
    return errorResponse('NOT_FOUND', 'Unknown mantra_id', 'తెలియని mantra_id', 404)
  }

  let yajnaTitle: string | null = null
  if (yajnaId) {
    const { data: yajna, error: yajnaError } = await client
      .from('global_yajnas')
      .select('id, title, status')
      .eq('id', yajnaId)
      .maybeSingle()
    if (yajnaError) return errorResponse('QUERY_FAILED', yajnaError.message, 'ప్రశ్న విఫలమైంది', 500)
    if (!yajna || yajna.status !== 'active') {
      return errorResponse('NOT_FOUND', 'Unknown or inactive yajna_id', 'తెలియని yajna_id', 404)
    }
    yajnaTitle = yajna.title
  }

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const payload = {
    action: 'log_chant_session',
    user_id: userId,
    mantra_id: mantraId,
    count,
    duration_secs: durationSecs ?? null,
    yajna_id: yajnaId,
    expires_at: expiresAt,
  }
  const proposalId = await signProposal(payload)

  const yajnaSuffixEn = yajnaTitle ? ` towards the "${yajnaTitle}" yajna` : ''
  const yajnaSuffixTe = yajnaTitle ? ` "${yajnaTitle}" యజ్ఞం కోసం` : ''

  return json({
    data: {
      proposal_id: proposalId,
      summary_en: `Log ${count} japas of ${mantra.name_en ?? mantra.name_te}${yajnaSuffixEn}`,
      summary_te: `${mantra.name_te ?? mantra.name_en} యొక్క ${count} జపాలు${yajnaSuffixTe} నమోదు చేయండి`,
      expires_at: expiresAt,
      requires_payment_confirmation: false,
    },
  })
}

async function confirmLogChantSession(client: SupabaseClient, userId: string, req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const proposalId = body?.proposal_id
  const idempotencyKey = body?.idempotency_key
  if (!proposalId || !idempotencyKey) {
    return errorResponse(
      'VALIDATION_ERROR',
      'proposal_id and idempotency_key are required',
      'proposal_id మరియు idempotency_key అవసరం',
      400,
    )
  }

  const payload = await verifyProposal(proposalId)
  if (!payload || payload.action !== 'log_chant_session' || payload.user_id !== userId) {
    return errorResponse('INVALID_PROPOSAL', 'Proposal is invalid or was not issued to you', 'ప్రతిపాదన చెల్లదు', 400)
  }
  if (new Date(payload.expires_at as string).getTime() < Date.now()) {
    return errorResponse('PROPOSAL_EXPIRED', 'This proposal has expired, propose again', 'ప్రతిపాదన గడువు ముగిసింది', 409)
  }

  const svc = serviceClient()

  // Idempotency: if this (user, action, key) was already confirmed, return
  // the stored result instead of inserting a second session.
  const { data: existing } = await svc
    .from('vani_action_confirmations')
    .select('result')
    .eq('user_id', userId)
    .eq('action_name', 'log_chant_session')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (existing) {
    return json({ data: existing.result, replayed: true })
  }

  const { data: session, error: insertError } = await client
    .from('sessions')
    .insert({
      user_id: userId,
      mantra_id: payload.mantra_id,
      count: payload.count,
      duration_secs: payload.duration_secs,
      yajna_id: payload.yajna_id ?? null,
      status: 'completed',
      completed_at: new Date().toISOString(),
    })
    .select()
    .single()
  if (insertError) return errorResponse('WRITE_FAILED', insertError.message, 'రాయడం విఫలమైంది', 500)

  // Record confirmation for idempotency. A race between two concurrent
  // confirms with the same key is resolved by the table's unique
  // constraint -- the loser's insert fails, which is fine, the session
  // it already wrote stands (extremely narrow window, acceptable here).
  await svc.from('vani_action_confirmations').insert({
    user_id: userId,
    action_name: 'log_chant_session',
    idempotency_key: idempotencyKey,
    result: session,
  })

  return json({ data: session })
}

async function getAnushthanaStatus(client: SupabaseClient): Promise<Response> {
  const { data: anushthanas, error } = await client
    .from('anushthanas')
    .select('id, title, daily_target_count, total_days, start_date, end_date, status')
    .eq('status', 'active')
    .order('start_date', { ascending: true })
  if (error) return errorResponse('QUERY_FAILED', error.message, 'ప్రశ్న విఫలమైంది', 500)

  const withProgress = await Promise.all(
    (anushthanas ?? []).map(async (a) => {
      const { count } = await client
        .from('anushthana_progress')
        .select('id', { count: 'exact', head: true })
        .eq('anushthana_id', a.id)
      return { ...a, days_done: count ?? 0 }
    }),
  )

  return json({ data: withProgress })
}

async function proposeLogAnushthanaDay(client: SupabaseClient, userId: string, req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const anushthanaId = body?.anushthana_id
  const achievedCount = Number(body?.achieved_count)

  if (!anushthanaId || !Number.isFinite(achievedCount) || achievedCount < 0) {
    return errorResponse(
      'VALIDATION_ERROR',
      'anushthana_id and a non-negative achieved_count are required',
      'anushthana_id మరియు సాధించిన లెక్క అవసరం',
      400,
    )
  }

  const { data: anushthana, error } = await client
    .from('anushthanas')
    .select('id, title, status')
    .eq('id', anushthanaId)
    .maybeSingle()
  if (error) return errorResponse('QUERY_FAILED', error.message, 'ప్రశ్న విఫలమైంది', 500)
  if (!anushthana || anushthana.status !== 'active') {
    return errorResponse('NOT_FOUND', 'Unknown or inactive anushthana_id', 'తెలియని anushthana_id', 404)
  }

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const payload = {
    action: 'log_anushthana_day',
    user_id: userId,
    anushthana_id: anushthanaId,
    achieved_count: achievedCount,
    expires_at: expiresAt,
  }
  const proposalId = await signProposal(payload)

  return json({
    data: {
      proposal_id: proposalId,
      summary_en: `Mark today's day on "${anushthana.title}" with ${achievedCount} japas`,
      summary_te: `"${anushthana.title}" లో ఈరోజు ${achievedCount} జపాలతో నమోదు చేయండి`,
      expires_at: expiresAt,
      requires_payment_confirmation: false,
    },
  })
}

async function confirmLogAnushthanaDay(client: SupabaseClient, userId: string, req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const proposalId = body?.proposal_id
  const idempotencyKey = body?.idempotency_key
  if (!proposalId || !idempotencyKey) {
    return errorResponse(
      'VALIDATION_ERROR',
      'proposal_id and idempotency_key are required',
      'proposal_id మరియు idempotency_key అవసరం',
      400,
    )
  }

  const payload = await verifyProposal(proposalId)
  if (!payload || payload.action !== 'log_anushthana_day' || payload.user_id !== userId) {
    return errorResponse('INVALID_PROPOSAL', 'Proposal is invalid or was not issued to you', 'ప్రతిపాదన చెల్లదు', 400)
  }
  if (new Date(payload.expires_at as string).getTime() < Date.now()) {
    return errorResponse('PROPOSAL_EXPIRED', 'This proposal has expired, propose again', 'ప్రతిపాదన గడువు ముగిసింది', 409)
  }

  const svc = serviceClient()
  const { data: existing } = await svc
    .from('vani_action_confirmations')
    .select('result')
    .eq('user_id', userId)
    .eq('action_name', 'log_anushthana_day')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (existing) {
    return json({ data: existing.result, replayed: true })
  }

  // mark_anushthana_day is SECURITY DEFINER and derives the caller from
  // auth.uid() itself (see 20260927000004_security_definer_hardening.sql) --
  // `client` here carries the forwarded user JWT, so this runs as this user.
  const { data: result, error: rpcError } = await client.rpc('mark_anushthana_day', {
    p_anushthana: payload.anushthana_id,
    p_achieved: payload.achieved_count,
  })
  if (rpcError) return errorResponse('WRITE_FAILED', rpcError.message, 'రాయడం విఫలమైంది', 500)
  if (result?.error) {
    return errorResponse('ACTION_REJECTED', String(result.error), 'చర్య తిరస్కరించబడింది', 409)
  }

  await svc.from('vani_action_confirmations').insert({
    user_id: userId,
    action_name: 'log_anushthana_day',
    idempotency_key: idempotencyKey,
    result,
  })

  return json({ data: result })
}

async function getSankalpaStatus(client: SupabaseClient, userId: string): Promise<Response> {
  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Kolkata' })
  const { data: sankalpa, error } = await client
    .from('sankalpas')
    .select('id, purpose, custom_text, intention_text, target_count, achieved_count, sankalpa_status')
    .eq('user_id', userId)
    .eq('for_date', today)
    .eq('sankalpa_status', 'active')
    .maybeSingle()
  if (error) return errorResponse('QUERY_FAILED', error.message, 'ప్రశ్న విఫలమైంది', 500)
  return json({ data: sankalpa })
}

async function proposeLogSankalpaProgress(client: SupabaseClient, userId: string, req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const delta = Number(body?.delta)
  if (!Number.isFinite(delta) || delta <= 0) {
    return errorResponse('VALIDATION_ERROR', 'A positive delta is required', 'ధనాత్మక delta అవసరం', 400)
  }

  const today = new Date().toLocaleDateString('sv', { timeZone: 'Asia/Kolkata' })
  const { data: sankalpa, error } = await client
    .from('sankalpas')
    .select('id, purpose, custom_text, target_count, achieved_count')
    .eq('user_id', userId)
    .eq('for_date', today)
    .eq('sankalpa_status', 'active')
    .maybeSingle()
  if (error) return errorResponse('QUERY_FAILED', error.message, 'ప్రశ్న విఫలమైంది', 500)
  if (!sankalpa) {
    return errorResponse('NOT_FOUND', 'No active sankalpa set for today', 'ఈరోజుకు సంకల్పం లేదు', 404)
  }

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const payload = {
    action: 'log_sankalpa_progress',
    user_id: userId,
    sankalpa_id: sankalpa.id,
    delta,
    expires_at: expiresAt,
  }
  const proposalId = await signProposal(payload)
  const label = sankalpa.custom_text ?? sankalpa.purpose

  return json({
    data: {
      proposal_id: proposalId,
      summary_en: `Add ${delta} japas to today's "${label}" sankalpa (${sankalpa.achieved_count}/${sankalpa.target_count} so far)`,
      summary_te: `ఈరోజు "${label}" సంకల్పానికి ${delta} జపాలు జోడించండి`,
      expires_at: expiresAt,
      requires_payment_confirmation: false,
    },
  })
}

async function confirmLogSankalpaProgress(client: SupabaseClient, userId: string, req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const proposalId = body?.proposal_id
  const idempotencyKey = body?.idempotency_key
  if (!proposalId || !idempotencyKey) {
    return errorResponse(
      'VALIDATION_ERROR',
      'proposal_id and idempotency_key are required',
      'proposal_id మరియు idempotency_key అవసరం',
      400,
    )
  }

  const payload = await verifyProposal(proposalId)
  if (!payload || payload.action !== 'log_sankalpa_progress' || payload.user_id !== userId) {
    return errorResponse('INVALID_PROPOSAL', 'Proposal is invalid or was not issued to you', 'ప్రతిపాదన చెల్లదు', 400)
  }
  if (new Date(payload.expires_at as string).getTime() < Date.now()) {
    return errorResponse('PROPOSAL_EXPIRED', 'This proposal has expired, propose again', 'ప్రతిపాదన గడువు ముగిసింది', 409)
  }

  const svc = serviceClient()
  const { data: existing } = await svc
    .from('vani_action_confirmations')
    .select('result')
    .eq('user_id', userId)
    .eq('action_name', 'log_sankalpa_progress')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (existing) {
    return json({ data: existing.result, replayed: true })
  }

  // log_sankalpa_progress is SECURITY DEFINER and derives the caller from
  // auth.uid() itself (see 20260927000004_security_definer_hardening.sql).
  const { data: result, error: rpcError } = await client.rpc('log_sankalpa_progress', {
    p_sankalpa: payload.sankalpa_id,
    p_delta: payload.delta,
  })
  if (rpcError) return errorResponse('WRITE_FAILED', rpcError.message, 'రాయడం విఫలమైంది', 500)
  if (result?.error) {
    return errorResponse('ACTION_REJECTED', String(result.error), 'చర్య తిరస్కరించబడింది', 409)
  }

  await svc.from('vani_action_confirmations').insert({
    user_id: userId,
    action_name: 'log_sankalpa_progress',
    idempotency_key: idempotencyKey,
    result,
  })

  return json({ data: result })
}

async function listYajnasStatus(client: SupabaseClient): Promise<Response> {
  const { data, error } = await client
    .from('global_yajnas')
    .select('id, title, description, target_count, completed_count, status')
    .eq('status', 'active')
    .order('created_at', { ascending: false })
  if (error) return errorResponse('QUERY_FAILED', error.message, 'ప్రశ్న విఫలమైంది', 500)
  return json({ data })
}

async function proposeJoinYajna(client: SupabaseClient, userId: string, req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const yajnaId = body?.yajna_id
  if (!yajnaId) {
    return errorResponse('VALIDATION_ERROR', 'yajna_id is required', 'yajna_id అవసరం', 400)
  }

  const { data: yajna, error } = await client
    .from('global_yajnas')
    .select('id, title, status')
    .eq('id', yajnaId)
    .maybeSingle()
  if (error) return errorResponse('QUERY_FAILED', error.message, 'ప్రశ్న విఫలమైంది', 500)
  if (!yajna || yajna.status !== 'active') {
    return errorResponse('NOT_FOUND', 'Unknown or inactive yajna_id', 'తెలియని yajna_id', 404)
  }

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const payload = {
    action: 'join_yajna',
    user_id: userId,
    yajna_id: yajnaId,
    expires_at: expiresAt,
  }
  const proposalId = await signProposal(payload)

  return json({
    data: {
      proposal_id: proposalId,
      summary_en: `Join the "${yajna.title}" yajna`,
      summary_te: `"${yajna.title}" యజ్ఞంలో చేరండి`,
      expires_at: expiresAt,
      requires_payment_confirmation: false,
    },
  })
}

async function confirmJoinYajna(client: SupabaseClient, userId: string, req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const proposalId = body?.proposal_id
  const idempotencyKey = body?.idempotency_key
  if (!proposalId || !idempotencyKey) {
    return errorResponse(
      'VALIDATION_ERROR',
      'proposal_id and idempotency_key are required',
      'proposal_id మరియు idempotency_key అవసరం',
      400,
    )
  }

  const payload = await verifyProposal(proposalId)
  if (!payload || payload.action !== 'join_yajna' || payload.user_id !== userId) {
    return errorResponse('INVALID_PROPOSAL', 'Proposal is invalid or was not issued to you', 'ప్రతిపాదన చెల్లదు', 400)
  }
  if (new Date(payload.expires_at as string).getTime() < Date.now()) {
    return errorResponse('PROPOSAL_EXPIRED', 'This proposal has expired, propose again', 'ప్రతిపాదన గడువు ముగిసింది', 409)
  }

  const svc = serviceClient()
  const { data: existing } = await svc
    .from('vani_action_confirmations')
    .select('result')
    .eq('user_id', userId)
    .eq('action_name', 'join_yajna')
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()
  if (existing) {
    return json({ data: existing.result, replayed: true })
  }

  const { data: result, error: upsertError } = await client
    .from('yajna_participants')
    .upsert(
      { yajna_id: payload.yajna_id, user_id: userId, contributed_count: 0 },
      { onConflict: 'yajna_id,user_id', ignoreDuplicates: true },
    )
    .select()
    .maybeSingle()
  if (upsertError) return errorResponse('WRITE_FAILED', upsertError.message, 'రాయడం విఫలమైంది', 500)

  await svc.from('vani_action_confirmations').insert({
    user_id: userId,
    action_name: 'join_yajna',
    idempotency_key: idempotencyKey,
    result: result ?? { yajna_id: payload.yajna_id, already_joined: true },
  })

  return json({ data: result ?? { yajna_id: payload.yajna_id, already_joined: true } })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  const url = new URL(req.url)
  const route = url.pathname.replace(/^\/vani-actions\/?/, '')
  const [actionName, step] = route.split('/')

  if (actionName === 'manifest' && req.method === 'GET') {
    return json(buildManifest())
  }

  const action = ACTIONS[actionName]
  if (!action) {
    return errorResponse('NOT_FOUND', `Unknown action: ${actionName}`, 'తెలియని చర్య', 404)
  }

  const auth = await requireUserId(req)
  if (auth instanceof Response) return auth
  const ctx: ActionContext = { client: auth.client, userId: auth.userId, req }

  if (action.kind === 'read') {
    if (step || req.method !== 'GET') {
      return errorResponse('NOT_FOUND', `Unknown route: ${route}`, 'తెలియని మార్గం', 404)
    }
    return action.handler(ctx)
  }

  if (req.method !== 'POST') {
    return errorResponse('NOT_FOUND', `Unknown route: ${route}`, 'తెలియని మార్గం', 404)
  }
  if (step === 'propose') return action.propose(ctx)
  if (step === 'confirm') return action.confirm(ctx)
  return errorResponse('NOT_FOUND', `Unknown route: ${route}`, 'తెలియని మార్గం', 404)
})
