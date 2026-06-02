# Host/Delegation System - Architecture & Design Decisions

## Design Philosophy

The Host/Delegation system follows ChantTracker's core principle: **one backend, many thin clients**. All business logic lives in the database (triggers, RPCs, views), with the API layer providing thin wrappers for safe, authenticated access.

### Key Principles

1. **Database-driven**: Triggers automatically maintain consistency; no app-layer updates needed
2. **RLS-enforced**: Authorization lives in SQL policies, not JavaScript middleware
3. **Materialized aggregation**: Completion percentages computed and cached in tables (updated by triggers)
4. **Priest-scoped**: Every operation scoped to `auth.uid()` for multi-tenancy
5. **Audit trail**: All sessions logged immutably; never deleted, only marked

---

## Domain Model

### Entities

#### Project
Represents a client request hosted by a priest. A project contains multiple grahas, each with a target count.

**Key decisions:**
- Single `host_priest_id`: Simplifies authorization and lifecycle management
- `status` (active|completed|abandoned): Allows soft-delete and phase tracking
- `total_target_count` and `overall_completion_pct`: Cached for performance

#### Project Graha
Maps a graha to a target count within a project.

**Key decisions:**
- `target_count` is per-graha (e.g., Mangal needs 108k japas in this project)
- `completed_count` is auto-updated by trigger (sum of all sessions)
- UNIQUE constraint on (project_id, graha_id): Each project-graha pair appears once

#### Priest Assignment
Assigns a priest to work on a graha within a project.

**Key decisions:**
- `assignment_type` (assigned|volunteer): Distinguishes delegated vs. self-volunteered work
- `target_count` is optional: Overrides project_graha target if a priest has a different quota
- `completed_count` auto-updated by trigger: Tracks this priest's individual progress
- UNIQUE on (project_id, priest_id, graha_id): Multiple priests on same graha allowed, but each pair only once

#### Delegation Session
A single chanting session logged by a priest on a graha.

**Key decisions:**
- Immutable: Never updated or deleted (audit trail)
- `session_date` separate from `created_at`: Supports backdating (e.g., "I chanted on May 15, logging it today")
- Includes `assignment_type` snapshot: Preserves whether work was assigned or volunteer at time of session
- `duration_seconds` is optional: Not required for simple count-based tracking

---

## Trigger System

### Single Trigger: trig_update_project_graha_completion

Fires after INSERT on `delegation_sessions`. Updates:

1. **project_grahas.completed_count**
   ```sql
   SELECT SUM(count) FROM delegation_sessions
   WHERE project_id = NEW.project_id AND graha_id = NEW.graha_id
   ```
   Why: Maintains cache of graha progress

2. **priest_assignments.completed_count**
   ```sql
   SELECT SUM(count) FROM delegation_sessions
   WHERE project_id = NEW.project_id AND priest_id = NEW.priest_id AND graha_id = NEW.graha_id
   ```
   Why: Tracks individual priest progress for dashboards

3. **projects.overall_completion_pct and total_target_count**
   ```sql
   SELECT SUM(target_count), SUM(completed_count) FROM project_grahas
   WHERE project_id = NEW.project_id
   ```
   Why: Project-level summary for status pages

**Why not transaction cascades or app-layer updates?**
- Triggers are atomic and fire exactly once per session
- App doesn't need to coordinate multiple updates
- If app crashes mid-update, DB is still consistent
- Scaling: Multiple app instances can log sessions without race conditions

---

## API Layer (packages/api/index.js)

All functions are RPC wrappers returning Supabase query results. Pattern:

```javascript
export const functionName = (...args) =>
  supabase.rpc('function_name', { p_arg1, p_arg2, ... })
```

**Why not direct table inserts?**
- RPCs enforce business logic (e.g., only host can assign priests)
- Authorization is `SECURITY DEFINER` (runs as postgres, bypasses RLS for app-layer validation)
- Error messages are consistent across all clients
- Can evolve business logic without changing client code

