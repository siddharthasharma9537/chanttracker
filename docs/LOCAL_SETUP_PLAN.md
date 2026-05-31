# Local Supabase Setup with Docker

## What's Happening

```
Docker Container Layout:
┌──────────────────────────────────────────┐
│         Docker Desktop (macOS)            │
├──────────────────────────────────────────┤
│                                           │
│  ┌─────────────────────────────────────┐ │
│  │   PostgreSQL 15 Container            │ │
│  │   Port: 54322                        │ │
│  └────────────────────┬────────────────┘ │
│                       │                   │
│  ┌────────────────────▼────────────────┐ │
│  │   Supabase Services (in containers) │ │
│  │   - PostgREST (API)      :54321    │ │
│  │   - GoTrue (Auth)        :54321    │ │
│  │   - Realtime             :54321    │ │
│  │   - Storage              :54321    │ │
│  │   - Studio (UI)          :54323    │ │
│  │   - Kong (Router)        :54321    │ │
│  └────────────────────┬────────────────┘ │
│                       │                   │
│  ┌────────────────────▼────────────────┐ │
│  │   Volumes (persist between runs)    │ │
│  │   ~/.supabase/projects/local/       │ │
│  └─────────────────────────────────────┘ │
│                                           │
└──────────────────────────────────────────┘
```

## Ports & Access

| Service | Port | URL |
|---------|------|-----|
| **Supabase API** | 54321 | http://localhost:54321 |
| **PostgreSQL** | 54322 | postgresql://postgres:postgres@localhost:54322/postgres |
| **Studio** (web UI) | 54323 | http://localhost:54323 |

## Next Steps

### 1. Create Migrations
```bash
# Create a migration for the demo_log fix
supabase migration new fix_demo_log

# Create migrations for missing tables
supabase migration new create_user_tables
```

### 2. Run Migrations
```bash
supabase db push  # Apply migrations to local DB
```

### 3. Seed Reference Data
```bash
supabase db seed  # Run supabase/seed/seed.sql
```

### 4. Test Backend
```bash
# Test demo_log RPC
curl -X POST http://localhost:54321/rest/v1/rpc/demo_log \
  -H "apikey: eyJ..." \
  -H "content-type: application/json" \
  -d '{"p_count":5,"p_devanagari":"ॐ नमः शिवाय"}'
```

### 5. Deploy to Live (when ready)
```bash
# Push local migrations to live Supabase project
supabase db push --linked
```

## File Structure

```
chanttracker/
├── supabase/
│   ├── config.toml           # Local Supabase config
│   ├── migrations/           # SQL migration files (to create)
│   │   ├── 20260531000001_fix_demo_log.sql
│   │   └── 20260531000002_create_user_tables.sql
│   └── seed/                 # Reference data (to create)
│       └── seed.sql
├── .supabase/                # Docker volumes (auto-created)
│   └── projects/
│       └── local/
└── packages/api/index.js     # Shared client
```

## Key Files to Create

1. **supabase/migrations/fix_demo_log.sql** — Fix the broken RPC
2. **supabase/migrations/create_user_tables.sql** — Create profiles, chant_sessions, etc.
3. **supabase/seed/seed.sql** — Insert test data (mantras, achievements, demo user)

## Reset Local Database (if needed)

```bash
supabase stop         # Stop containers
rm -rf ~/.supabase    # Delete volume data
supabase start        # Fresh start
supabase db push      # Reapply migrations
supabase db seed      # Reseed data
```

## Status Checks

```bash
supabase status       # Check all services
docker ps             # See running containers
docker logs supabase_db_local  # Database logs
```

---

**Advantage of Docker approach:**
- ✅ Isolated from system
- ✅ Exact production setup
- ✅ Easy to reset/reproduce
- ✅ No system-level dependencies
- ✅ Works across team (same image)
