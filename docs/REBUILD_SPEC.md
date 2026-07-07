# ChantTracker v2 — Rebuild Spec

One page. Agree on this before writing code.

## Concept

A Hindu japa (mantra repetition) tracker with two surfaces:

1. **Practice** — your own chanting: pick a mantra, tap to count, build streaks.
2. **Projects** — shared remedial chanting (e.g. Navagraha japa): an organizer
   splits target counts across chanters; a beneficiary watches progress.

**Roles are per-project relationships, not user types.** One user can practice,
organize project A, chant in project B, and commission project C. There is no
app-wide mode. Navigation is the same for everyone:
**Practice · Projects · History · Settings**.

| Role in a project | Sees on the project page |
|---|---|
| `organizer` | manage grahas/targets, invite chanters, full progress |
| `chanter`  | their assignment + Chant button (same counter as Practice) |
| beneficiary | **no account** — read-only share link (signed URL / code) |

Invites: joining as a chanter = opening an invite link/code → row in
`project_members`. Beneficiary link grants anonymous read-only access to
project progress only (RLS via share-code lookup, no auth).

## Data model (Supabase Postgres, RLS on everything user-owned)

```
profiles         id (auth.uid), display_name
mantras          id, slug, name_en, category (navagraha|devata|beeja|custom),
                 mantra_type (graha|adhidevata|pratyadhidevata|salutation|devata),
                 parent_graha_id FK→mantras, default_target, weekday (0=Mon..6=Sun),
                 accent_color, owner_id NULL=system, is_active
mantra_texts     mantra_id FK, lang ('te','sa','en',...), script, text,
                 has_swaras bool          -- swara + plain variants coexist
grahas           id, name, color, orbit_order, mantra_id FK→mantras  -- keep FK!
projects         id, organizer_id, beneficiary_name, description, status,
                 share_code (beneficiary), invite_code (chanter)
project_grahas   project_id, graha_id, target_count, completed_count
project_members  project_id, user_id, role ('organizer'|'chanter'),
                 assigned_graha_ids uuid[]
sessions         id, user_id, mantra_id, count, duration_secs, status,
                 project_id NULL, graha_id NULL,   -- NULL = personal practice
                 started_at, completed_at
streaks / sankalpas / anushthanas / achievements  -- port as-is later, phase 2
```

**One `sessions` table.** Project chanting is a session tagged with
`project_id` — it feeds the chanter's own streaks/history too. Completion
trigger rolls counts into `project_grahas.completed_count`.

## Architecture rules

- **One data layer**: typed query module (`lib/api/`), thin React Query hooks
  over it. Zero `supabase.from()` in components.
- **One counter component** shared by Practice and project chanting.
- **Migrations-first**: baseline dump `00_baseline.sql`, every change a
  migration file. Never mutate the live DB without a matching file.
- Plain Next.js + Supabase repo. No iOS/Android/Cloudflare scaffolding until real.
- Business logic in Postgres (RPCs + triggers + RLS); no app-layer authz.

## Domain knowledge to port (do not lose)

- **Puranic japa counts**: Surya 6000, Chandra 10000, Mangala 7000, Budha 17000,
  Brihaspati 16000, Shukra 20000, Shani 19000, Rahu 18000, Ketu 7000 (Σ 120000).
- **Navagraha Suktam Telugu texts with Vedic swaras** — already in live DB
  (`mantras.mantra_telugu` + `mantra_telugu_plain`); migrate into `mantra_texts`
  as `('te', has_swaras=true)` and `('te', has_swaras=false)` rows.
- Each graha has **adhidevata + pratyadhidevata** mantras via `parent_graha_id`.
- **Font lesson**: Vedic swara marks (U+0951/0952, U+1CD0–1CFF) on Telugu base
  glyphs render as tofu in Noto fonts. Display the `has_swaras=false` text by
  default; offer swara text only when a capable self-hosted font ships.
- Conventions: dates `toLocaleDateString('sv')` (local YYYY-MM-DD);
  weekday 0=Monday..6=Sunday.
- Language selector: TE default; EN/HI/KA/TA/MA marked "soon" until
  `mantra_texts` rows exist.

## Build order

1. Schema + RLS + seed (mantras, texts, grahas) — verify in Studio.
2. Auth + Practice surface (counter, sessions, history).
3. Projects: create → invite chanter → chant → progress rollup.
4. Beneficiary share link (no-auth read-only page).
5. Phase 2: streaks, sankalpa, anushthana, achievements, panchang.
