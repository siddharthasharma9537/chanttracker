# ChantTracker — Monorepo

Hindu spiritual chant/japa tracking platform. **One codebase, three platforms: Web (PWA), iOS (native), Android (native).**

## Repo structure

```
chanttracker/
├── apps/
│   ├── web/                 ← Next.js 14 PWA (Vercel)
│   ├── ios/                 ← Swift + SwiftUI (App Store)
│   └── android/             ← Kotlin Jetpack Compose (Play Store)
├── packages/
│   └── api/                 ← Shared Supabase client (npm package)
├── supabase/
│   ├── migrations/          ← 20 SQL migrations (source of truth)
│   └── seed/                ← 37 mantras + reference data
├── cloudflare/
│   ├── worker.js            ← Edge compute (catalog cache, audio, community)
│   ├── wrangler.toml        ← Config (KV, R2, D1 bindings)
│   └── README.md
├── .github/
│   └── workflows/
│       ├── web.yml          ← Deploy web to Vercel on main push
│       ├── ios.yml          ← Build iOS, push to TestFlight
│       └── android.yml      ← Build Android, push to Play Console
├── docs/
│   ├── ARCHITECTURE.md      ← System design & data flow
│   ├── SETUP.md             ← Local dev + Supabase setup
│   ├── DEPLOYMENT.md        ← CI/CD + app store credentials
│   └── API.md               ← supabaseClient.js reference
└── README.md                ← This file
```

## Quick start

### Prerequisites
- Node.js 18+, npm/pnpm
- Xcode 14+ (for iOS development)
- Android Studio 2022+ (for Android development)
- Supabase account (free tier works)
- Cloudflare account (free tier works)

### Setup

```bash
# Clone
git clone https://github.com/yourusername/chanttracker.git
cd chanttracker

# Install dependencies (all apps at once)
pnpm install

# Set up environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run Supabase migrations (creates schema + 37 mantras)
pnpm supabase:migrate

# Start web locally
cd apps/web
pnpm dev
# → http://localhost:3000

# Start iOS locally
cd apps/ios
xed .              # Opens Xcode
# Build & run in simulator
```

## Backend (Supabase)

**No FastAPI, no ops.** Everything is serverless Postgres + Auth + RLS.

### Key features
- **41 system mantras** (9 graha + 9 adhidevata + 9 pratyadhidevata + 13 devata)
- **Session lifecycle**: start → increment → complete/abandon
- **Sankalpa**: per-mantra daily intent with rollup
- **Anushthana**: multi-day vows with break detection (strict mode)
- **Panchang**: Vedic almanac (tithi, nakshatra, paksha, weekday recommendations)
- **Achievements**: 8 auto-unlocked badges
- **RLS**: all data scoped to user; demo profile for anonymous access

### Schema (migrations 01–20)

| Table | Purpose | Rows |
|---|---|---|
| `profiles` | Auth + settings (theme, haptics, timezone) | 1 per user |
| `mantras` | 41 system mantras + user custom | ~41 |
| `grahas` | Navagraha reference | 9 |
| `chant_sessions` | Japa counts: start/complete/abandon | ~daily |
| `sankalpas` | Daily intent per mantra | ~daily |
| `anushthanas` | Multi-day vows | as created |
| `anushthana_progress` | Completed days of a vow | 1 per day |
| `goals` | Daily/weekly/monthly/yearly targets | 4 per user |
| `streaks` | Current + longest streak | 1 per user |
| `achievements` | 8 badge definitions | 8 |
| `user_achievements` | Unlocked badges | as earned |

### RPCs (functions)

```javascript
// Dashboard
await supabase.rpc('get_today_progress')
  // → { done, target, pct, streak, total, active_anushthanas, weekday, tithi, weekday_lord }

// Panchang (public)
await supabase.rpc('panchang', { 
  p_date: '2026-05-31', 
  p_lat: 23.1765, 
  p_lon: 75.7885 
})
  // → { tithi, nakshatra, paksha, weekday_lord, mantra_recommendations, ... }

// Anushthana
await supabase.rpc('mark_anushthana_day', {
  p_user: uid,
  p_anushthana: anushthana_id,
  p_achieved: 108  // achieved_count for the day
})
```

### Live Supabase project

```
Project ID: neqnfukluaxwgtjjgrfu
Region: ap-south-1 (Mumbai)
URL: https://neqnfukluaxwgtjjgrfu.supabase.co
Publishable key: sb_publishable_O6pzpR_EmGHBumqrF6nX9A_1Ge2hPpS
```

## Cloudflare Edge

**3 resources for fast global delivery.**

- **KV** (`CATALOG_CACHE`): 24h cached mantra catalog (instant on repeated views)
- **R2** (`chanttracker-audio`): user audio clips + AI4Bharat TTS output
- **D1** (`chanttracker-edge`): community leaderboard (global japa count, top contributors)

