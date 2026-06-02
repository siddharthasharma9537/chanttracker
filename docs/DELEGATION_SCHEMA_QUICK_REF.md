# ChantTracker Delegation Schema - Quick Reference

## Core Tables

### Projects
```sql
-- Create a project
INSERT INTO projects (name, client_name, host_priest_id)
VALUES ('Navagraha Yajna', 'Client Name', 'main-priest-uuid');

-- List my projects
SELECT * FROM projects WHERE host_priest_id = auth.uid();

-- Update project status
UPDATE projects SET status='paused' WHERE id='...';
```

### Project Grahas (Targets)
```sql
-- Add a graha to project
INSERT INTO project_grahas (project_id, graha_id, target_count)
VALUES ('proj-uuid', 'shani-uuid', 6000);

-- Check completion
SELECT 
  g.name, 
  pg.target_count, 
  pg.completed_count,
  ROUND((pg.completed_count::numeric / pg.target_count * 100), 2) as pct
FROM project_grahas pg
JOIN grahas g ON pg.graha_id = g.id
WHERE pg.project_id = 'proj-uuid';
```

### Priest Assignments
```sql
-- Assign priest to project
INSERT INTO priest_assignments (project_id, priest_id, assigned_grahas)
VALUES ('proj-uuid', 'priest-uuid', ARRAY['pg-uuid-1', 'pg-uuid-2']);

-- List my assignments
SELECT * FROM priest_assignments WHERE priest_id = auth.uid();

-- List team
SELECT pa.*, p.display_name 
FROM priest_assignments pa
JOIN profiles p ON pa.priest_id = p.id
WHERE pa.project_id = 'proj-uuid';
```

### Delegation Sessions
```sql
-- Create ASSIGNED session
INSERT INTO delegation_sessions (
  user_id, project_id, project_graha_id, graha_id, 
  count, duration_seconds, assignment_type, session_status
) VALUES (
  auth.uid(), 'proj-uuid', 'pg-uuid-1', 'shani-uuid',
  108, 1800, 'ASSIGNED', 'completed'
);

-- Create VOLUNTEER session
INSERT INTO delegation_sessions (
  user_id, project_id, project_graha_id, graha_id,
  count, assignment_type, session_status
) VALUES (
  auth.uid(), 'proj-uuid', 'pg-uuid-1', 'shani-uuid',
  108, 'VOLUNTEER', 'completed'
);

-- List my sessions
SELECT * FROM delegation_sessions 
WHERE user_id = auth.uid()
ORDER BY ended_at DESC;

-- List project sessions (host only)
SELECT ds.*, p.display_name as priest_name, g.name as graha_name
FROM delegation_sessions ds
JOIN profiles p ON ds.user_id = p.id
JOIN grahas g ON ds.graha_id = g.id
WHERE ds.project_id = 'proj-uuid'
ORDER BY ds.ended_at DESC;

-- Start session
INSERT INTO delegation_sessions (..., session_status='active', started_at=now())
RETURNING id;

-- Complete session
UPDATE delegation_sessions 
SET session_status='completed', ended_at=now(), count=108
WHERE id='sess-uuid' AND user_id=auth.uid();
-- [Trigger auto-increments project_grahas.completed_count]

-- Abandon session
UPDATE delegation_sessions
SET session_status='abandoned', ended_at=now()
WHERE id='sess-uuid' AND user_id=auth.uid();
```

## Views (Read-Only Dashboards)

### Project Status
```sql
-- High-level project progress
SELECT * FROM v_project_status 
WHERE project_id = 'proj-uuid'
ORDER BY graha_name;

-- Columns:
-- project_name, client_name, status
-- graha_name, target_count, completed_count, completion_percentage
-- total_sessions, assigned_sessions, volunteer_sessions, unique_priests
```

### Priest Contributions
```sql
-- What did each priest do?
SELECT * FROM v_priest_contributions
WHERE project_id = 'proj-uuid'
ORDER BY total_count DESC;

-- Columns:
-- priest_name, graha_name
-- assignment_type (ASSIGNED | VOLUNTEER)
-- session_count, total_count, total_duration_seconds
-- last_session_at, completed_sessions
```

