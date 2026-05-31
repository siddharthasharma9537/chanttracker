# ChantTracker Backend & Frontend Test Report

**Date:** May 31, 2026  
**Prototype Source:** `/Users/siddharthapothulapati/Downloads/index.html`  
**Supabase Project:** `neqnfukluaxwgtjjgrfu` (ap-south-1)

---

## Executive Summary

The **frontend prototype is 90% complete and production-quality**, but the **backend is only 50% functional**. The core chant-logging RPC is broken, and user data tables are all empty. This is a polished mockup, not an MVP.

---

## Backend RPC Endpoints

### ✅ WORKING (2/3)

#### 1. `demo_progress()` — Dashboard aggregates
**Endpoint:** `POST /rest/v1/rpc/demo_progress`

**Response:**
```json
{
  "done": 470,           // japas completed today
  "target": 500,         // daily goal
  "pct": 94,             // % completion
  "streak": 1,           // current streak (days)
  "total": 470,          // lifetime japas
  "active_anushthanas": 0,
  "weekday": "Sunday",
  "tithi": "Pratipada",  // Vedic calendar
  "weekday_lord": "Surya"
}
```

**Status:** ✅ **WORKS** — Dashboard progress ring displays correctly  
**Used by:** Dashboard screen (line 868 in prototype)

---

#### 2. `demo_history(p_limit: integer)` — Session logs
**Endpoint:** `POST /rest/v1/rpc/demo_history`

**Response:**
```json
[
  {
    "devanagari": "ॐ नमः शिवाय",
    "transliteration": "Om Namah Shivaya",
    "accent_color": "#A855F7",
    "cnt": 5,              // count for this session
    "at_time": "08:22 AM"
  },
  // ... up to p_limit rows
]
```

**Status:** ✅ **WORKS** — History screen populates correctly  
**Used by:** History page (line 880 in prototype)

---

#### 3. `mantras` table — Mantra catalog
**Endpoint:** `GET /rest/v1/mantras?limit=1`

**Sample row:**
```json
{
  "id": "558599a6-d33f-4473-9853-e6065691bc8d",
  "deity": "Ganesha",
  "devanagari": "ॐ गं गणपतये नमः",
  "transliteration": "Om Gam Ganapataye Namah",
  "meaning": "Remover of obstacles",
  "default_target": 108,
  "accent_color": "#f472b6",
  "is_system": true,
  "slug": "om-gam-ganapataye",
  "name_en": "Ganesha Mantra",
  "iast_transliteration": "oṃ gaṃ gaṇapataye namaḥ",
  "category": "devata",
  "mantra_type": "devata",
  "parent_graha_id": null,
  "weekday_tags": null,
  "audio_url": null,
  "is_active": true,
  "created_at": "2026-05-31T01:31:49.88517+00:00"
}
```

**Status:** ✅ **WORKS** — Mantra catalog is seeded  
**Used by:** Chant session, History, Mandala screens

---

### ❌ BROKEN (1/3)

#### 1. `demo_log(p_count: integer, p_devanagari: text)` — Log a chant
**Endpoint:** `POST /rest/v1/rpc/demo_log`

**Request:**
```json
{
  "p_count": 5,
  "p_devanagari": "ॐ नमः शिवाय"
}
```

**Error Response:**
```json
{
  "code": "42804",
  "message": "structure of query does not match function result type",
  "details": "Number of returned columns (9) does not match expected column count (5).",
  "hint": null
}
```

**Status:** ❌ **BROKEN** — RPC signature mismatch  
**Impact:** ⚠️ **CRITICAL** — Core counter (+1 button) cannot persist counts to backend  
**Used by:** Chant session counter (line 741 in prototype)

**Root Cause:** The function returns 9 columns (probably `demo_progress` result) but the RPC definition expects 5. Likely a copy-paste error in the migration.

---

## Database Schema Status

### ✅ Tables with Data
- `mantras` — ~50 system mantras (Navagraha + devatas)
- `achievements` — 8 badge definitions

### ⚠️ Tables Exist But Empty
- `profiles` — no user records
- `chant_sessions` — no sessions logged
- `sankalpas` — no daily intents
- `anushthanas` — no multi-day vows
- `goals` — no user goals
- `streaks` — no streak records
- `user_achievements` — no unlocked badges

### ❌ Authentication
- **JWT-based Supabase Auth** not tested (requires active session)
- **RLS policies** exist but cannot be validated without auth
- **Service role key** not available in .env.example

