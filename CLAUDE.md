# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current state: early scaffold, not the documented system

The README and `docs/` describe an aspirational full monorepo (Web + iOS + Android + Cloudflare edge + 20 Supabase migrations). **Most of that does not exist on disk yet.** Before acting on anything the docs claim, verify it actually exists. What is real today:

- `packages/api/index.js` — the one substantive code file (shared Supabase client).
- `supabase/config.toml` — local Supabase config only. **No `migrations/` or `seed/` exist**, despite docs referencing 20 migrations / 37–41 seeded mantras and many RPCs/triggers. Treat the schema (tables, RPCs like `get_today_progress` / `panchang` / `mark_anushthana_day`, triggers, RLS policies) as a *target spec* in the docs, not running code.
- `package.json` declares pnpm workspaces `apps/web`, `apps/ios`, `apps/android`, `packages/api`, but **`apps/` does not exist** and neither does `cloudflare/`. Only `packages/api` is a real workspace.
- `.github/workflows/web.yml` exists; `ios.yml` / `android.yml` referenced in docs do not.

Two artifacts to be aware of (likely safe to delete; confirm with the user):
- A stray directory literally named `{apps/{web,ios,android},packages/api,supabase/migrations,cloudflare,.github/workflows,docs}` — a shell brace-expansion that never expanded during scaffolding. It is not real project structure.
- `chanttracker-monorepo.tar.gz` and `MONOREPO_SETUP_SUMMARY.txt` at the repo root — scaffolding leftovers.

Naming discrepancy: docs/README refer to the shared client as `supabaseClient.js`, but the actual file is `packages/api/index.js`. Trust the filesystem.

## Architecture

ChantTracker is a Hindu chant/japa (mantra repetition) tracker. The intended design is **one backend, many thin clients**: all platforms talk to Supabase (managed Postgres + Auth + RLS) through a single shared JS client, with Cloudflare edge resources for caching/audio/community. There is no custom backend server — business logic lives in Postgres (RPCs + triggers + RLS).

`packages/api/index.js` is the architectural center and the best file to read first. It defines the entire app's data contract as thin wrappers over `@supabase/supabase-js`. It reads env via `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (Next.js convention). See **[ENV.md](ENV.md)** for full environment variable configuration across local, Vercel, and Supabase.

Core domain model (as encoded in `index.js`, backed by the not-yet-present schema):

- **Mantras** — catalog of system + user-custom mantras. Categorized by `category` (navagraha/devata/beeja/custom) and `mantra_type` (graha/adhidevata/pratyadhidevata/devata), with `weekday_tags` (0=Mon..6=Sun) driving daily recommendations. Navagraha mantras self-reference via `parent_graha_id`.
- **Chant sessions** — the core logging unit, with an explicit lifecycle: `startSession` (status `active`) → client-side count increments → `completeSession` | `abandonSession`. Completion is expected to fire DB triggers that roll counts into sankalpas, recompute streaks, and unlock achievements.
- **Sankalpa** — a daily intent (target count) for a mantra, keyed by `for_date`.
- **Anushthana** — a multi-day vow (`daily_target_count` × `total_days`) with optional `strict_mode` break detection; `mark_anushthana_day` RPC advances/validates it.
- Plus **goals**, **streaks**, **achievements/user_achievements**, and dashboard/stats helpers (`get_today_progress` RPC, `v_weekly_chart` / `v_user_stats` / `v_top_mantra` views).

**Security model (intended):** Supabase Auth issues JWTs; every table is RLS-scoped to `auth.uid()`; public/system rows (e.g. mantras with `owner_id IS NULL`) are world-readable. An anti-fraud trigger rate-limits session inserts. When implementing schema, every user-owned table needs an RLS policy — there is no app-layer authz.

When extending the system, follow the docs' intended layering: schema change → `supabase/migrations/NN_*.sql`, then expose via an RPC/query in `packages/api/index.js`, then consume from each app. The shared client is the single source of truth for the data contract — keep platform clients thin and route everything through it.

## Commands

Package manager is **pnpm** (workspaces). Most documented root scripts (`pnpm dev`, `pnpm build`, `pnpm test`, `pnpm lint`) fan out via `pnpm -r` and are effectively no-ops until `apps/*` exist — only `packages/api` is currently a real workspace.

```bash
pnpm install                 # install workspace deps
pnpm supabase:studio         # start local Supabase + open Studio (localhost:54323)
pnpm supabase:migrate        # apply migrations (none exist yet)
pnpm supabase:seed           # seed reference data (no seed dir yet)
```

Local Supabase ports (from `supabase/config.toml`): API 54321, DB 54322, Studio 54323.

## Conventions & gotchas

- Dates are written as `new Date().toLocaleDateString('sv')` to get local-timezone `YYYY-MM-DD` — match this when adding date-keyed records (sankalpa `for_date`, anushthana `start_date`/`end_date`).
- Weekday convention is **0=Monday..6=Sunday** (`(getDay()+6)%7`), not JS's default Sunday=0.
- `.env.example` contains a real-looking Supabase project URL and a *publishable* (anon) key — those are public by design. The service role key, Cloudflare, Apple, and Android secrets are placeholders and must never be committed with real values.
