# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

ChantTracker v2 — a Hindu japa (mantra repetition) tracker. Next.js 14 app in `apps/web` talking directly to Supabase (Postgres + Auth + RLS). No custom backend: business logic lives in Postgres (triggers, RPCs, RLS). Design spec: **[docs/REBUILD_SPEC.md](docs/REBUILD_SPEC.md)** — read it first.

Core model: **roles are per-project relationships, not user types.** Two surfaces:
- **Practice** — personal chanting (mantra picker → counter → sessions/history)
- **Projects** — shared remedial chanting: `organizer` invites `chanter`s by 6-char code; beneficiary watches via a no-account share link (`/view/<code>`).

## Architecture rules (enforced, not aspirational)

- **One data layer**: all queries live in `apps/web/src/lib/api/` (mantras, sessions, projects). No `supabase.from()` in components. Thin React Query hooks/pages on top.
- **One `sessions` table** for personal + project chanting (`project_id`/`graha_id` nullable). Sessions are inserted directly as `completed` — one write per chant. A DB trigger rolls completed project sessions into `project_grahas.completed_count`.
- **One counter component** (`components/practice/Counter.tsx`) used by both Practice and project chanting.
- **Mantra text lives in `mantra_texts`** (`lang`, `script`, `text`, `has_swaras`), not columns on `mantras`. `displayText()` in `lib/api/mantras.ts` prefers Telugu-without-swaras (Vedic swara marks on Telugu glyphs render as tofu in Noto fonts — see spec).
- **Migrations-first**: every schema change is a file in `supabase/migrations/` applied to the live Supabase project (via MCP `apply_migration`). Never mutate the live DB without a matching file. Pre-v2 history had drifted; `20260708000001_v2_schema.sql` is the reset point.
- Route protection is `apps/web/src/middleware.ts` (public: `/auth`, `/view`). Requires `@supabase/ssr` ≥0.4 (getAll/setAll cookie API) — 0.3 fails silently.
- DB types are hand-maintained and minimal in `apps/web/src/types/database.ts`.

## Key domain facts

- Navagraha graha mantras link: `grahas.mantra_id` FK → `mantras`; adhidevata/pratyadhidevata rows link back via `mantras.parent_graha_id`. `grahas` has alias rows (Mangal/Mangala) — dedupe by `mantra_id` (see `listGrahas`).
- Puranic japa targets are `mantras.default_target` (Σ 120,000 across the nine grahas).
- Weekday convention 0=Mon..6=Sun; local dates via `toLocaleDateString('sv')`.
- `.env.local` holds `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (publishable — safe for client). See ENV.md.

## Commands

```bash
pnpm install
pnpm --filter @chanttracker/web dev   # Next.js dev server on :3000
pnpm --filter @chanttracker/web build
```

Supabase is the hosted project (`neqnfukluaxwgtjjgrfu`); local `supabase/config.toml` exists but development runs against the hosted DB.

## Phase 2 (not built yet)

Streaks, sankalpas, anushthanas, achievements — tables exist from v1 and were kept; no UI or triggers wired in v2 yet.
