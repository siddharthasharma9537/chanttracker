# ChantTracker Host/Delegation System - Database Schema Documentation

## Overview

The Host/Delegation system enables Main Priests to create chanting projects and assign multiple priests to work on them. This design supports:

- **Project-based organization**: Main Priests create projects for clients with specific graha targets
- **Flexible priest assignment**: Multiple priests can work on the same graha
- **Dual work modes**: Support for both ASSIGNED (contracted) and VOLUNTEER work tracking
- **Real-time aggregation**: Project progress automatically aggregates as sessions complete
- **Comprehensive audit trail**: Full history of all contributions queryable by priest, graha, project, date, and type

## Database Tables

### 1. `user_roles` - User Type Classification

Tracks which users are priests and distinguishes Main Priests from regular Priests.

```sql
id                uuid          -- Primary key
user_id           uuid          -- FK to profiles(id)
role              text          -- 'regular_user' | 'priest' | 'main_priest'
created_at        timestamp     -- Record creation time
updated_at        timestamp     -- Last update time
UNIQUE(user_id)
```

**Key Design Points:**
- World-readable (anyone can view priest lists for project displays)
- Role changes managed by app layer (admin interface)
- Defaults to 'regular_user' for new profile creation
- Supports future role hierarchy expansion

**RLS Policies:**
- SELECT: Anyone can view
- INSERT/UPDATE/DELETE: Only own role (app controls promotion)

---

### 2. `projects` - Main Container for Delegation Work

Projects group chanting work for a specific client under one Main Priest's leadership.

```sql
id                        uuid          -- Primary key
name                      text          -- Project name (e.g., "Lakshmi Homam 2026")
description               text          -- Optional project description
client_name               text          -- Client paying for/receiving services
client_contact            text          -- Email or phone
host_priest_id            uuid          -- FK to profiles(id) - the Main Priest
status                    text          -- 'active' | 'completed' | 'paused' | 'archived'
start_date                date          -- Project start
target_completion_date    date          -- Target end date (nullable)
notes                     text          -- Private notes for Main Priest
created_at                timestamp
updated_at                timestamp
```

**Key Design Points:**
- Single host per project (no shared management)
- Status field allows pausing mid-project
- Date fields enable scheduling and deadline tracking
- Extensible via notes field

**RLS Policies:**
- SELECT: Host priest OR assigned priests (via priest_assignments)
- INSERT: Host priest of their own projects
- UPDATE/DELETE: Host priest only

**Indexes:**
- `idx_projects_host_priest_id` - for listing Main Priest's projects
- `idx_projects_status` - for filtering active/completed
- `idx_projects_created_at` - for sorting/timeline queries

---

### 3. `project_grahas` - Project × Graha Mapping

Maps each graha (planetary deity) to a project with a chant target and tracks completion.

```sql
id                uuid          -- Primary key
project_id        uuid          -- FK to projects(id)
graha_id          uuid          -- FK to grahas(id)
target_count      integer       -- Total mantras needed (e.g., 6000)
completed_count   integer       -- Auto-aggregated from delegation_sessions
notes             text          -- Optional graha-specific notes
created_at        timestamp
updated_at        timestamp
UNIQUE(project_id, graha_id)
```

**Key Design Points:**
- One graha can appear in multiple projects (same graha, different clients)
- `completed_count` maintained by trigger (always in sync with sessions)
- No direct completion percentage calculation here (computed in views)
- Supports updating target mid-project (rare but handled)

**RLS Policies:**
- SELECT: Host priest OR assigned priests
- INSERT/UPDATE/DELETE: Host priest only

**Indexes:**
- `idx_project_grahas_project_id` - for listing grahas in a project
- `idx_project_grahas_graha_id` - for finding all projects using a graha

**Triggers:**
- `tr_update_project_graha_completed_count` (see section 7)

---

### 4. `priest_assignments` - Priest Role Assignment

Assigns priests to a project and specifies which grahas they're responsible for.