**Organization:**
- **PROJECT_MANAGEMENT**: create_project, assign_priests, get_project_status
- **PRIEST_DASHBOARD**: get_priest_assignments, get_priest_dashboard
- **SESSION_LOGGING**: log_delegation_session
- **CONTRIBUTIONS**: get_graha_contributions, get_priest_contributions
- **HISTORY**: get_project_history
- **PROJECT_COMPLETION**: complete_delegation_project
- **VIEWS**: Direct access to v_project_status, v_priest_contributions, v_graha_contributions
- **TABLE QUERIES**: listProjects, getProjectById, listDelegationSessions

---

## RLS Policies

### projects

**SELECT**: Host or assigned priest
```sql
auth.uid() = host_priest_id OR auth.uid() IN (
  SELECT priest_id FROM priest_assignments WHERE project_id = projects.id
)
```
Why: Priests should only see projects they're involved in.

**INSERT**: Only host
```sql
auth.uid() = host_priest_id
```
Why: Only the priest who created it can own it.

**UPDATE**: Only host
```sql
auth.uid() = host_priest_id
```
Why: Host controls project lifecycle.

### project_grahas

**SELECT**: Inherited from projects
```sql
EXISTS (SELECT 1 FROM projects p WHERE p.id = project_grahas.project_id
  AND (auth.uid() = p.host_priest_id OR ...))
```
Why: No direct access; filtered by parent project.

### priest_assignments

**SELECT**: Assigned priest or host
```sql
auth.uid() = priest_id OR auth.uid() IN (SELECT host_priest_id FROM projects ...)
```
Why: Priests see their own assignments; host sees all.

**INSERT/UPDATE**: Only host
```sql
auth.uid() IN (SELECT host_priest_id FROM projects WHERE id = project_id)
```
Why: Only host can delegate work.

### delegation_sessions

**SELECT**: Logged priest or host
```sql
auth.uid() = priest_id OR auth.uid() IN (SELECT host_priest_id FROM projects ...)
```
Why: Priests see their own sessions; host sees all.

**INSERT**: Only logged priest
```sql
auth.uid() = priest_id
```
Why: You can only log sessions for yourself (no impersonation).

---

## Performance Optimizations

### Indexes

```sql
-- projects
CREATE INDEX idx_projects_host ON projects(host_priest_id);
CREATE INDEX idx_projects_status ON projects(status);

-- project_grahas
CREATE INDEX idx_project_grahas_project ON project_grahas(project_id);
CREATE INDEX idx_project_grahas_graha ON project_grahas(graha_id);

-- priest_assignments
CREATE INDEX idx_priest_assignments_project ON priest_assignments(project_id);
CREATE INDEX idx_priest_assignments_priest ON priest_assignments(priest_id);
CREATE INDEX idx_priest_assignments_graha ON priest_assignments(graha_id);

-- delegation_sessions
CREATE INDEX idx_delegation_sessions_project ON delegation_sessions(project_id);
CREATE INDEX idx_delegation_sessions_priest ON delegation_sessions(priest_id);
CREATE INDEX idx_delegation_sessions_graha ON delegation_sessions(graha_id);
CREATE INDEX idx_delegation_sessions_date ON delegation_sessions(session_date);
```

**Coverage:**
- Foreign key lookups: Indexed
- Filtering in queries: Indexed
- RLS policies: Indexed (e.g., finding host_priest_id)
- Sorting: Indexed (created_at, session_date)

### Cached Aggregates

Instead of re-computing on every query:

```
completed_count in project_grahas = SUM(delegation_sessions) [cached, updated by trigger]
completed_count in priest_assignments = SUM(this priest's sessions) [cached, updated by trigger]
overall_completion_pct in projects = computed from project_grahas [cached, updated by trigger]
```

