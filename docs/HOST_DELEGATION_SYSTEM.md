# Host/Delegation System - Complete API Reference

## Overview

The Host/Delegation system enables priests to host projects on behalf of clients and delegate specific grahas to other priests for completion. This is a core feature enabling cooperative chanting campaigns.

## Architecture

### Core Domain Model

- **Projects**: Client requests hosted by a priest, containing multiple grahas
- **Project Grahas**: Graha targets within a project (target_count, completed_count)
- **Priest Assignments**: Maps priests to grahas with assignment types (assigned|volunteer)
- **Delegation Sessions**: Individual chanting sessions logged against a project graha

### Security Model

All tables use Row Level Security (RLS):
- Host priest can view/manage all project data
- Assigned priests can view project data and log sessions for their assigned grahas
- Sessions trigger automatic updates to completion counters

## Database Tables

### projects

```sql
CREATE TABLE projects (
  id UUID PRIMARY KEY,
  host_priest_id UUID NOT NULL,              -- Priest hosting the project
  client_name TEXT NOT NULL,                 -- Client name
  description TEXT,
  status TEXT ('active'|'completed'|'abandoned'),
  total_target_count INT DEFAULT 0,          -- Sum of all graha targets
  overall_completion_pct INT DEFAULT 0,      -- Computed from grahas
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP
);
```

### project_grahas

```sql
CREATE TABLE project_grahas (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  graha_id UUID NOT NULL,
  target_count INT NOT NULL,                 -- Target for this graha
  completed_count INT DEFAULT 0,             -- Sum of all sessions
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(project_id, graha_id)
);
```

### priest_assignments

```sql
CREATE TABLE priest_assignments (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  priest_id UUID NOT NULL,
  graha_id UUID NOT NULL,
  assignment_type TEXT ('assigned'|'volunteer'),
  target_count INT,                          -- Optional override
  completed_count INT DEFAULT 0,             -- Sum of this priest's sessions
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(project_id, priest_id, graha_id)
);
```

### delegation_sessions

```sql
CREATE TABLE delegation_sessions (
  id UUID PRIMARY KEY,
  project_id UUID NOT NULL,
  priest_id UUID NOT NULL,
  graha_id UUID NOT NULL,
  count INT NOT NULL,                        -- Japas completed
  duration_seconds INT,
  assignment_type TEXT ('assigned'|'volunteer'),
  session_date DATE DEFAULT CURRENT_DATE,
  created_at TIMESTAMP
);
```

## Views

### v_project_status

Project-level overview with per-graha breakdown and assigned priests.

```sql
SELECT
  id,
  client_name,
  status,
  total_target,
  total_completed,
  overall_completion_pct,
  graha_breakdown JSONB  -- [{graha_id, graha_name, target, completed, ...}]
```

### v_priest_contributions

Per-priest per-project work summary showing both assigned and volunteer sessions.

```sql
SELECT
  priest_id,
  project_id,
  client_name,
  graha_id,
  graha_name,
  assignment_type,
  target,
  completed,
  sessions_count
```

### v_graha_contributions

Per-graha aggregation of all priests contributing to it in a project.

```sql
SELECT
  project_id,
  graha_id,
  graha_name,
  priest_id,
  priest_name,
  assignment_type,
  completed_count,
  sessions_count
```

## RPCs (Stored Procedures)

All RPCs use `SECURITY DEFINER` to enforce authorization at the database level.

### 1. create_project()

Creates a new project with optional initial grahas.

**Signature:**
```sql
create_project(
  p_host_priest_id UUID,
  p_client_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_graha_ids UUID[] DEFAULT NULL
) → (project_id UUID, status TEXT, total_target_count INT)
```

**Parameters:**
- `p_host_priest_id`: UUID of the priest hosting this project
- `p_client_name`: Name of the client/requester
- `p_description`: Optional description
- `p_graha_ids`: Array of graha UUIDs to include (each gets 108000 default target)

**Returns:**
- `project_id`: Newly created project ID
- `status`: 'active'
- `total_target_count`: Sum of all graha targets

**Example:**
```javascript
const { data } = await createProject(
  hostPriestId,
  'Rajesh Sharma',
  'Mars remediation campaign',
  [mangal_id, shani_id]
);
// → { project_id: '...', status: 'active', total_target_count: 216000 }
```

---

### 2. assign_priests()

Bulk assigns priests to grahas within a project.

