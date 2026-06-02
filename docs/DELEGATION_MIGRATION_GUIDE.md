# ChantTracker Delegation Schema - Migration & Deployment Guide

## Overview

This guide walks through deploying the Host/Delegation system schema to a live Supabase project.

**Migration File:** `/supabase/migrations/20260601000007_create_delegation_system.sql`

## Pre-Deployment Checklist

- [ ] Backup existing database (Supabase dashboard → Backups)
- [ ] Review schema documentation (DELEGATION_SCHEMA.md)
- [ ] Verify all existing users have profiles
- [ ] No conflicts with existing table names (check `public.*`)
- [ ] Staging environment available for testing
- [ ] Team notified of deployment window

## Deployment Steps

### Option 1: Local Development (Recommended First)

```bash
# Start local Supabase
pnpm supabase:studio

# This will:
# - Start Postgres on localhost:54322
# - Open Studio on localhost:54323

# In another terminal, apply migration
pnpm supabase:migrate

# Verify tables exist
# Open http://localhost:54323
# Check: Tables -> projects, project_grahas, priest_assignments, 
#         delegation_sessions, user_roles
```

### Option 2: Staging Environment

```bash
# Set staging Supabase credentials
export SUPABASE_URL="https://your-staging.supabase.co"
export SUPABASE_DB_PASSWORD="your-staging-password"

# Apply migration
pnpm supabase:migrate

# Verify in Studio
# https://app.supabase.com/project/your-staging/sql/migrations
```

### Option 3: Production Deployment (Manual)

If automated CLI migration isn't available:

1. **Get migration SQL**
   ```bash
   cat supabase/migrations/20260601000007_create_delegation_system.sql
   ```

2. **In Supabase Dashboard:**
   - Go to SQL Editor
   - Create new query
   - Copy entire migration file
   - Click "Run"
   - Verify success (check Tables section)

3. **Or via psql (if you have DB access):**
   ```bash
   psql -h your-db-host -U postgres -d postgres \
     -f supabase/migrations/20260601000007_create_delegation_system.sql
   ```

## Post-Deployment Verification

### 1. Verify Tables Exist

```bash
# Connect to your Supabase database
psql -h your-db-host -U postgres -d postgres

# Run verification query
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'user_roles', 'projects', 'project_grahas', 
  'priest_assignments', 'delegation_sessions'
)
ORDER BY table_name;
```

Expected output (5 tables):
```
      table_name
─────────────────────
 delegation_sessions
 priest_assignments
 project_grahas
 projects
 user_roles
```

### 2. Verify Views Exist

```sql
SELECT viewname FROM pg_views 
WHERE schemaname = 'public' 
AND viewname LIKE 'v_%'
ORDER BY viewname;
```

Expected output (5 views):
```
         viewname
──────────────────────
 v_graha_contributions
 v_priest_contributions
 v_project_priests
 v_project_status
 v_project_timeline
```

### 3. Verify Indexes

```sql
SELECT indexname FROM pg_indexes
WHERE schemaname = 'public'
AND tablename IN (
  'user_roles', 'projects', 'project_grahas',
  'priest_assignments', 'delegation_sessions'
)
ORDER BY tablename, indexname;
```

Expected: ~15 indexes created

### 4. Verify Triggers

```sql
SELECT trigger_name, event_object_table
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table;
```

Expected output:
```
         trigger_name              | event_object_table
──────────────────────────────────┼──────────────────
 tr_update_project_graha_count... | delegation_sessions
```

### 5. Test RLS Policies

```sql
-- Check user_roles RLS
SELECT * FROM information_schema.role_table_grants
WHERE table_name = 'user_roles';

-- Check projects RLS
SELECT * FROM information_schema.role_table_grants
WHERE table_name = 'projects';
```

You should see multiple policies per table.

### 6. Verify User Roles Initialization

```sql
-- Check that all existing users have default roles
SELECT COUNT(*) as total_profiles, 
       COUNT(ur.id) as users_with_role
FROM profiles p
LEFT JOIN user_roles ur ON p.id = ur.user_id;

-- Should be equal (all profiles have roles)
```

## Testing with Sample Data

### Step 1: Create Test Users

```sql
-- These are demo users (in auth.users)
-- The demo user should already exist from user creation migration

-- Check existing users
SELECT id, email FROM auth.users LIMIT 5;
```

### Step 2: Create Test Roles (if needed)

```sql
-- View demo user ID
SELECT id, display_name FROM profiles 
WHERE display_name = 'Demo User';

-- Assume id = '00000000-0000-0000-0000-000000000001'

-- Promote to main_priest
UPDATE user_roles 
SET role = 'main_priest' 
WHERE user_id = '00000000-0000-0000-0000-000000000001';

-- Verify
SELECT * FROM user_roles 
WHERE user_id = '00000000-0000-0000-0000-000000000001';
```