### Graha Contributions (Collaborators)
```sql
-- Who worked on each graha?
SELECT * FROM v_graha_contributions
WHERE project_id = 'proj-uuid'
ORDER BY graha_name;

-- Columns:
-- graha_name, target_count, completed_count, completion_percentage
-- unique_priests, total_sessions, assigned_sessions, volunteer_sessions
-- last_contribution_at
```

### Project Timeline (Audit Log)
```sql
-- Chronological activity log
SELECT * FROM v_project_timeline
WHERE project_id = 'proj-uuid'
ORDER BY started_at DESC;

-- Columns:
-- priest_name, graha_name, count, duration_seconds
-- assignment_type, session_status, started_at, ended_at
```

### Project Priests (Team Roster)
```sql
-- Who's assigned to this project?
SELECT * FROM v_project_priests
WHERE project_id = 'proj-uuid';

-- Columns:
-- priest_name, total_sessions, total_count, last_activity_at
-- assigned_grahas (array of graha names)
```

## User Roles

```sql
-- Check a user's role
SELECT role FROM user_roles WHERE user_id = auth.uid();

-- Promote to priest
UPDATE user_roles SET role='priest' WHERE user_id='...';

-- Promote to main_priest
UPDATE user_roles SET role='main_priest' WHERE user_id='...';

-- Available roles: 'regular_user' | 'priest' | 'main_priest'
```

## Common Queries

### "Show me my dashboard"
```sql
-- Main Priest's projects
SELECT * FROM projects WHERE host_priest_id = auth.uid();

-- Priest's assignments
SELECT * FROM priest_assignments WHERE priest_id = auth.uid();

-- My recent sessions
SELECT * FROM v_project_timeline
WHERE priest_id = auth.uid()
LIMIT 10;
```

### "How complete is this project?"
```sql
SELECT 
  p.name,
  ROUND(SUM(pg.completed_count)::numeric / NULLIF(SUM(pg.target_count), 0) * 100, 2) as overall_pct,
  COUNT(DISTINCT ds.user_id) as priests_count
FROM projects p
LEFT JOIN project_grahas pg ON p.id = pg.project_id
LEFT JOIN delegation_sessions ds ON pg.id = ds.project_graha_id AND ds.session_status='completed'
WHERE p.id = 'proj-uuid'
GROUP BY p.id, p.name;
```

### "Which grahas need attention?"
```sql
SELECT 
  g.name,
  pg.target_count,
  pg.completed_count,
  ROUND((pg.completed_count::numeric / pg.target_count * 100), 2) as pct,
  pg.target_count - pg.completed_count as remaining
FROM project_grahas pg
JOIN grahas g ON pg.graha_id = g.id
WHERE pg.project_id = 'proj-uuid'
ORDER BY pct ASC;
```

### "Show sessions for a specific graha"
```sql
SELECT 
  p.display_name as priest,
  ds.count,
  ds.duration_seconds,
  ds.assignment_type,
  ds.session_status,
  ds.ended_at
FROM delegation_sessions ds
JOIN profiles p ON ds.user_id = p.id
WHERE ds.project_graha_id = 'pg-uuid'
ORDER BY ds.ended_at DESC;
```

### "Track a priest's productivity"
```sql
SELECT 
  DATE(ds.ended_at) as session_date,
  COUNT(*) as sessions,
  SUM(ds.count) as total_count,
  ROUND(AVG(ds.duration_seconds)::numeric / 60, 1) as avg_minutes
FROM delegation_sessions ds
WHERE ds.user_id = 'priest-uuid'
  AND ds.project_id = 'proj-uuid'
GROUP BY DATE(ds.ended_at)
ORDER BY session_date DESC;
```

### "Compare assigned vs volunteer work"
```sql
SELECT 
  ds.assignment_type,
  COUNT(*) as session_count,
  SUM(ds.count) as total_count,
  COUNT(DISTINCT ds.user_id) as unique_priests
FROM delegation_sessions ds
WHERE ds.project_id = 'proj-uuid'
  AND ds.session_status = 'completed'
GROUP BY ds.assignment_type;
```

## RLS Policies Summary