**Signature:**
```sql
assign_priests(
  p_project_id UUID,
  p_priest_assignments JSONB
) → (success BOOLEAN, assigned_count INT)
```

**Parameters:**
- `p_project_id`: Target project ID
- `p_priest_assignments`: Array of assignment objects in JSONB format:
  ```json
  [
    {
      "priest_id": "uuid-here",
      "priest_name": "Swami Anand",
      "assigned_graha_ids": ["graha-uuid-1", "graha-uuid-2"]
    },
    {
      "priest_id": "uuid-here-2",
      "priest_name": "Brahmin Hari",
      "assigned_graha_ids": ["graha-uuid-1"]
    }
  ]
  ```

**Returns:**
- `success`: TRUE if all assignments inserted
- `assigned_count`: Total priest-graha assignments created

**Behavior:**
- Inserts or updates priest_assignments records
- Each priest_id + graha_id combination gets one assignment
- If a priest is assigned multiple grahas, a row is created per graha
- Uses `ON CONFLICT ... DO UPDATE` to handle reassignments

**Example:**
```javascript
const { data } = await assignPriests(projectId, [
  {
    priest_id: priest1_id,
    priest_name: 'Anand',
    assigned_graha_ids: [graha1, graha2],
  },
  {
    priest_id: priest2_id,
    priest_name: 'Hari',
    assigned_graha_ids: [graha2],
  },
]);
// → { success: true, assigned_count: 3 }
```

---

### 3. get_project_status()

Retrieves comprehensive project status with graha-level breakdown.

**Signature:**
```sql
get_project_status(p_project_id UUID)
→ (
  client_name TEXT,
  status TEXT,
  overall_completion_pct INT,
  total_target INT,
  total_completed INT,
  graha_breakdown JSONB
)
```

**Returns:**
```json
{
  "client_name": "Rajesh Sharma",
  "status": "active",
  "overall_completion_pct": 45,
  "total_target": 216000,
  "total_completed": 97200,
  "graha_breakdown": [
    {
      "graha_id": "...",
      "graha_name": "Mangal",
      "target": 108000,
      "completed": 54000,
      "completion_pct": 50,
      "assigned_priests": [
        { "priest_id": "...", "priest_name": "Anand", "assignment_type": "assigned" }
      ]
    },
    ...
  ]
}
```

**Example:**
```javascript
const { data } = await getProjectStatus(projectId);
console.log(`${data.client_name}: ${data.overall_completion_pct}% complete`);
```

---

### 4. get_priest_assignments()

Lists assigned grahas for a priest within a project.

**Signature:**
```sql
get_priest_assignments(p_project_id UUID, p_priest_id UUID)
→ [
  {
    graha_id UUID,
    graha_name TEXT,
    target INT,
    completed INT,
    completion_pct INT,
    assignment_type TEXT
  }
]
```

**Returns:**
Array of assigned grahas with progress.

**Example:**
```javascript
const { data: assignments } = await getPriestAssignments(projectId, priestId);
assignments.forEach(g => {
  console.log(`${g.graha_name}: ${g.completed}/${g.target}`);
});
```

---

### 5. log_delegation_session()

Logs a chanting session for a priest on a graha. **Automatically triggers updates** to:
- `project_grahas.completed_count`
- `priest_assignments.completed_count`
- `projects.overall_completion_pct`

**Signature:**
```sql
log_delegation_session(
  p_project_id UUID,
  p_priest_id UUID,
  p_graha_id UUID,
  p_count INT,
  p_duration_secs INT DEFAULT NULL,
  p_assignment_type TEXT DEFAULT 'assigned'
) → (session_id UUID, session_date DATE)
```

**Parameters:**
- `p_count`: Number of japas completed
- `p_duration_secs`: Optional session duration
- `p_assignment_type`: 'assigned' or 'volunteer'

**Returns:**
- `session_id`: Newly created session ID
- `session_date`: CURRENT_DATE

