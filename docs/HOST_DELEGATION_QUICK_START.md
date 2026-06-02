# Host/Delegation System - Quick Start Guide

## Import the API

```javascript
import {
  // Project management
  createProject,
  assignPriests,
  getProjectStatus,
  completeDelegationProject,
  
  // Priest dashboard
  getPriestAssignments,
  getPriestDashboard,
  
  // Session logging
  logDelegationSession,
  
  // Analytics
  getGrahaContributions,
  getPriestContributions,
  getProjectHistory,
  
  // Raw queries
  listProjects,
  getProjectById,
  listDelegationSessions,
} from '@supabase/api/index.js'
```

## 5-Minute Workflow

### 1. Host Creates a Project

```javascript
// Get list of grahas to include
const { data: allGrahas } = await supabase.from('grahas').select('*');

const selectedGrahaIds = [
  allGrahas[0].id,  // e.g., Surya
  allGrahas[3].id,  // e.g., Mangal
];

const { data: project } = await createProject(
  currentUser.id,
  'Client Name',
  'Optional description',
  selectedGrahaIds
);

console.log('Project created:', project.project_id);
// → { project_id: '...', status: 'active', total_target_count: 216000 }
```

### 2. Host Assigns Priests

```javascript
const { data: result } = await assignPriests(
  project.project_id,
  [
    {
      priest_id: 'priest1-uuid',
      priest_name: 'Brahmin Anand',
      assigned_graha_ids: [selectedGrahaIds[0], selectedGrahaIds[1]],
    },
    {
      priest_id: 'priest2-uuid',
      priest_name: 'Swami Hari',
      assigned_graha_ids: [selectedGrahaIds[1]],  // co-chant Mangal
    },
  ]
);

console.log(`Assigned ${result.assigned_count} priest-graha pairs`);
```

### 3. Priest Logs a Session

```javascript
const { data: session } = await logDelegationSession(
  project.project_id,
  currentUser.id,
  selectedGrahaIds[0],  // graha_id
  1008,                 // count (japas)
  1800,                 // duration_secs (30 mins)
  'assigned'            // assignment_type
);

console.log(`Session logged:`, session.session_id);
// Project totals now auto-update via trigger!
```

### 4. Check Progress

```javascript
const { data: status } = await getProjectStatus(project.project_id);

console.log(`Project: ${status.overall_completion_pct}% done`);
console.log(`Total: ${status.total_completed}/${status.total_target}`);

status.graha_breakdown.forEach(graha => {
  console.log(`  ${graha.graha_name}: ${graha.completed}/${graha.target}`);
});
```

### 5. View History

```javascript
const { data: history } = await getProjectHistory(
  project.project_id,
  '2026-05-01',
  '2026-06-01'
);

history.forEach(session => {
  console.log(
    `${session.priest_name} → ${session.graha_name}: ${session.count} on ${session.session_date}`
  );
});
```

## Component Integration Examples

### Project Status Card

```javascript
// src/components/ProjectStatusCard.jsx

import { getProjectStatus } from '@api/index.js';
import { useEffect, useState } from 'react';

export function ProjectStatusCard({ projectId }) {
  const [status, setStatus] = useState(null);

  useEffect(() => {
    getProjectStatus(projectId).then(({ data }) => setStatus(data));
  }, [projectId]);

  if (!status) return <div>Loading...</div>;

  return (
    <div>
      <h2>{status.client_name}</h2>
      <p>Progress: {status.overall_completion_pct}%</p>
      <progress max={status.total_target} value={status.total_completed} />
      
      <div>
        {status.graha_breakdown.map(graha => (
          <div key={graha.graha_id}>
            <strong>{graha.graha_name}</strong>
            <span>{graha.completion_pct}%</span>
            <ul>
              {graha.assigned_priests.map(p => (
                <li key={p.priest_id}>{p.priest_name} ({p.assignment_type})</li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Priest Dashboard

```javascript
// src/components/PriestDashboard.jsx

import { getPriestDashboard, logDelegationSession } from '@api/index.js';
import { useState, useEffect } from 'react';

export function PriestDashboard({ projectId, priestId }) {
  const [assignments, setAssignments] = useState([]);
  const [volunteering, setVolunteering] = useState(false);

  useEffect(() => {
    getPriestDashboard(projectId, priestId).then(({ data }) => {
      setAssignments(data.filter(g => !g.can_volunteer));
      setVolunteering(data.filter(g => g.can_volunteer));
    });
  }, [projectId, priestId]);

  const handleLogSession = async (grahaId) => {
    const count = prompt('How many japas?');
    if (!count) return;

    await logDelegationSession(
      projectId,
      priestId,
      grahaId,
      parseInt(count),
      undefined,
      'assigned'
    );

    // Refetch dashboard
    getPriestDashboard(projectId, priestId).then(({ data }) => {
      setAssignments(data.filter(g => !g.can_volunteer));
    });
  };

  return (
    <div>
      <h3>My Assignments</h3>
      {assignments.map(g => (
        <div key={g.graha_id}>
          <h4>{g.graha_name}</h4>
          <p>{g.completion_pct}% complete</p>
          <button onClick={() => handleLogSession(g.graha_id)}>
            Log Session
          </button>
        </div>
      ))}

      <h3>Available to Volunteer</h3>
      {volunteering.map(g => (
        <div key={g.graha_id}>
          <h4>{g.graha_name}</h4>
          <p>{g.completion_pct}% complete</p>
          <button onClick={() => handleLogSession(g.graha_id)}>
            Volunteer
          </button>
        </div>
      ))}
    </div>
  );
}
```

### Session Logger

```javascript
// src/components/SessionLogger.jsx