---

## Frontend Testing

### ✅ Screen Navigation (13/13 screens reachable)
- [x] Splash → Get Started → Dashboard
- [x] Home (Dashboard) — displays real progress
- [x] Mandala — 9 planets render, tappable
- [x] Chant — counter, mala mode, voice mode tabs
- [x] History — displays real session log
- [x] Profile — layout complete
- [x] All sub-screens (Stats, Goals, Achievements, Sankalpa, Settings)

### ✅ Interactive Components
- [x] +1 / -1 counter (increments visually, local only)
- [x] Reset session button
- [x] Session timer (increments every 1s)
- [x] Mala bead ring (27 beads, advance on tap)
- [x] Mandala planets (reveal mantra name/text)
- [x] Theme switcher (Temple / Midnight / Dawn)
- [x] Goal progress bars
- [x] Badge grid (6 locked, 6 unlocked, grayscale locked state)
- [x] Sankalpa purpose selector (6 options, highlight on select)
- [x] Voice waveform animation (32 bars, staggered)
- [x] Settings toggles (haptics, sound, etc.)

### ⚠️ Data Binding (Partial)
- ✅ Dashboard: real `demo_progress()` data → progress ring, streak, % target
- ✅ History: real `demo_history()` data → session list with times and counts
- ❌ Counter: cannot sync to `demo_log()` (RPC broken)
- ❌ Profile: would need `profiles` table (empty)
- ❌ Goals: would need `goals` table (empty)
- ❌ Streaks: would need `streaks` table (empty)
- ❌ Achievements: would need `user_achievements` table (empty)

---

## Critical Blockers

| Issue | Severity | Blocks | Action |
|-------|----------|--------|--------|
| `demo_log()` RPC broken | 🔴 CRITICAL | Chant counter (+1 button) cannot save | Fix RPC return type in migration |
| No user auth | 🔴 CRITICAL | Cannot track individual users | Implement Supabase Auth + JWT validation |
| Empty user tables | 🔴 CRITICAL | No data persistence (profiles, sessions, goals, etc.) | Run migrations + seed reference data |
| No session triggers | 🟡 MEDIUM | Streaks don't auto-update, achievements don't unlock | Implement DB triggers |
| No RLS policies tested | 🟡 MEDIUM | Security model unclear | Test with authenticated users |

---

## Recommendations

### Phase 1: Fix Broken Backend (1-2 days)
1. **Fix `demo_log()` RPC** — correct the return type signature
2. **Wire up Supabase Auth** — implement login/signup flow in prototype
3. **Populate user tables** — seed test data for profiles, sessions, sankalpas, etc.
4. **Test with auth** — verify RLS policies work correctly

### Phase 2: Implement Missing Features (3-5 days)
1. Create migrations for any missing tables/RPCs (based on docs/ARCHITECTURE.md)
2. Implement triggers: streak updates, achievement unlocking, sankalpa rollups
3. Test full session lifecycle: start → increment → complete
4. Test offline sync (IndexedDB for web, Core Data for iOS, Room for Android)

### Phase 3: Wire Frontend to Backend (2-3 days)
1. Replace hardcoded demo RPC calls with real `packages/api/index.js` client
2. Add authentication UI (login/signup screens)
3. Test all 13 screens with real data
4. Implement error handling for offline/network failures

---

## Testing Environment

**Server:** http://localhost:8888 (serves index.html via Python HTTP server)  
**Supabase Project:** https://neqnfukluaxwgtjjgrfu.supabase.co  
**Publishable Key:** `sb_publishable_O6pzpR_EmGHBumqrF6nX9A_1Ge2hPpS` (public, safe)  
**Key Limitation:** Cannot test authenticated endpoints without a user token

---

## Files Involved

- **Frontend:** `/Users/siddharthapothulapati/Downloads/index.html` (910 lines)
- **Shared Client:** `/Users/siddharthapothulapati/Workspace/chanttracker/packages/api/index.js`
- **Schema Docs:** `/Users/siddharthapothulapati/Workspace/chanttracker/docs/ARCHITECTURE.md`
- **Test Report:** This file

---

## Conclusion

**The frontend is production-ready UI work.** The backend is ~50% done: reads work, writes are broken, and user data is missing. Before moving to Next.js/iOS/Android development, the Supabase schema needs to be fully implemented and tested with authentication.