### Worker routes

```
GET  /health                      → Liveness
GET  /catalog/:name               → KV cached (grahas/mantras/achievements)
GET  /community/today             → Global japa counter from D1
POST /community/contribute        → Increment global counter
PUT  /audio/:key                  → Upload user chant to R2
GET  /audio/:key                  → Stream user chant from R2
```

Deploy:

```bash
cd cloudflare
wrangler deploy
```

## Apps

### Web (Next.js 14 PWA)

**Responsive, offline-first, installable.**

```bash
cd apps/web
pnpm dev              # http://localhost:3000
pnpm build            # Static + API routes
pnpm export           # Static export for CDN
```

Deploy: Push to `main` → GitHub Actions → Vercel (automatic).

### iOS (Swift + SwiftUI)

**Native, with home screen widget.**

```bash
cd apps/ios
xed .                 # Xcode
# Select "ChantTrackerApp" scheme → Build & Run on simulator
```

Features:
- Dark/light mode
- Home screen widget (streak + today's progress)
- Offline support (Core Data)
- Background tasks (haptic reminders)
- Hand-off to Mac via Handoff

Deploy: Push to `main` → GitHub Actions → TestFlight → App Store.

### Android (Kotlin Jetpack Compose)

**Modern, Material 3, offline support.**

```bash
cd apps/android
./gradlew tasks       # List gradle tasks
./gradlew :app:build  # Build release APK
./gradlew :app:installDebug # Install to emulator
```

Deploy: Push to `main` → GitHub Actions → Play Console (internal testing → beta → production).

## CI/CD

### GitHub Actions workflows

| Workflow | Trigger | Steps | Deploy |
|---|---|---|---|
| `web.yml` | Push to `main` in `apps/web/` | Build Next.js, lint, test | Vercel |
| `ios.yml` | Push to `main` in `apps/ios/` | Build Xcode, sign, upload | TestFlight → App Store |
| `android.yml` | Push to `main` in `apps/android/` | Build Gradle, sign, upload | Play Console |

Set secrets in GitHub repo settings:
- `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` (web)
- `APPLE_ID`, `APPLE_PASSWORD`, `APPLE_TEAM_ID` (iOS)
- `PLAY_STORE_JSON` (Android)

## Development workflow

1. **Feature branch** off `develop`
   ```bash
   git checkout -b feature/navagraha-widget
   ```

2. **Make changes** across apps + schema as needed
   ```bash
   # Edit apps/web/src/pages/chant.tsx
   # Edit apps/ios/ChantTrackerApp/Views/ChantView.swift
   # Create supabase/migrations/21_*.sql if schema changes
   ```

3. **Test locally**
   ```bash
   pnpm install           # All dependencies
   pnpm supabase:migrate  # Run new migrations on local Supabase
   cd apps/web && pnpm dev
   cd apps/ios && xed .
   ```

4. **Commit & push**
   ```bash
   git add .
   git commit -m "feat(chant): Navagraha widget for home screen"
   git push origin feature/navagraha-widget
   ```

5. **PR → review → merge to `develop`**

6. **Release branch** when ready to ship
   ```bash
   git checkout -b release/v1.0.0
   # Bump version in package.json, Info.plist, build.gradle
   git commit -m "chore: Version 1.0.0"
   git push origin release/v1.0.0
   ```

7. **PR to `main` + tag**
   ```bash
   # After PR merges to main:
   git tag v1.0.0
   git push origin v1.0.0
   # GitHub Actions automatically deploys
   ```

## Documentation

- **[ARCHITECTURE.md](docs/ARCHITECTURE.md)** — System design, data flow, auth, RLS
- **[SETUP.md](docs/SETUP.md)** — Local dev environment, Supabase CLI, mobile SDKs
- **[DEPLOYMENT.md](docs/DEPLOYMENT.md)** — CI/CD secrets, TestFlight, Play Console setup
- **[API.md](docs/API.md)** — `supabaseClient.js` reference + examples

## Tech stack

| Layer | Tech | Notes |
|---|---|---|
| **Backend** | Supabase (Postgres + Auth + RLS) | Managed |
| **Edge** | Cloudflare (Worker + KV + R2 + D1) | Global CDN |
| **Web** | Next.js 14, Tailwind, shadcn/ui | SSR + static export |
| **iOS** | Swift, SwiftUI, Core Data | iOS 15+ |
| **Android** | Kotlin, Jetpack Compose, Room | API 26+ |
| **Shared** | supabaseClient.js (npm package) | Unified API across all apps |
| **VCS** | GitHub | Monorepo |
| **Deployment** | GitHub Actions, Vercel, TestFlight, Play Console | Fully automated |

## License

MIT

## Contact

- GitHub: [@Siddharthasharma9537](https://github.com/Siddharthasharma9537)
- Email: P.siddharthasharma@gmail.com
