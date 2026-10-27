# ChantTracker status            updated 2026-10-27 by Desk · ChantTracker

Repository `siddharthasharma9537/chanttracker`, web app `chanttracker.sohum.cc`. Live data is in the shared `sohum` Supabase project (the old `chanttracker` project is paused; do not push to it). Contracts: `CHANT_COUNTING_SHAPE.md`, `PRACTICE_JAPA_SHAPE.md` in sohum-contracts.

Nothing in this file was checked against the live site or database today except where it says so. Practice data is sensitive: private by default (AGENTS.md rule 3).

## Now

- Desk set-up (this ledger). No build step is running.

## Next

1. **Sessions RLS fix (PR #5):** review, then apply to the live `sohum` database only on the owner's instruction after merge. Test after applying: a chanter can still log to their project, an organizer to their own, a non-member insert is rejected. Open question in the PR: `graha_id` is not checked against `project_id`.
2. **Voice counting (PR #4, chant counting step 3):** mergeable, built and self-checked (lint, tsc, vitest 32/32, build). It still needs the accuracy check the shape asks for (within ±2 of the true count on 108 repetitions, at least three mantras, on the owner's own hand-counted recordings) before it is released. Decide merge and release order with PR #5.
3. **Chant counting step 4** (assistant entry "I'm ready to chant ...", in `vani-gateway` / `vani-web`) belongs to the Vāni desk; ChantTracker needs no change for it.
4. **Practice japa from the SoHum app** (PRACTICE_JAPA_SHAPE): no ChantTracker change; the SoHum app calls `get_practice_status`, `list_mantras` and `log_chant_session` directly. ChantTracker's part is to keep those three stable.
5. Not built: **anushthana** and **personal sankalpa** (tables exist from v1; no UI or triggers in v2). Needs a shape document in sohum-contracts first (rule 1).

## Blocked

- Nothing blocked.

## Waiting on the owner

- **Apply PR #5's migration to the live `sohum` database?** Live still has the old policy (`WITH CHECK (user_id = auth.uid())`, read-only check in PR #5 on 2026-10-27). Merge and apply each need an explicit instruction.
- **Merge PR #4?** And the accuracy check on the owner's own recordings (above).
- **Cleanup proposals (nothing done; each needs a yes):**
  - Worktree `.claude/worktrees/reverent-williamson-0c0cc4` (branch `claude/reverent-williamson-0c0cc4`): its commits are already in `main`; it holds only an uncommitted migration `20260709000001_sessions_require_project_membership.sql`, superseded by PR #5 (and its version number collides with `20260709000001_v2_member_assignment`). Proposal: remove the worktree and branch.
  - Branch `feature/host-delegation-system` and branch `v2`: both already in `main`. Proposal: delete.
  - Draft PR #1 (`consolidate/merge-app-backend`, 7 commits, 5 commits behind `main`'s changes; Sept 27): ChantTracker is now v2 on Supabase with no custom backend, so the FastAPI backend it merges is superseded. Proposal: close; the Anushthana, Sankalpa and Yajna actions it registered with Vāni are not in `main`, so keep the branch until the owner decides how those will be built.
  - Branch `chatgpt/jev-decision-layer` (16 commits, Sept 27, diverged from `main`, would delete about 1,000 lines on merge; also `feature/jev-decision-layer` on origin): an older counter-analysis experiment, apparently overtaken by PR #4's voice counter. Proposal: keep until the owner confirms it is abandoned, then delete.
  - Local `main` checkout: modified `apps/web/tsconfig.tsbuildinfo` (a build artefact; proposal: stop tracking it) and untracked `AGENTS.md` (written for Codex, still names an older Supabase project; the shared AGENTS.md rules in sohum-contracts apply). Local `main` is 2 commits behind `origin/main`. Nothing discarded.
  - Local branch `chant-voice-count` is PR #4's branch.
- Local-only items left as they are: worktree `.claude/worktrees/sessions-rls` is PR #5's branch.

## Open pull requests

| # | What | State |
|---|---|---|
| 5 | Sessions RLS requires project membership (migration `20261027000001`) | Open, opened 2026-10-27, **not applied live** |
| 4 | Voice counting in the browser, on the device (step 3) | Open, mergeable, not merged |
| 1 | Consolidate chanttracker-app and chanttracker-backend | Draft since 2026-09-27, see cleanup proposal |

## Live

- Web app at `chanttracker.sohum.cc` (Next.js on Cloud Run `chanttracker-web`, behind Cloudflare; last checked by others 2026-10-17; this desk has not re-checked).
- `vani-actions` Supabase edge function and manifest, with `method` on `log_chant_session` (live 2026-10-19, chanttracker#3).
- Not live: voice counting (PR #4), the RLS fix (PR #5).
- Master document: ChantTracker row, section 3.1 of `docs/SOHUM_SUITE_AND_CLOUD_CONSOLE.md` in sohum-contracts.