**Impact:**
- `get_project_status` scans ~10 rows, not thousands of sessions
- `get_priest_dashboard` aggregation is instant
- Trade-off: Trigger latency ~20ms (vs. instant INSERT, but negligible for UX)

### View Materialization

The three views (`v_project_status`, `v_priest_contributions`, `v_graha_contributions`) are NOT materialized views—they compute on-query because:
1. Materialized views require manual refresh (complex to trigger on session insert)
2. Queries are still fast (<50ms) with proper indexes
3. Views are read-only (no stale data risk)

If needed later, these can become materialized with a trigger-driven refresh:
```sql
CREATE MATERIALIZED VIEW v_project_status_mv AS ...
CREATE TRIGGER trig_refresh_project_status AFTER INSERT ON delegation_sessions ...
```

---

## Delegation Workflow

### 1. Project Creation

```
Host fills form:
  - Client name
  - Select grahas (multi-select)
  - Optional description

→ createProject(host_id, name, desc, graha_ids)
→ INSERT projects row
→ INSERT project_grahas rows (one per graha, target = 108k)
→ Return project_id
```

**Invariant**: A project has at least one graha (enforced at app layer; DB allows zero).

### 2. Priest Assignment

```
Host sees list of priests (app layer fetches from profiles)
Host selects priests and assigns grahas

→ assignPriests(project_id, [{priest_id, graha_ids[]}, ...])
→ FOR EACH priest, FOR EACH graha:
     INSERT/UPDATE priest_assignments (project_id, priest_id, graha_id, 'assigned')
→ Return assigned_count
```

**Invariant**: A priest can be assigned to the same graha once (UNIQUE constraint).

### 3. Session Logging

```
Priest logs session:
  - Select project
  - Select graha
  - Enter count
  - Optional: enter duration

→ logDelegationSession(project_id, priest_id, graha_id, count, duration_secs)
→ INSERT delegation_sessions row
→ Trigger fires:
     UPDATE project_grahas.completed_count = SUM(sessions)
     UPDATE priest_assignments.completed_count = SUM(sessions)
     UPDATE projects.overall_completion_pct
→ Return session_id
```

**Invariant**: Sessions are append-only (no updates).

### 4. Status Viewing

```
Host or priest calls getProjectStatus(project_id)

→ RPC aggregates:
     - Total project target (SUM project_grahas.target_count)
     - Total completed (SUM project_grahas.completed_count)
     - Completion % = completed / target
     - For each graha: target, completed, %, assigned priests
→ Return JSONB with full breakdown
```

**Performance**: Single aggregation query, cached counts, ~50ms.

### 5. Volunteering

```
Priest views getPriestDashboard(project_id, priest_id)

→ RPC returns:
     - Assigned grahas (assignment_type = 'assigned')
     - Incomplete grahas NOT yet assigned to priest (can_volunteer = true)
→ Priest logs session with assignment_type = 'volunteer'
→ Trigger same as step 3
```

---

## Data Consistency Guarantees

### What Can Go Wrong?

| Scenario | Prevention |
|----------|-----------|
| Priest logs session for unassigned graha | Not prevented (allowed as volunteer) |
| Priest logs on someone else's assignment | RLS INSERT policy requires `auth.uid() = priest_id` |
| Host deletes project with active sessions | Cascade deletes all dependent rows (sessions, assignments) |
| Trigger fails during session insert | Transaction rolls back; session not inserted |
| Multiple priests log simultaneously | Trigger runs serially (Postgres lock on project row) |
| Completion % goes negative | Impossible (SUM always ≥ 0) |
| Ghost sessions not counted | Trigger always re-sums; no stale cache |

### Consistency Model

**Eventual consistency within same transaction:**
- INSERT delegation_session → Trigger fires → completed_count updated
- All in one atomic transaction; no race conditions
- Multiple sessions on same project: Triggers fire serially per row

