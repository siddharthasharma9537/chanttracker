// SoHum/Vani API contract actions for ChantTracker.
// See docs/SOHUM_VANI_CONTRACT.md in the workspace root.
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

const MANIFEST = {
  product: 'chanttracker',
  version: '1.0',
  actions: [
    {
      name: 'list_mantras',
      kind: 'read',
      description: 'List active mantras (navagraha, devata, custom) with display text',
      method: 'GET',
      path: '/vani-actions/list_mantras',
      params: {},
    },
    {
      name: 'get_practice_status',
      kind: 'read',
      description: "Get the caller's current streak and today's completed japa count",
      method: 'GET',
      path: '/vani-actions/get_practice_status',
      params: {},
    },
    {
      name: 'log_chant_session',
      kind: 'write',
      description: 'Log a completed chanting session (personal practice, not a project)',
      propose: { method: 'POST', path: '/vani-actions/log_chant_session/propose' },
      confirm: { method: 'POST', path: '/vani-actions/log_chant_session/confirm' },
      params: {
        mantra_id: 'string (uuid, from list_mantras)',
        count: 'integer (japa count)',
        duration_secs: 'integer (optional)',
      },
    },
  ],
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

  const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString()
  const payload = {
    action: 'log_chant_session',
    user_id: userId,
    mantra_id: mantraId,
    count,
    duration_secs: durationSecs ?? null,
    expires_at: expiresAt,
  }
  const proposalId = await signProposal(payload)

  return json({
    data: {
      proposal_id: proposalId,
      summary_en: `Log ${count} japas of ${mantra.name_en ?? mantra.name_te}`,
      summary_te: `${mantra.name_te ?? mantra.name_en} యొక్క ${count} జపాలు నమోదు చేయండి`,
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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: CORS_HEADERS })
  }

  const url = new URL(req.url)
  const route = url.pathname.replace(/^\/vani-actions\/?/, '')

  if (route === 'manifest' && req.method === 'GET') {
    return json(MANIFEST)
  }

  const auth = await requireUserId(req)
  if (auth instanceof Response) return auth
  const { userId, client } = auth

  if (route === 'list_mantras' && req.method === 'GET') {
    return listMantras(client)
  }
  if (route === 'get_practice_status' && req.method === 'GET') {
    return getPracticeStatus(client, userId)
  }
  if (route === 'log_chant_session/propose' && req.method === 'POST') {
    return proposeLogChantSession(client, userId, req)
  }
  if (route === 'log_chant_session/confirm' && req.method === 'POST') {
    return confirmLogChantSession(client, userId, req)
  }

  return errorResponse('NOT_FOUND', `Unknown route: ${route}`, 'తెలియని మార్గం', 404)
})