import { logDelegationSession } from '@api/index.js';
import { useState } from 'react';

export function SessionLogger({ projectId, priestId, grahaId, onSuccess }) {
  const [count, setCount] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data } = await logDelegationSession(
        projectId,
        priestId,
        grahaId,
        count,
        duration * 60,  // Convert mins to secs
        'assigned'
      );

      onSuccess(data);
      setCount(0);
      setDuration(0);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Japas completed:
        <input
          type="number"
          value={count}
          onChange={e => setCount(parseInt(e.target.value))}
          required
        />
      </label>

      <label>
        Duration (minutes):
        <input
          type="number"
          value={duration}
          onChange={e => setDuration(parseInt(e.target.value))}
        />
      </label>

      <button type="submit" disabled={loading || count === 0}>
        {loading ? 'Logging...' : 'Log Session'}
      </button>
    </form>
  );
}
```

## Error Handling

```javascript
try {
  const { data } = await logDelegationSession(projectId, priestId, grahaId, 1008);
} catch (error) {
  if (error.code === '42501') {
    // Permission denied - not assigned to this graha
    alert('You are not assigned to this graha');
  } else if (error.code === '23503') {
    // Invalid project, priest, or graha
    alert('Invalid project or assignment');
  } else {
    console.error('Unexpected error:', error);
  }
}
```

## Real-time Updates with Subscriptions

```javascript
// Watch for changes to a project
import { supabase } from '@api/index.js';

supabase
  .channel(`project:${projectId}`)
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'delegation_sessions',
      filter: `project_id=eq.${projectId}`,
    },
    (payload) => {
      console.log('New session logged:', payload.new);
      // Refetch project status
      getProjectStatus(projectId);
    }
  )
  .subscribe();
```

## Database Schema Overview

```
projects
├── project_grahas (many)
│   └── graha_id → grahas.id
│
└── priest_assignments (many)
    ├── priest_id → profiles.id
    └── graha_id → grahas.id
        └── delegation_sessions (many)
```

## RPC Reference

| RPC | Purpose | Returns |
|-----|---------|---------|
| `create_project` | Create new project | `project_id, status, total_target_count` |
| `assign_priests` | Assign priests to grahas | `success, assigned_count` |
| `get_project_status` | Project overview + breakdown | Complete status with graha details |
| `get_priest_assignments` | List assigned grahas | `[graha_id, graha_name, target, completed, ...]` |
| `get_priest_dashboard` | Assigned + volunteer grahas | Dashboard with assignment details |
| `log_delegation_session` | Record a session | `session_id, session_date` |
| `get_graha_contributions` | Who's working on graha | `[priest_id, priest_name, completed_count, ...]` |
| `get_priest_contributions` | What priests worked on | `[graha_id, target, completed, ...]` |
| `get_project_history` | Session history with filters | `[session records]` |
| `complete_delegation_project` | Mark project done | `success, completion_timestamp` |

## Best Practices

1. **Always check RLS** - Users can only see projects they host or are assigned to
2. **Use logDelegationSession** - Never insert directly to `delegation_sessions`; the RPC triggers auto-updates
3. **Batch assignments** - Use `assign_priests` once with all assignments, not loop calls
4. **Cache status** - Project status aggregation can be expensive; cache for 30s
5. **Filter history** - Always provide date range to `get_project_history` for performance
6. **Handle errors** - Expect 42501 (permission), 23503 (invalid ID), 23505 (duplicate)

## Deployment Checklist

- [ ] Run migration: `pnpm supabase:migrate`
- [ ] Verify tables exist: `supabase db list`
- [ ] Test RPC: `await getProjectStatus(test_id)`
- [ ] Import in components: `import { createProject, ... } from '@api'`
- [ ] Test end-to-end workflow
- [ ] Set up real-time subscriptions if needed
- [ ] Configure caching strategy

## Debugging

Check RPC status:
```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE '%project%'
ORDER BY routine_name;
```

Check table contents:
```sql
SELECT * FROM projects LIMIT 10;
SELECT * FROM delegation_sessions LIMIT 10;
```

View RLS policies:
```sql
SELECT * FROM pg_policies WHERE tablename IN ('projects', 'priest_assignments');
```