| Table | Own Sessions | Own Assignment | Host Sees | Notes |
|-------|---|---|---|---|
| **projects** | N/A | Can see | Can see all | Host priest owner |
| **project_grahas** | N/A | Can see | Can see + manage | Host priest only |
| **priest_assignments** | Can see | N/A | Can see all | Host assigns |
| **delegation_sessions** | Can see + edit | Can create if assigned | Can see all | Audit trail |
| **user_roles** | Public | Public | Public | Role visibility |

## Trigger Behavior

```sql
-- When you INSERT delegation_sessions with session_status='completed'
-- Trigger auto-runs: project_grahas.completed_count += count

-- When you UPDATE to session_status='completed'
-- Trigger auto-runs: project_grahas.completed_count += count (if wasn't complete)

-- When you UPDATE session_status='active' (revert)
-- Trigger auto-runs: project_grahas.completed_count -= count

-- When you DELETE a completed session
-- Trigger auto-runs: project_grahas.completed_count -= count
-- NOTE: App should prevent this (audit trail)
```

## Key Constraints

- `project_grahas.completed_count` is auto-maintained (don't update directly)
- One project can't have duplicate grahas: `UNIQUE(project_id, graha_id)`
- One priest can't be assigned twice to same project: `UNIQUE(project_id, priest_id)`
- Each user has one role: `UNIQUE(user_id)` in user_roles
- ASSIGNED sessions require priest to be in `priest_assignments`
- VOLUNTEER sessions require no authorization (open)
- Priests can't update completed/abandoned sessions (only active)

## Defaults

| Field | Default |
|-------|---------|
| `projects.status` | 'active' |
| `project_grahas.completed_count` | 0 |
| `priest_assignments.assigned_grahas` | Empty array `[]` |
| `delegation_sessions.session_status` | 'active' |
| `delegation_sessions.assignment_type` | Must specify |
| `user_roles.role` | 'regular_user' (for new users) |

## Indexes (Performance)

Critical for fast queries:
- `delegation_sessions(user_id)` — "My sessions"
- `delegation_sessions(project_id)` — "Project sessions"
- `delegation_sessions(project_graha_id)` — "Graha aggregation"
- `projects(host_priest_id)` — "My projects"
- `priest_assignments(priest_id)` — "My assignments"
- `project_grahas(project_id)` — "Project grahas"

## Common Mistakes to Avoid

1. ❌ Update `project_grahas.completed_count` directly
   - ✅ Insert/update sessions; trigger maintains count

2. ❌ Assign same priest twice to same project
   - ✅ Use `UNIQUE(project_id, priest_id)` constraint

3. ❌ Non-host priest creating projects
   - ✅ RLS enforces host_priest_id = auth.uid()

4. ❌ Non-assigned priest creating ASSIGNED sessions
   - ✅ RLS enforces existence in priest_assignments

5. ❌ Non-priest creating sessions with no auth gate
   - ✅ VOLUNTEER sessions allow anyone; ASSIGNED requires assignment

6. ❌ Querying sessions without filtering by user/project
   - ✅ Use indexes: (user_id), (project_id), (created_at)

7. ❌ Updating completed sessions
   - ✅ Only active sessions allow UPDATE (RLS enforces)

8. ❌ Deleting sessions (breaks audit trail)
   - ✅ Use UPDATE session_status='abandoned' instead

## Testing Checklist

```sql
-- 1. User roles
SELECT * FROM user_roles WHERE user_id = auth.uid();

-- 2. Create project (as main_priest)
INSERT INTO projects (...) RETURNING id;

-- 3. Add grahas
INSERT INTO project_grahas (...) RETURNING id;

-- 4. Assign priest
INSERT INTO priest_assignments (...) RETURNING id;

-- 5. Create session
INSERT INTO delegation_sessions (..., session_status='completed', count=108);
-- Check: project_grahas.completed_count should be 108

-- 6. Check dashboard
SELECT * FROM v_project_status WHERE project_id='...';

-- 7. Verify RLS
-- - Priest can't see other priest's sessions
-- - Host sees all
-- - Non-assigned can't create ASSIGNED sessions
-- - VOLUNTEER can be created by anyone

-- 8. Update session (revert completion)
UPDATE delegation_sessions SET session_status='active' WHERE id='...';
-- Check: completed_count should revert

-- 9. View timeline
SELECT * FROM v_project_timeline WHERE project_id='...';
```

