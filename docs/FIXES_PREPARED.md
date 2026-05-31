# ChantTracker Backend Fixes — Status

## ✅ What We've Prepared

### 1. Docker Setup
- ✅ Docker is running
- ✅ Supabase CLI installed (v2.98.2)
- ✅ `supabase start` launched (pulling images)
- ⏳ Waiting for containers to be ready

### 2. Migration Files Created

#### Migration 1: Fix `demo_log()` RPC
**File:** `supabase/migrations/20260531000001_fix_demo_log.sql`

**What it does:**
- Drops the broken `demo_log(p_count, p_devanagari)` function
- Recreates it with correct return type: `(done, target, pct, streak, total)`
- Returns updated progress after logging chants
- Grants execute permission to anonymous and authenticated users

**Fixes:**
- ❌ "Number of returned columns (9) does not match expected column count (5)"
- ✅ Chant counter (+1 button) will now persist counts

---

#### Migration 2: Create User Tables
**File:** `supabase/migrations/20260531000002_create_user_tables.sql`

**Tables created:**
1. **profiles** — User settings, theme, timezone, goals, etc. (1 per user)
2. **chant_sessions** — Individual session logs (mode, count, duration, accuracy)
3. **sankalpas** — Daily intention per mantra (target count, purpose)
4. **anushthanas** — Multi-day vows with strict_mode break detection
5. **anushthana_progress** — Per-day tracking for vows
6. **goals** — Daily/weekly/monthly/yearly japa targets
7. **streaks** — Current + longest streak tracking
8. **user_achievements** — Unlocked badges per user

**Security:**
- ✅ Row-Level Security (RLS) enabled on all user tables
- ✅ Users can only see/modify their own data
- ✅ Demo user created for testing (`00000000-0000-0000-0000-000000000001`)

**Indices:**
- `chant_sessions(user_id, chant_date)` — Fast history queries
- `chant_sessions(user_id, session_status)` — Fast filtering by status
- `sankalpas(user_id, for_date)` — Fast daily intent lookup
- `anushthana_progress(anushthana_id)` — Fast vow tracking

---

## 📋 What Happens Next

### Step 1: Supabase Starts (in progress)
```bash
docker ps | grep supabase  # Should show 10+ containers
supabase status            # Should show all green
```

### Step 2: Apply Migrations
```bash
supabase db push  # Applies both migrations to local DB
```

### Step 3: Test the Fixes
```bash
# Test demo_log() now returns correct type
curl -X POST http://localhost:54321/rest/v1/rpc/demo_log \
  -H "apikey: eyJ..." \
  -H "content-type: application/json" \
  -d '{"p_count":5,"p_devanagari":"ॐ नमः शिवाय"}'

# Should return: {done, target, pct, streak, total} ✅
```

### Step 4: Verify Tables
```bash
supabase db tables  # Should list all 8 user tables
```

### Step 5: Update Prototype
- Once local backend works, test the HTML prototype against local Supabase
- Change hardcoded URL from live project to: `http://localhost:54321`

### Step 6: Deploy to Live (when confident)
```bash
supabase db push --linked  # Push all migrations to live Supabase
```

---

## 🎯 Expected Results After These Fixes

| Feature | Before | After |
|---------|--------|-------|
| **Counter (+1)** | Breaks with RPC error | ✅ Persists to backend |
| **Dashboard** | Shows demo data only | ✅ Shows real user progress |
| **History** | Shows demo data only | ✅ Shows real session logs |
| **User Profile** | Empty (no table) | ✅ Stores theme, language, timezone |
| **Goals** | No table | ✅ Stores daily/monthly/yearly targets |
| **Streaks** | No table | ✅ Auto-tracked per user |
| **Achievements** | No unlock tracking | ✅ Tracks when badges earned |
| **Sankalpas** | No table | ✅ Stores daily intentions |
| **Anushthanas** | No table | ✅ Stores multi-day vows |

---

## 📊 Schema Diagram (after fixes)

```
auth.users
    │
    ├─ profiles (1:1)
    │   └─ User settings, theme, timezone
    │
    ├─ chant_sessions (1:many)
    │   ├─ Linked to mantras
    │   ├─ Linked to sankalpas
    │   └─ Linked to anushthanas
    │
    ├─ sankalpas (1:many)
    │   └─ Linked to mantras
    │
    ├─ anushthanas (1:many)
    │   ├─ Linked to mantras
    │   └─ anushthana_progress (1:many)
    │
    ├─ goals (1:many)
    │   └─ Daily/weekly/monthly/yearly targets
    │
    ├─ streaks (1:1)
    │   └─ Current + longest streak
    │
    └─ user_achievements (1:many)
        └─ Linked to achievements (system data)
```

---

## 🚀 Commands to Run (Once Supabase Starts)

```bash
# 1. Push migrations to local database
supabase db push

# 2. Check status
supabase status

# 3. View Supabase Studio
open http://localhost:54323

# 4. Test API
curl http://localhost:54321/rest/v1/profiles -H "apikey: eyJ..."

# 5. When ready, deploy to live
supabase db push --linked
```

---

## ❓ What If Something Goes Wrong?

### Reset and start fresh:
```bash
supabase stop
rm -rf ~/.supabase
supabase start
supabase db push
```

### Check logs:
```bash
docker logs supabase_db_chanttracker   # Database errors
docker logs supabase_rest_chanttracker # API errors
```

### View the UI:
```
http://localhost:54323  # Supabase Studio
```

---

**Status:** ⏳ Waiting for Supabase to start. Once containers are ready, we'll apply migrations and test!