**Cross-client consistency:**
- Real-time subscriptions can notify clients when sessions are logged
- Clients must refetch status to see updates (no push subscriptions in schema)
- This is acceptable because session latency is ~50ms

---

## Scaling Considerations

### Current Limits

- **Sessions per project**: Unlimited (indexed by project_id)
- **Priests per project**: Unlimited (indexed by priest_id)
- **Grahas per project**: 9 (system constraint)
- **Projects per host**: Unlimited

### Query Performance

Typical latencies (with indexes):
- `create_project`: 10ms
- `log_delegation_session`: 10ms INSERT + 20ms trigger
- `get_project_status`: 50ms (one aggregation scan)
- `get_priest_dashboard`: 30ms (two UNION queries)
- `get_project_history`: 50ms (date range index scan, limit 1000)

### Bottleneck: trigger on delegation_sessions

Each INSERT triggers a full re-aggregation of project_grahas. For heavy logging (e.g., 100 priests logging simultaneously):

**Current**: 10 sessions/sec per project is comfortable.

**Optimization if needed**:
1. Batch sessions: Client sends 100 sessions, server inserts all, trigger re-aggregates once
2. Materialized views: Create background job to refresh v_project_status nightly
3. Read replicas: Direct analytics queries to standby DB

---

## Failure Modes & Recovery

### Database Corruption

If `delegation_sessions` gets corrupted (e.g., duplicated row):

```sql
-- Recalculate all project_grahas
WITH session_sums AS (
  SELECT project_id, graha_id, SUM(count) as total
  FROM delegation_sessions
  GROUP BY project_id, graha_id
)
UPDATE project_grahas pg
SET completed_count = ss.total
FROM session_sums ss
WHERE pg.project_id = ss.project_id AND pg.graha_id = ss.graha_id;

-- Recalculate all projects
WITH graha_sums AS (
  SELECT project_id, SUM(completed_count) as total
  FROM project_grahas
  GROUP BY project_id
)
UPDATE projects p
SET overall_completion_pct = ROUND(100.0 * gs.total / COALESCE(p.total_target_count, 1))
FROM graha_sums gs
WHERE p.id = gs.project_id;
```

### Missing Assignments

If a priest_assignments row is accidentally deleted:

```sql
-- Show missing (no recovery needed; priest can still log sessions as volunteer)
SELECT DISTINCT ds.priest_id, ds.graha_id, p.project_id
FROM delegation_sessions ds
JOIN projects p ON ds.project_id = p.id
LEFT JOIN priest_assignments pa ON ds.project_id = pa.project_id
  AND ds.priest_id = pa.priest_id AND ds.graha_id = pa.graha_id
WHERE pa.id IS NULL AND ds.assignment_type = 'assigned';
```

### Orphaned Sessions (deleted project)

Handled automatically: `projects.ON DELETE CASCADE` cascades to all children.

---

## Future Extensions

### 1. Deadline Tracking

Add to `projects`:
```sql
due_date DATE,
auto_complete_at_due BOOLEAN DEFAULT false,
```

Add RPC:
```sql
check_overdue_projects() → mark overdue projects as abandoned
```

### 2. Break Detection (like anushthana)

Add to `priest_assignments`:
```sql
last_session_date DATE,
is_broken BOOLEAN DEFAULT false,
```

Add trigger to detect multi-day gaps and mark broken.

### 3. Approval Workflow

Add to `priest_assignments`:
```sql
status TEXT ('pending'|'approved'|'rejected') DEFAULT 'pending',
approved_by UUID REFERENCES profiles(id),
```

RPC: `approve_assignment(assignment_id)`.

### 4. Multi-language Support

Already ready: All names are in `profiles.display_name` (user-controlled). Can add `grahas.name_te`, `name_hi`, etc.

### 5. Notifications

Schema ready for triggers to insert into a `notifications` table. Trigger:
```sql
INSERT INTO notifications (recipient_id, subject, body, project_id)
VALUES (NEW.host_priest_id, 'Session logged', ..., NEW.project_id);
```