### Step 3: Create Test Project

```sql
-- Create a test project
INSERT INTO projects (
  name, 
  client_name, 
  host_priest_id,
  status
) VALUES (
  'Test Navagraha Yajna',
  'Test Client',
  '00000000-0000-0000-0000-000000000001',
  'active'
) RETURNING id;

-- Note the returned ID (let's call it PROJ_ID)
```

### Step 4: Add Grahas to Project

```sql
-- Get graha IDs
SELECT id, name FROM grahas LIMIT 3;

-- Add 3 grahas to project (substitute PROJ_ID and graha IDs)
INSERT INTO project_grahas (project_id, graha_id, target_count)
VALUES 
  ('PROJ_ID', 'graha-id-1', 6000),
  ('PROJ_ID', 'graha-id-2', 6000),
  ('PROJ_ID', 'graha-id-3', 6000);

-- Verify
SELECT pg.id, g.name, pg.target_count, pg.completed_count
FROM project_grahas pg
JOIN grahas g ON pg.graha_id = g.id
WHERE pg.project_id = 'PROJ_ID';
```

### Step 5: Test Trigger (Aggregation)

```sql
-- Create a test session
INSERT INTO delegation_sessions (
  user_id,
  project_id,
  project_graha_id,
  graha_id,
  count,
  assignment_type,
  session_status
) VALUES (
  '00000000-0000-0000-0000-000000000001',  -- demo user
  'PROJ_ID',
  'PG_ID_1',  -- first project_graha ID from above
  'graha-id-1',
  108,
  'VOLUNTEER',
  'completed'
);

-- Check that trigger updated completed_count
SELECT id, target_count, completed_count
FROM project_grahas
WHERE id = 'PG_ID_1';

-- Should show completed_count = 108 (auto-incremented by trigger)
```

### Step 6: Test Views

```sql
-- Test v_project_status
SELECT * FROM v_project_status
WHERE project_id = 'PROJ_ID';

-- Test v_priest_contributions
SELECT * FROM v_priest_contributions
WHERE project_id = 'PROJ_ID';

-- Test v_project_timeline
SELECT * FROM v_project_timeline
WHERE project_id = 'PROJ_ID';
```

## Rollback Plan

If deployment fails or issues are found:

### Option 1: Rollback Migration (Supabase)

```bash
# If migration failed during apply
# It should not have committed (transaction rollback)

# Verify tables don't exist
SELECT table_name FROM information_schema.tables
WHERE table_name = 'projects';

# Should return empty result
```

### Option 2: Manual Cleanup (if partial)

```sql
-- Drop all delegation system objects (in reverse order)
DROP TRIGGER IF EXISTS tr_update_project_graha_completed_count ON delegation_sessions;
DROP FUNCTION IF EXISTS update_project_graha_completed_count();
DROP VIEW IF EXISTS v_project_status;
DROP VIEW IF EXISTS v_priest_contributions;
DROP VIEW IF EXISTS v_graha_contributions;
DROP VIEW IF EXISTS v_project_timeline;
DROP VIEW IF EXISTS v_project_priests;
DROP TABLE IF EXISTS delegation_sessions CASCADE;
DROP TABLE IF EXISTS priest_assignments CASCADE;
DROP TABLE IF EXISTS project_grahas CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;
```

### Option 3: Restore from Backup

If rollback scripts don't work:

1. In Supabase Dashboard:
   - Go to Backups
   - Find backup before migration
   - Click "Restore"
   - Confirm (this will restore entire database)

## Validation After Deployment

### Functional Tests

- [ ] **Create project**: Main priest can create project
- [ ] **Add grahas**: Project can have multiple grahas with targets
- [ ] **Assign priests**: Priests can be assigned to projects
- [ ] **Create ASSIGNED session**: Assigned priest can log session
- [ ] **Create VOLUNTEER session**: Anyone can volunteer
- [ ] **Trigger test**: Completed session increments project_grahas.completed_count
- [ ] **View test**: All v_* views return correct data
- [ ] **RLS test**: Non-host priests can't see other projects

### Performance Tests

```bash
# Create many sessions and check query performance
# Should all execute in <100ms

# Query 1: List my sessions
SELECT * FROM delegation_sessions 
WHERE user_id = auth.uid()
LIMIT 100;
-- Should use idx_delegation_sessions_user_id

# Query 2: Project status aggregation
SELECT * FROM v_project_status
WHERE project_id = 'PROJ_ID';
-- Should aggregate 1K+ sessions in <50ms

# Query 3: Priest contributions
SELECT * FROM v_priest_contributions
WHERE project_id = 'PROJ_ID';
-- Should join 5 tables in <100ms
```