```sql
id                uuid          -- Primary key
project_id        uuid          -- FK to projects(id)
priest_id         uuid          -- FK to profiles(id)
assigned_grahas   uuid[]        -- Array of project_graha IDs (can be empty)
assignment_notes  text          -- Why/how assigned, e.g., "Shani specialist"
assigned_at       timestamp     -- When assignment created
updated_at        timestamp     -- Last modification
UNIQUE(project_id, priest_id)
```

**Key Design Points:**
- One assignment per (project, priest) pair
- `assigned_grahas` array allows flexible scoping:
  - Empty array: Priest can work on any graha in project
  - Specific IDs: Priest restricted to those grahas (enforced in app layer)
- Assignment notes improve transparency
- No explicit "end date" (archive projects when no longer assigning)

**RLS Policies:**
- SELECT: Priest sees own; Host sees all for their projects
- INSERT/UPDATE/DELETE: Host priest only

**Indexes:**
- `idx_priest_assignments_project_id` - for listing priests in a project
- `idx_priest_assignments_priest_id` - for listing priest's assignments
- `idx_priest_assignments_unique` - enforce unique constraint efficiently

---

### 5. `delegation_sessions` - Individual Chanting Sessions

Records every chanting session performed as part of delegation work. This is the core audit log.

```sql
id                    uuid          -- Primary key
user_id               uuid          -- FK to profiles(id) - who chanted
project_id            uuid          -- FK to projects(id)
project_graha_id      uuid          -- FK to project_grahas(id)
graha_id              uuid          -- FK to grahas(id) [denormalized for queries]
count                 integer       -- Mantras completed (e.g., 108, 216)
duration_seconds      integer       -- How long it took (nullable)
assignment_type       text          -- 'ASSIGNED' | 'VOLUNTEER'
session_status        text          -- 'active' | 'completed' | 'abandoned'
started_at            timestamp     -- Session start
ended_at              timestamp     -- Session end (nullable for active)
notes                 text          -- Session notes (e.g., "skipped 5 mantras due to error")
created_at            timestamp
updated_at            timestamp
```

**Key Design Points:**
- Denormalized `graha_id` for faster filtering without joins
- `count` can differ from standard 108 (supports flexible session sizes)
- `assignment_type` enables sorting/reporting by work category
- `session_status` allows state transitions (active → completed, active → abandoned)
- Full timestamp history enables reconstruction of activity at any point
- Only COMPLETED sessions increment project_graha.completed_count (via trigger)

**RLS Policies:**
- SELECT: Priest sees own; Host sees all for their projects
- INSERT: Priest can create sessions IF:
  - For ASSIGNED: Priest is assigned to the project
  - For VOLUNTEER: Anyone can volunteer (no gate)
- UPDATE: Priest can update their own active sessions only

**Indexes:**
- `idx_delegation_sessions_user_id` - for "my sessions"
- `idx_delegation_sessions_project_id` - for "project sessions"
- `idx_delegation_sessions_graha_id` - for "graha across projects"
- `idx_delegation_sessions_project_graha_id` - critical for aggregation
- `idx_delegation_sessions_status` - for filtering completed/active
- `idx_delegation_sessions_assignment_type` - for volunteer vs assigned reports
- `idx_delegation_sessions_user_project` - for "priest's work on project"
- `idx_delegation_sessions_created_at` - for timeline/sorting

---

## Views (Read-Only Aggregations)

### `v_project_status`

High-level project dashboard showing graha completion by percentage.

**Columns:**
- `project_id`, `project_name`, `client_name`, `status`, `host_priest_id`
- `graha_id`, `graha_name`
- `target_count`, `completed_count`, `completion_percentage`
- `total_sessions`, `assigned_sessions`, `volunteer_sessions`
- `unique_priests` - count of priests who contributed

**Use Cases:**
- Main Priest dashboard: "How far along is each graha?"
- Client status update: "Project is 45% complete"
- Team metrics: "How many priests are contributing?"

---

### `v_priest_contributions`

Per-priest contribution summary by project and graha.

**Columns:**
- `project_id`, `project_name`
- `priest_id`, `priest_name`
- `graha_id`, `graha_name`
- `assignment_type`, `session_count`, `total_count`, `total_duration_seconds`
- `last_session_at`, `completed_sessions`