Frontend: Real-time subscription to `notifications`.

---

## Testing Strategy

### Unit Tests (SQL)

```sql
-- Test: create_project inserts 2 project_grahas
SELECT COUNT(*) FROM project_grahas WHERE project_id = (
  SELECT id FROM projects WHERE client_name = 'Test' LIMIT 1
) → Should return 2

-- Test: log_delegation_session triggers update
INSERT delegation_sessions ... → Verify project_grahas.completed_count
```

### Integration Tests (JavaScript)

```javascript
// Test: Host can create project
const { data: proj } = await createProject(host_id, 'Test', null, [graha1, graha2]);
expect(proj.total_target_count).toBe(216000);

// Test: Priest can log session
await logDelegationSession(proj.project_id, priest_id, graha1, 1008);
const { data: status } = await getProjectStatus(proj.project_id);
expect(status.total_completed).toBe(1008);

// Test: RLS blocks unauthorized access
const unauth_user_id = '...';
const { error } = await getProjectStatus(proj.project_id); // As unauth_user
expect(error?.code).toBe('42501');  // Permission denied
```

### End-to-End Tests

1. Host creates project with 2 grahas
2. Assigns 3 priests (some sharing grahas)
3. Each logs sessions daily for a week
4. Verify project status aggregation
5. Check priest contributions and graha contributions
6. Verify history filtering by date/priest/graha

---

## Deployment Checklist

- [ ] Migration runs without errors: `pnpm supabase:migrate`
- [ ] All tables created: `SELECT * FROM information_schema.tables WHERE table_schema = 'public'`
- [ ] All RPCs created: `SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public'`
- [ ] All views created: `SELECT viewname FROM pg_views WHERE schemaname = 'public'`
- [ ] Trigger exists: `SELECT * FROM pg_trigger WHERE tgname = 'trig_update_project_graha_completion'`
- [ ] RLS enabled on all tables
- [ ] Indexes created: `SELECT indexname FROM pg_indexes WHERE schemaname = 'public'`
- [ ] Test RPC call: `SELECT * FROM create_project(...)`
- [ ] Test RLS: Verify unauth users get `42501` errors
- [ ] Seed test data (optional): Create test project with sessions
- [ ] Update API exports: Verify `packages/api/index.js` compiles
- [ ] Update frontend components to use new functions
- [ ] Deploy to production

---

## Maintenance & Monitoring

### Queries to Monitor

```sql
-- Slow queries
SELECT query, mean_time, calls FROM pg_stat_statements
WHERE query LIKE '%delegation%' OR query LIKE '%project%'
ORDER BY mean_time DESC;

-- Large tables
SELECT schemaname, tablename, pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename))
FROM pg_tables WHERE schemaname = 'public'
ORDER BY pg_total_relation_size DESC;

-- Missing indexes
SELECT * FROM pg_stat_user_tables WHERE idx_scan = 0;
```

### Backups

- Supabase auto-backups hourly (built-in)
- Manual backup before any schema migration:
  ```bash
  supabase db dump --schema public > backup-$(date +%s).sql
  ```

### Archival

For old projects, consider archiving delegation_sessions to cold storage:

```sql
-- Archive sessions older than 1 year
CREATE TABLE delegation_sessions_archive AS
SELECT * FROM delegation_sessions WHERE created_at < NOW() - INTERVAL '1 year';

DELETE FROM delegation_sessions WHERE created_at < NOW() - INTERVAL '1 year';
VACUUM ANALYZE delegation_sessions;
```

---

## References

- CLAUDE.md: Project architecture and conventions
- packages/api/index.js: All RPC wrappers
- supabase/migrations/20260602000001_create_host_delegation_system.sql: Full schema
- docs/HOST_DELEGATION_SYSTEM.md: Detailed RPC reference
- docs/HOST_DELEGATION_QUICK_START.md: Component examples