## Monitoring Post-Deployment

### Logs to Check

1. **Supabase Dashboard → Logs**
   - Check for auth errors (RLS policy failures)
   - Check for trigger errors
   - Look for slow queries

2. **Database Activity Monitor**
   - Monitor index usage
   - Check for missing indexes
   - Watch query execution times

### Alerts to Set (Optional)

If your Supabase plan supports alerts:

```
Alert: "Query duration > 1 second on delegation_sessions"
Alert: "RLS policy denial rate > 1%"
Alert: "Trigger execution errors"
```

## Common Issues & Fixes

### Issue 1: "Table already exists"

**Cause**: Migration ran twice or partial migration state

**Fix**:
```sql
DROP TABLE IF EXISTS user_roles CASCADE;
-- Then re-run migration
```

### Issue 2: "Foreign key constraint violation"

**Cause**: Non-existent graha_id referenced

**Fix**: Verify grahas table has seed data:
```sql
SELECT COUNT(*) FROM grahas;
-- Should be > 0

-- If empty, seed grahas first
INSERT INTO grahas (name, position) VALUES ('Shani', 7);
```

### Issue 3: "Permission denied for schema public"

**Cause**: User doesn't have sufficient Postgres privileges

**Fix**:
```sql
-- Grant privileges (as postgres superuser)
GRANT ALL ON SCHEMA public TO your_user;
GRANT ALL ON ALL TABLES IN SCHEMA public TO your_user;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO your_user;
```

### Issue 4: Trigger not firing

**Cause**: Trigger disabled or syntax error

**Fix**:
```sql
-- Check trigger status
SELECT trigger_name, tgenabled FROM pg_trigger
WHERE tgrelname = 'delegation_sessions';

-- Should show 'O' (enabled)

-- If disabled, enable it:
ALTER TABLE delegation_sessions ENABLE TRIGGER tr_update_project_graha_completed_count;
```

### Issue 5: Views returning empty/wrong data

**Cause**: No sessions created or view definition error

**Fix**:
```sql
-- Check if sessions exist
SELECT COUNT(*) FROM delegation_sessions;

-- Check view definition
SELECT definition FROM information_schema.views
WHERE table_name = 'v_project_status';

-- Manually recreate view:
DROP VIEW IF EXISTS v_project_status;
-- Copy CREATE OR REPLACE VIEW ... from migration file
```

## Rollforward After Rollback

If you roll back and then want to re-deploy:

1. **Fix the issue** identified during rollback testing
2. **Update migration file** if needed
3. **Run migration again** (idempotent due to IF NOT EXISTS)
4. **Verify tables exist**
5. **Run validation tests**

All tables use `IF NOT EXISTS`, so re-running is safe.

## Timeline Estimate

| Step | Time |
|------|------|
| Local testing | 15 min |
| Staging deployment | 5 min |
| Staging validation | 10 min |
| Production backup | 2 min |
| Production migration | 2 min |
| Production validation | 10 min |
| Sample data tests | 10 min |
| **Total** | **54 min** |

## Post-Migration Tasks

### For Development Team

- [ ] Update API package (packages/api/index.js) with new RPCs/queries
- [ ] Create frontend components for delegation UI
- [ ] Update auth middleware to check user_roles
- [ ] Create API documentation for delegation endpoints

### For QA

- [ ] Create test cases for all 5 tables
- [ ] Create test cases for all 5 views
- [ ] Test RLS policies (who can see what)
- [ ] Load testing (1K+ sessions)
- [ ] Trigger testing (edge cases)

### For Ops

- [ ] Set up monitoring for delegation_sessions table
- [ ] Set up alerts for trigger failures
- [ ] Create runbook for common issues
- [ ] Document backup/restore procedures

## Additional Resources

- **Full Schema Docs**: `/docs/DELEGATION_SCHEMA.md`
- **Data Model Diagrams**: `/docs/DELEGATION_DATA_MODEL.md`
- **Quick Reference**: `/docs/DELEGATION_SCHEMA_QUICK_REF.md`
- **API Design**: `/docs/DELEGATION_API.md` (to be created)
- **Frontend Guide**: `/apps/web/docs/DELEGATION_UI.md` (to be created)

## Support

If you encounter issues:

1. Check "Common Issues & Fixes" section above
2. Review migration SQL file for syntax
3. Check Supabase logs for detailed error messages
4. Verify all prerequisites were met
5. Test in staging before production

## Sign-Off

- [ ] Migration tested locally
- [ ] Migration tested on staging
- [ ] All validation tests pass
- [ ] Team reviewed changes
- [ ] Backup taken
- [ ] **READY FOR PRODUCTION**