**Use Cases:**
- Priest profile: "Show my contributions to this project"
- Recognition: "Which priests contributed most?"
- Compensation: "Aggregate work by priest and assignment type"
- Load balancing: "Which priests are over/under-utilized?"

---

### `v_graha_contributions`

Graha-centric view showing all priests working on a specific graha.

**Columns:**
- `project_id`, `project_name`, `project_graha_id`
- `graha_id`, `graha_name`
- `target_count`, `completed_count`, `completion_percentage`
- `unique_priests`, `total_sessions`
- `assigned_sessions`, `volunteer_sessions`
- `last_contribution_at`

**Use Cases:**
- Graha focus: "Who's working on Shani for this project?"
- Bottleneck analysis: "This graha is slow; add priests"
- Domain expertise: "Which priests work on complex grahas?"

---

### `v_project_timeline`

Chronological log of all sessions for audit and replay.

**Columns:**
- `session_id`, `project_id`, `project_name`
- `priest_id`, `priest_name`
- `graha_id`, `graha_name`
- `count`, `duration_seconds`, `assignment_type`, `session_status`
- `started_at`, `ended_at`, `created_at`

**Use Cases:**
- Activity log: "What happened when?"
- Audit: "Prove sessions occurred with timestamps"
- Visualization: "Timeline of project progress"
- Debugging: "When did a session start/complete?"

---

### `v_project_priests`

Priest roster for a project with activity summary.

**Columns:**
- `project_id`, `project_name`
- `priest_id`, `priest_name`
- `assignment_type` (inferred from assignment)
- `total_sessions`, `total_count`
- `last_activity_at`
- `assigned_grahas` - array of graha names

**Use Cases:**
- Team management: "Who's assigned to this project?"
- Activity check: "Which priests are inactive?"
- Specialization: "This priest only works on X grahas"

---

## Triggers

### `tr_update_project_graha_completed_count`

**Function:** `update_project_graha_completed_count()`

Maintains `project_grahas.completed_count` in sync with `delegation_sessions`.

**Trigger Events:**
- `INSERT`: If `session_status = 'completed'`, increment `completed_count` by `count`
- `UPDATE`: 
  - `active` → `completed`: Increment
  - `completed` → `active` (revert): Decrement
  - `completed` → `completed` with count change: Adjust by difference
- `DELETE`: If `session_status = 'completed'`, decrement

