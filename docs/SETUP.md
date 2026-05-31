# Setup Guide

Get ChantTracker running locally on your machine.

## Prerequisites

### All platforms

- **Git** — clone the repo
- **Node.js 18+** — JavaScript runtime (check: `node --version`)
- **pnpm 8+** — package manager (install: `npm install -g pnpm`)
- **Supabase CLI** — local Postgres (install: `brew install supabase/tap/supabase` on macOS)

### iOS development

- **Xcode 14+** — from App Store
- **Xcode Command Line Tools** — `xcode-select --install`
- **Cocoapods** (optional) — native dependency manager

### Android development

- **Android Studio 2022+** — from https://developer.android.com/studio
- **Gradle** — included with Android Studio
- **Java 11 JDK** — included with Android Studio

### Deploy to production

- **Supabase account** — https://app.supabase.com (free tier works)
- **Cloudflare account** — https://dash.cloudflare.com (free tier works)
- **GitHub account** — https://github.com (for Actions secrets)
- **Vercel account** (web only) — https://vercel.com
- **Apple Developer account** (iOS) — https://developer.apple.com ($99/year)
- **Google Play Developer account** (Android) — https://play.google.com/console ($25 one-time)

## Quick start (5 minutes)

### 1. Clone & install

```bash
git clone https://github.com/yourusername/chanttracker.git
cd chanttracker
pnpm install
```

### 2. Set up Supabase locally

```bash
# Install CLI
brew install supabase/tap/supabase

# Start local Postgres + studio
supabase start

# This outputs:
# - Postgres on localhost:54322
# - Studio on http://localhost:54323
# - Anonymous key & service role key
```

### 3. Create .env.local

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=your_anon_key_from_supabase_start
```

### 4. Run migrations

```bash
supabase migration list          # See all 20 migrations
supabase db push                # Apply to local database
supabase db seed                # Seed 37 mantras
```

Verify in studio: http://localhost:54323 → browse `public.mantras` → should see 41 rows.

### 5. Start the web app

```bash
cd apps/web
pnpm dev
```

Open http://localhost:3000 → you should see the login screen.

### 6. Sign up

```
Email: test@example.com
Password: Test123!@#
```

Sign in → dashboard loads → "● LIVE" badge appears.

## Development setup

### Structure

```
chanttracker/
├── apps/
│   ├── web/                 ← npm start here for web dev
│   ├── ios/                 ← xed . to open Xcode
│   └── android/             ← open in Android Studio
├── packages/
│   └── api/                 ← shared supabaseClient
└── supabase/
    └── migrations/          ← .sql files (01 through 20)
```

### Scripts

```bash
# Root level (from chanttracker/)

pnpm install                # Install all dependencies
pnpm dev                    # Start all dev servers (concurrent)
pnpm build                  # Build all apps
pnpm lint                   # Lint all code
pnpm test                   # Run tests in all apps

pnpm supabase:migrate      # Apply Supabase migrations
pnpm supabase:studio       # Open Supabase studio
```

### Web development

```bash
cd apps/web
pnpm dev                    # http://localhost:3000

# Edit code & hot-reload
# Edit supabase/migrations/21_*.sql → supabase db push → app auto-refetches
```

Debug in browser DevTools (F12).

### iOS development

```bash
cd apps/ios
xed .                       # Opens Xcode

# Select "ChantTrackerApp" scheme
# Select "iPhone 15" simulator (or your device)
# Click ▶ Run

# Edit code in Xcode → ⌘S to save → runs on simulator
```

Debugging: Xcode Console (⌘⇧Y).

### Android development

```bash
cd apps/android

# Open in Android Studio:
# File → Open → select apps/android/ folder

# Or via CLI:
./gradlew :app:installDebug    # Install to emulator
./gradlew :app:run             # Also opens emulator if needed

# Edit code → sync Gradle files (⌘⇧A → Gradle sync)
```

Debugging: Android Studio Logcat.

## Database operations

### View/edit data

```bash
# Open Supabase studio (local)
supabase studio

# Or programmatically
supabase db execute "SELECT * FROM mantras LIMIT 5;"
```

### Create a migration

```bash
# After modifying schema.sql or wanting to add a new feature:
supabase migration new add_custom_field

# Edit the generated supabase/migrations/[timestamp]_add_custom_field.sql
supabase db push               # Test locally
git add supabase/migrations/
git commit -m "migration: add custom field"
```

### Seed data

```bash
# Add seed SQL to supabase/seed.sql
supabase db seed

# Or bulk insert via SQL:
supabase db execute "INSERT INTO mantras (slug, devanagari, ...) VALUES (...);"
```

### Reset to fresh state

```bash
supabase db reset              # Drop everything + re-run all migrations
```

## Environment & secrets

### Local dev

```bash
# .env.local (never commit this)
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=eyJh...
SUPABASE_SERVICE_ROLE_KEY=eyJh...
```

### Production

Set in GitHub repo → Settings → Secrets and variables → Actions:

```
SUPABASE_URL=https://neqnfukluaxwgtjjgrfu.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SERVICE_ROLE_KEY=sb_secret_...

CLOUDFLARE_API_TOKEN=...
CLOUDFLARE_ACCOUNT_ID=...

VERCEL_TOKEN=...
VERCEL_PROJECT_ID=...

APPLE_TEAM_ID=...
APPLE_CERTIFICATE_P8=...
APPLE_CERTIFICATE_P8_PASSWORD=...

PLAY_STORE_JSON=...
```

## Connecting to production Supabase

To work against the live database (for testing deployments):

```bash
# Update .env.local
VITE_SUPABASE_URL=https://neqnfukluaxwgtjjgrfu.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_O6pzpR_...

# You must sign in with a real account (or use the demo profile)
# Demo profile email: demo@chanttracker.app (password: demo)
```

⚠️ **Warning**: This writes real data. Use sparingly.

## Troubleshooting

### "Cannot find module '@supabase/supabase-js'"

```bash
pnpm install              # Make sure dependencies installed
pnpm clean && pnpm install  # Nuclear option (clears cache)
```

### "Supabase Studio won't open"

```bash
supabase status           # Check if services running
supabase stop
supabase start            # Fresh start
```

### "iOS build fails: 'Xcode project not found'"

```bash
cd apps/ios
ls *.xcodeproj            # Should see ChantTrackerApp.xcodeproj
xed ChantTrackerApp.xcodeproj  # Explicit path
```

### "Android emulator won't start"

```bash
# List available emulators
emulator -list-avds

# Start one manually
emulator -avd Pixel_5_API_33

# Then gradle install:
./gradlew :app:installDebug
```

### "Database migrations fail"

```bash
# Check migration status
supabase migration list

# If stuck, reset:
supabase db reset
supabase db push          # Re-apply from scratch
```

## Next steps

- Read **[ARCHITECTURE.md](ARCHITECTURE.md)** for system design
- Read **[DEPLOYMENT.md](DEPLOYMENT.md)** for CI/CD setup
- Read **[API.md](API.md)** for supabaseClient.js reference

Happy coding! 🙏
