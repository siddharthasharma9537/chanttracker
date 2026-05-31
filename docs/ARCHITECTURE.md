# ChantTracker — System Architecture

## High-level overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     CLIENT LAYER                                │
├──────────────────┬──────────────────┬──────────────────────────┤
│   Web (PWA)      │   iOS (native)   │   Android (native)       │
│ Next.js 14       │  Swift+SwiftUI   │  Kotlin Compose          │
│ Vercel           │  App Store       │  Play Store              │
└────────┬─────────┴────────┬─────────┴─────────┬────────────────┘
         │                  │                    │
         └──────────────────┼────────────────────┘
                            │
                 ┌──────────▼──────────┐
                 │  supabaseClient.js  │  ← Shared API
                 │   (npm package)     │    across all platforms
                 └──────────┬──────────┘
                            │
         ┌──────────────────┼────────────────┐
         │                  │                │
    ┌────▼─────┐    ┌─────▼──────┐    ┌──────▼───┐
    │ Supabase │    │ Cloudflare │    │ Supabase │
    │ Auth     │    │ Edge       │    │ RLS      │
    │ (JWT)    │    │ (Worker)   │    │ (Policy) │
    └────┬─────┘    └─────┬──────┘    └──────┬───┘
         │                │                   │
    ┌────▼─────────────────▼───────────────────▼────┐
    │                  DATABASE                     │
    │        Supabase (Managed PostgreSQL)         │
    │                                               │
    │  ┌─────────────────────────────────────────┐ │
    │  │  Tables (11):                           │ │
    │  │  - profiles (auth + settings)           │ │
    │  │  - mantras (41 catalog items)           │ │
    │  │  - chant_sessions (japa logs)           │ │
    │  │  - sankalpas (daily intent)             │ │
    │  │  - anushthanas (multi-day vows)         │ │
    │  │  - goals, streaks, achievements, etc.   │ │
    │  └─────────────────────────────────────────┘ │
    │                                               │
    │  ┌─────────────────────────────────────────┐ │
    │  │  RPCs (7):                              │ │
    │  │  - get_today_progress()                 │ │
    │  │  - panchang(date,lat,lon)               │ │
    │  │  - mark_anushthana_day()                │ │
    │  │  - mantras_for_weekday()                │ │
    │  │  - demo_log(), demo_progress()          │ │
    │  └─────────────────────────────────────────┘ │
    │                                               │
    │  ┌─────────────────────────────────────────┐ │
    │  │  Triggers (4):                          │ │
    │  │  - on_auth_signup (create profile)      │ │
    │  │  - on_session_insert (streak update)    │ │
    │  │  - on_session_complete (sankalpa       │ │
    │  │    rollup + achievement check)          │ │
    │  │  - anti_fraud_check (rate limit)        │ │
    │  └─────────────────────────────────────────┘ │
    └────────────────────────────────────────────────┘
         │                    │                │
    ┌────▼────┐    ┌──────────▼────┐    ┌───▼──────┐
    │  KV     │    │  R2 (audio)   │    │  D1      │
    │(catalog │    │ (user chants) │    │(community│
    │ cache)  │    │               │    │ counter) │
    └─────────┘    └───────────────┘    └──────────┘
```

## Data flow

### User chants a mantra

```
1. User taps "+1" in web/iOS/Android app
   ↓
2. startSession() called via supabaseClient
   ↓
3. INSERT into chant_sessions (status='active')
   ← Server returns session ID
   ↓
4. User repeats tap 108 times (count increments locally)
   ↓
5. User taps "End Session"
   ↓
6. completeSession(sessionId, count=108, duration=3600)
   ↓
7. UPDATE chant_sessions SET status='completed', ...
   ↓
8. Trigger: on_session_complete() fires
   ├─ Roll count into linked sankalpa.achieved_count
   ├─ Check if sankalpa target hit → mark 'completed'
   ├─ Recompute streak (streak trigger)
   └─ Check achievements (badge trigger)
   ↓
9. Dashboard instantly refreshes:
   - daily count updated
   - streak extended
   - badges unlocked
   - panchang for today loaded
```

### Weekly leaderboard

```
1. All apps POST /community/contribute to Cloudflare Worker
   ↓
2. Worker receives: { user_id, count, mantra_slug, date }
   ↓
3. INSERT into D1 (community_totals, mantra_leaderboard)
   ↓
4. GET /community/today returns global japa count
   ↓