**Key Design Points:**
- Only COMPLETED sessions count (active/abandoned don't contribute)
- Prevents `completed_count` from going negative (GREATEST)
- Recompute on every session change (not eventual consistency)
- Updated timestamp also touched for data freshness

**Safety:**
- Idempotent: Running 2x has same effect as 1x
- Transactional: If session insert fails, count not updated
- No manual intervention needed

---

## Backward Compatibility

### Coexistence with Personal Chanting

The personal chanting system (`chant_sessions`, `sankalpas`, `anushthanas`) is **fully independent**:

- Priests can have both personal practice and delegation work
- Personal sessions stay in `chant_sessions` (unchanged schema)
- Delegation sessions go in `delegation_sessions` (separate table)
- Views/RPCs can UNION both if needed (e.g., "my total chants across personal + delegation")
- No schema changes to existing tables (safe to deploy)

### Data Integrity

- No foreign keys from `chant_sessions` to `projects` (tables are independent)
- Profiles can have both personal history and delegation assignments
- User can be in `user_roles` without being in any `priest_assignments`
- Safe to archive/delete projects without affecting personal data

---

## Indexing Strategy

### Hot Path Indexes (Every App Use)

1. **`delegation_sessions(user_id)`** - "Show my sessions"
2. **`delegation_sessions(project_id)`** - "Show project sessions"
3. **`delegation_sessions(session_status)`** - "Filter active/completed"
4. **`project_grahas(project_id)`** - "Show project grahas"
5. **`priest_assignments(priest_id)`** - "Show my assignments"

### Reporting Indexes (Dashboard Use)

6. **`delegation_sessions(project_graha_id)`** - "Aggregate for graha"
7. **`projects(host_priest_id)`** - "List Main Priest's projects"
8. **`projects(status)`** - "Filter active/completed"

### Compound Indexes (Complex Queries)

9. **`delegation_sessions(user_id, project_id)`** - "Priest's work on project"
10. **`delegation_sessions(created_at)`** - "Timeline sorting"

Total: ~15 indexes (lean, no redundant covering indexes)

---

## RLS Policy Summary

| Table | SELECT | INSERT | UPDATE | DELETE |
|-------|--------|--------|--------|--------|
| **user_roles** | Public | Own only | Own only | Own only |
| **projects** | Host or assigned | Host | Host | Host |
| **project_grahas** | Host or assigned | Host | Host | Host |
| **priest_assignments** | Own or Host | Host | Host | Host |
| **delegation_sessions** | Own or Host | Own (+ role gate) | Own + active | N/A |

**Legend:**
- "Own" = `auth.uid()`
- "Host" = `host_priest_id = auth.uid()`
- "Assigned" = exists in `priest_assignments` for project
- Role gate = ASSIGNED requires assignment, VOLUNTEER open

---

## Trigger Behavior Examples

### Scenario 1: Complete a session
```sql
INSERT INTO delegation_sessions (..., count=108, session_status='completed')
-- Trigger: project_grahas.completed_count += 108
```

### Scenario 2: Revert completion (mistake)
```sql
UPDATE delegation_sessions SET session_status='active' WHERE id='xxx'
-- Trigger: project_grahas.completed_count -= 108
```

### Scenario 3: Update session count while completed
```sql
UPDATE delegation_sessions SET count=216 WHERE id='xxx' AND session_status='completed'
-- Trigger: project_grahas.completed_count += (216 - 108) = +108 more
```

### Scenario 4: Delete a session
```sql
DELETE FROM delegation_sessions WHERE id='xxx' AND session_status='completed'
-- Trigger: project_grahas.completed_count -= count (if was completed)
```

---

## Migration Path

### Step 1: Apply Migration
```bash
pnpm supabase:migrate
# Applies 20260601000007_create_delegation_system.sql
```

### Step 2: Promote Users (Optional)
```sql
-- Make a user a priest (via app admin UI or manual)
UPDATE user_roles SET role='priest' WHERE user_id='...'
UPDATE user_roles SET role='main_priest' WHERE user_id='...'
```

### Step 3: Create First Project
```sql
INSERT INTO projects (name, client_name, host_priest_id)
VALUES ('Navagraha Yajna', 'Client Name', 'main-priest-uuid')
```

### Step 4: Assign Grahas to Project
```sql
INSERT INTO project_grahas (project_id, graha_id, target_count)
VALUES (..., ..., 6000)
```

### Step 5: Assign Priests
```sql
INSERT INTO priest_assignments (project_id, priest_id, assigned_grahas)
VALUES (..., 'priest-uuid', ARRAY['project-graha-1', 'project-graha-2'])
```

### Step 6: Record Sessions
```sql
INSERT INTO delegation_sessions (
  user_id, project_id, project_graha_id, graha_id, count,
  assignment_type, session_status
) VALUES (...)
```

---

## Performance Considerations

### Query Patterns

**"My sessions on a project"**
```sql
SELECT * FROM delegation_sessions
WHERE user_id = auth.uid()
  AND project_id = '...'
ORDER BY created_at DESC;
-- Index: idx_delegation_sessions_user_project
```

**"Project progress by graha"**
```sql
SELECT * FROM v_project_status
WHERE project_id = '...'
-- Uses: project_grahas(project_id) and aggregation
```

**"Priest contributions"**
```sql
SELECT * FROM v_priest_contributions
WHERE project_id = '...' AND priest_id = '...';
-- View query joins 5 tables; plan is efficient with indexes
```

### Scaling Notes

- **Sessions per project**: 10K+ sessions: indexes handle efficiently
- **Priests per project**: 50+ priests: no join explosion (assignment is direct)
- **Projects per priest**: 100+ projects: `priest_assignments(priest_id)` index sufficient
- **Aggregation**: Project status computed at query-time (not materialized)
  - Add caching layer if 100+ projects or real-time refresh needed

---

## Future Extensions

### Possible Additions

1. **Session approval workflow**: Add `approved_by` and `approved_at` to sessions
2. **Payment tracking**: Link assignments to compensation records
3. **Priest specialization**: Master table of priest skills/grahas
4. **Project phases**: Break projects into phases with separate targets
5. **Notifications**: Trigger notifications when graha completes
6. **Comments/Discussion**: Add per-session or per-graha comment threads

### Schema-Safe Extensions

All future additions can be:
- Added to `delegation_sessions` as new nullable columns
- Added as separate join tables (no FK change needed)
- Added as separate audit/metadata tables
- Implemented via stored procedures (no table restructure)

---

## Testing Checklist

- [ ] Create project (host priest)
- [ ] Assign grahas to project
- [ ] Assign priests to project
- [ ] Create ASSIGNED session (priest verifies they're assigned)
- [ ] Create VOLUNTEER session (anyone can)
- [ ] Complete session → project_grahas.completed_count updates
- [ ] Revert session → completed_count reverts
- [ ] View v_project_status shows correct percentages
- [ ] View v_priest_contributions shows both ASSIGNED and VOLUNTEER
- [ ] View v_graha_contributions shows all priests on graha
- [ ] Host priest can see all sessions
- [ ] Regular priest can only see own sessions
- [ ] Delete project → cascade deletes sessions/assignments
- [ ] User role filters work (priest vs main_priest vs regular_user)

---

## File References

- **Migration**: `/supabase/migrations/20260601000007_create_delegation_system.sql`
- **Schema diagram**: See below
- **API endpoints** (to be created): `/packages/api/delegation.js`
- **Frontend** (to be created): `/apps/web/src/features/delegation/`

---

## Database Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      CORE ENTITIES                               │
├─────────────────────────────────────────────────────────────────┤
│
│  auth.users                 profiles                 user_roles
│  (Supabase Auth)            ├─ id (PK)              ├─ user_id (FK)
│                             ├─ display_name         ├─ role
│                             └─ ...                  └─ created_at
│
├─────────────────────────────────────────────────────────────────┤
│                    DELEGATION PROJECT HIERARCHY                  │
├─────────────────────────────────────────────────────────────────┤
│
│  projects                          projects
│  ├─ id (PK)                        ├─ host_priest_id (FK → profiles)
│  ├─ name                           ├─ status
│  ├─ client_name                    └─ ...
│  │
│  ├──→ project_grahas
│       ├─ id (PK)
│       ├─ project_id (FK)
│       ├─ graha_id (FK → grahas)
│       ├─ target_count
│       ├─ completed_count [← TRIGGER]
│       │
│       ├──→ delegation_sessions
│            ├─ id (PK)
│            ├─ user_id (FK → profiles)  [priest who chanted]
│            ├─ project_graha_id (FK)
│            ├─ graha_id (FK → grahas)
│            ├─ count
│            ├─ assignment_type (ASSIGNED | VOLUNTEER)
│            ├─ session_status (active | completed | abandoned)
│            └─ started_at, ended_at
│
│  priest_assignments
│  ├─ project_id (FK)
│  ├─ priest_id (FK → profiles)
│  ├─ assigned_grahas (UUID ARRAY)
│  └─ ...
│
├─────────────────────────────────────────────────────────────────┤
│                       REFERENCE DATA                              │
├─────────────────────────────────────────────────────────────────┤
│
│  grahas
│  ├─ id (PK)
│  ├─ name ("Shani", "Budha", ...)
│  └─ ...
│
└─────────────────────────────────────────────────────────────────┘

AGGREGATION: trigger updates project_grahas.completed_count
             when delegation_sessions complete
             
VIEWS:       v_project_status (graha × completion %)
             v_priest_contributions (priest × graha × count)
             v_graha_contributions (graha × priests × count)
             v_project_timeline (chronological sessions)
             v_project_priests (roster + activity)
```

---

## References

- **ChantTracker Architecture**: See `/CLAUDE.md`
- **Personal Chanting System**: `/docs/schema-personal.md` (if created)
- **API Design**: `/docs/DELEGATION_API.md` (to be created)
- **Frontend Design**: `/apps/web/docs/DELEGATION_UI.md` (to be created)