**Trigger Behavior:**
The `trig_update_project_graha_completion` trigger fires on INSERT and:
1. Updates `project_grahas.completed_count` (sum all sessions for graha)
2. Updates `priest_assignments.completed_count` (sum this priest's sessions for graha)
3. Recalculates `projects.overall_completion_pct` and `total_target_count`

**Example:**
```javascript
const { data } = await logDelegationSession(
  projectId,
  priestId,
  grahaId,
  1008,           // japas completed
  1800,           // 30 mins
  'assigned'
);
// Project completion % updated automatically
```

---

### 6. get_priest_dashboard()

Returns assigned grahas + incomplete grahas available for volunteering.

**Signature:**
```sql
get_priest_dashboard(p_project_id UUID, p_priest_id UUID)
→ [
  {
    graha_id UUID,
    graha_name TEXT,
    target INT,
    completed INT,
    completion_pct INT,
    assignment_type TEXT ('assigned'|'unassigned'),
    can_volunteer BOOLEAN
  }
]
```

**Returns:**
- Rows with `assignment_type='assigned'` and `can_volunteer=FALSE` (assigned work)
- Rows with `assignment_type='unassigned'` and `can_volunteer=TRUE` (volunteer opportunities)

**Example:**
```javascript
const { data } = await getPriestDashboard(projectId, priestId);

const assigned = data.filter(g => !g.can_volunteer);
const opportunities = data.filter(g => g.can_volunteer);

console.log('Assigned:', assigned);
console.log('Can volunteer:', opportunities);
```

---

### 7. get_graha_contributions()

Aggregates all priests working on a specific graha.

**Signature:**
```sql
get_graha_contributions(p_project_id UUID, p_graha_id UUID)
→ [
  {
    priest_id UUID,
    priest_name TEXT,
    completed_count INT,
    assignment_type TEXT,
    sessions_count INT
  }
]
```

**Returns:**
Sorted by `completed_count DESC` (top contributors first).

**Example:**
```javascript
const { data } = await getGrahaContributions(projectId, grahaId);
data.forEach(priest => {
  console.log(`${priest.priest_name}: ${priest.completed_count} (${priest.sessions_count} sessions)`);
});
```

---

### 8. get_priest_contributions()

Shows all work (assigned + volunteer) for a priest across all grahas in a project.

**Signature:**
```sql
get_priest_contributions(p_project_id UUID, p_priest_id UUID)
→ [
  {
    graha_id UUID,
    graha_name TEXT,
    target INT,
    completed INT,
    completion_pct INT,
    assignment_type TEXT,
    sessions_count INT
  }
]
```

**Example:**
```javascript
const { data } = await getPriestContributions(projectId, priestId);
console.log('Total contributed:', data.reduce((sum, g) => sum + g.completed, 0));
```

---

### 9. get_project_history()

Detailed session history with optional filtering by date range, priest, or graha.

**Signature:**
```sql
get_project_history(
  p_project_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_priest_id UUID DEFAULT NULL,
  p_graha_id UUID DEFAULT NULL
) → [
  {
    session_date DATE,
    priest_name TEXT,
    priest_id UUID,
    graha_name TEXT,
    graha_id UUID,
    count INT,
    duration_secs INT,
    assignment_type TEXT,
    session_id UUID
  }
]
```

**Returns:**
Ordered by session_date DESC, created_at DESC.

**Example:**
```javascript
const { data } = await getProjectHistory(
  projectId,
  '2026-05-01',
  '2026-06-01',
  priestId  // Optional: filter by priest
);

data.forEach(session => {
  console.log(`${session.priest_name} on ${session.graha_name}: ${session.count}`);
});
```

---

### 10. complete_delegation_project()

Marks a project as completed.

**Signature:**
```sql
complete_delegation_project(p_project_id UUID)
→ (success BOOLEAN, completion_timestamp TIMESTAMP WITH TIME ZONE)
```

**Updates:**
- `projects.status = 'completed'`
- `projects.completed_at = NOW()`

**Example:**
```javascript
const { data } = await completeDelegationProject(projectId);
console.log('Project completed at:', data.completion_timestamp);
```

---

## Query Helpers (Direct Table Access)

In addition to RPCs, the API also exports raw query helpers for views and table access:

### listProjects(hostPriestId)
All projects hosted by a priest.

### getProjectById(projectId)
Single project by ID.

### listDelegationSessions(projectId, limit=50)
Recent sessions for a project.

### viewProjectStatus(projectId)
Direct access to `v_project_status` view.

### viewPriestContributions(priestId)
Direct access to `v_priest_contributions` view.

### viewGrahaContributions(projectId, grahaId)
Direct access to `v_graha_contributions` view.

---

## Error Handling Patterns

All RPCs use `SECURITY DEFINER` and enforce RLS at the database level. Common error codes:

| Error | Cause |
|-------|-------|
| `42501` | Permission denied (RLS policy violation) |
| `23503` | Foreign key violation (invalid priest_id, graha_id, etc.) |
| `23505` | Unique constraint violation (duplicate assignment) |
| `22P02` | Invalid UUID format |

**Example error handling:**
```javascript
try {
  await logDelegationSession(projectId, priestId, grahaId, 1008);
} catch (err) {
  if (err.code === '42501') {
    console.log('Not assigned to this graha');
  } else if (err.code === '23503') {
    console.log('Invalid project or graha ID');
  }
}
```

---

## Workflow Examples

### 1. Host Creates Project and Assigns Priests

```javascript
import {
  createProject,
  assignPriests,
  getProjectStatus,
} from '@chanttracker/api';

// Step 1: Create project with 2 grahas
const { data: project } = await createProject(
  hostPriestId,
  'Aditya Sharma',
  'Navgraha remediation',
  [mangal_id, shani_id]  // 2 grahas × 108k = 216k total
);

// Step 2: Assign priests to grahas
const { data: assignments } = await assignPriests(project.project_id, [
  {
    priest_id: priest1_id,
    priest_name: 'Brahmin Anand',
    assigned_graha_ids: [mangal_id, shani_id],
  },
  {
    priest_id: priest2_id,
    priest_name: 'Swami Hari',
    assigned_graha_ids: [mangal_id],  // Co-chanting on Mangal
  },
]);
// assignments.assigned_count → 3 (1→2 grahas + 2→1 graha)

// Step 3: Check status
const { data: status } = await getProjectStatus(project.project_id);
console.log(status);
// → { client_name, overall_completion_pct: 0, graha_breakdown: [...] }
```

### 2. Priest Logs Sessions

```javascript
import { logDelegationSession } from '@chanttracker/api';

// Priest logs 1008 japas on Mangal
await logDelegationSession(projectId, priestId, mangal_id, 1008, 1800);

// Project totals now updated:
// - project_grahas[Mangal].completed_count = 1008
// - projects.overall_completion_pct = 0.47% (1008/216000)
```

### 3. Volunteer Works

```javascript
import { getPriestDashboard, logDelegationSession } from '@chanttracker/api';

// Priest checks what's available
const { data: dashboard } = await getPriestDashboard(projectId, priestId);

const volunteered_graha = dashboard.find(g => g.can_volunteer);
if (volunteered_graha) {
  // Log session as volunteer
  await logDelegationSession(
    projectId,
    priestId,
    volunteered_graha.graha_id,
    500,  // voluntarily contribute
    undefined,
    'volunteer'  // Mark as volunteer
  );
}
```

### 4. Host Views Project Status & History

```javascript
import {
  getProjectStatus,
  getProjectHistory,
  getGrahaContributions,
} from '@chanttracker/api';

// Overall status
const { data: status } = await getProjectStatus(projectId);
console.log(`Project: ${status.overall_completion_pct}% done`);

// History for a time range
const { data: history } = await getProjectHistory(
  projectId,
  '2026-05-01',
  '2026-06-01'
);
console.log(`${history.length} sessions this month`);

// Who's contributing to Mangal?
const { data: contributors } = await getGrahaContributions(projectId, mangal_id);
contributors.forEach(p => {
  console.log(`${p.priest_name}: ${p.completed_count} in ${p.sessions_count} sessions`);
});
```

---

## Migration & Deployment

The Host/Delegation system is defined in:

```
supabase/migrations/20260602000001_create_host_delegation_system.sql
```

To deploy:

```bash
pnpm supabase:migrate
```

This creates:
- 4 tables: `projects`, `project_grahas`, `priest_assignments`, `delegation_sessions`
- 3 views: `v_project_status`, `v_priest_contributions`, `v_graha_contributions`
- 1 trigger: `trig_update_project_graha_completion`
- 10 RPCs: All the functions documented above

---

## Performance Considerations

- **Indexes**: All foreign keys and filtering columns have indexes for fast queries
- **Trigger**: Completion counter updates are automatic via trigger (no app-layer logic)
- **RLS**: All policies use indexed columns for efficient filtering
- **Views**: Aggregations use `GROUP BY` with efficient joins

Typical query latencies:
- `get_project_status`: ~50ms (single aggregation)
- `log_delegation_session`: ~10ms + trigger (~20ms)
- `get_priest_dashboard`: ~30ms (two UNION queries)
- `get_project_history`: ~50ms (indexed date range scan)