5. Apps show: "🌍 Community chanted 5.2M japas today"
```

### Offline support

**Web (PWA):**
- Service Worker caches API responses
- IndexedDB stores pending sessions locally
- On reconnect, flushes pending sessions to Supabase
- Works fully offline for counter (reads cached mantra list)

**iOS:**
- Core Data local database mirrors profile + mantras + sessions
- Background sync (URLSession) flushes pending sessions on reconnect
- HomeKit background tasks trigger reminders at reminder_time

**Android:**
- Room database (local SQLite) mirrors data
- WorkManager schedules background sync + reminders
- Fully functional offline chanting

## Security model

### Authentication

```
Sign up / Sign in → Supabase Auth (email + password)
↓
JWT token issued (expires in 1 hour)
↓
All API calls include Bearer token in Authorization header
↓
Server validates JWT signature
↓
Extract user ID from JWT claims
```

### Row-level security (RLS)

Every table has a policy:

```sql
-- Users see only their own data
CREATE POLICY "own_chant_sessions"
  ON chant_sessions FOR ALL
  USING (auth.uid() = user_id);

-- Public data (mantras, achievements) visible to all
CREATE POLICY "public_mantras"
  ON mantras FOR SELECT
  USING (owner_id IS NULL);  -- system mantras only
```

Result: **No IDOR possible**. Even if someone guesses another user's ID, Postgres enforcement prevents access.

### API rate limiting (anti-fraud)

```
On session insert:
  IF (count of sessions in last 60 seconds > 20)
    THEN RAISE EXCEPTION 'rate_limit_exceeded'

This prevents burst spam:
  - 20 sessions/minute = ~1 japa every 3 seconds (realistic max)
  - Aggressive bot would hit this immediately
```

## State management

### Web (Next.js)

```
Server state:  TanStack Query (cached on client)
Local state:   Zustand store (modal open/close, UI toggles)
Form state:    React Hook Form (checkout form, profile edit)
```

Example:

```javascript
// Fetch & cache dashboard
const { data: dashboard } = useQuery({
  queryKey: ['dashboard'],
  queryFn: () => supabase.rpc('get_today_progress'),
  staleTime: 30_000,  // refresh every 30s
})

// Refetch on session complete
const { mutate: completeSession } = useMutation({
  mutationFn: (sessionId) => /* ... */,
  onSuccess: () => {
    queryClient.invalidateQueries(['dashboard'])  // auto-refetch
  }
})
```

### iOS (Swift)

```
@StateObject: dashboard data (observed by views)
@State: UI toggles, sheet open/close
Core Data: session cache (syncs with Supabase on save)
```

### Android (Kotlin)

```
Jetpack Compose state: UI toggles, navigation
ViewModel + Room: persistent local database
Flow: reactive data streams (dashboard updates)
```

## Deployment

### Web

```
On push to main in apps/web/:
  ├─ GitHub Actions triggers
  ├─ npm run build
  ├─ npm run lint
  ├─ Deploy to Vercel (automatic)
  └─ URL: https://chanttracker.vercel.app
```

### iOS

```
On push to main in apps/ios/:
  ├─ GitHub Actions triggers
  ├─ xcodebuild -scheme ChantTrackerApp -configuration Release
  ├─ Sign with Apple Developer certificate
  ├─ Upload to TestFlight
  └─ After approval → App Store (manual promotion or auto)
```

### Android

```
On push to main in apps/android/:
  ├─ GitHub Actions triggers
  ├─ ./gradlew bundleRelease
  ├─ Sign with play store keystore
  ├─ Upload to Play Console
  └─ Auto-staged: internal → beta → production (5% rollout)
```

## Performance optimizations

### Caching

| Layer | Strategy | TTL |
|---|---|---|
| **Mantras** | Cloudflare KV (edge) | 24 hours |
| **Dashboard** | TanStack Query client cache | 30 seconds |
| **Images** | CDN (Vercel/Cloudflare) | 1 year (content-addressable) |

### Database

| Query | Optimization |
|---|---|
| "Get today's sessions" | Index on `(user_id, chant_date)` |
| "Leaderboard top 100" | Materialized view (hourly refresh) |
| "User lifetime stats" | Denormalized view (`v_user_stats`) |

### Network

- **Web**: Static export + incremental static regeneration (ISR)
- **iOS**: URLSession batching (group requests, fire once/minute)
- **Android**: WorkManager batching + exponential backoff

## Extensibility

### Adding a new mantra feature

1. **Schema**: `supabase/migrations/21_mantra_xyz.sql`
2. **API**: `packages/api/supabaseClient.js` (add RPC call)
3. **UI**: `apps/web/src/components/MantrasXyz.tsx`
4. **iOS**: `apps/ios/ChantTrackerApp/Views/MantrasXyzView.swift`
5. **Android**: `apps/android/app/src/main/kotlin/MantrasXyzScreen.kt`

All platforms use the same backend → consistent behavior.

### Adding a new platform

1. Create `apps/newplatform/`
2. Import `supabaseClient` from `packages/api`
3. Same RPC calls, same data flow
4. Add CI/CD workflow in `.github/workflows/newplatform.yml`

No backend changes needed.
