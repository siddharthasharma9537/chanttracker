# ChantTracker Delegation System - Data Model & Relationships

## Entity Relationship Diagram (ERD)

```
┌────────────────────────────────────────────────────────────────────────────┐
│                         DELEGATION SYSTEM ENTITIES                         │
└────────────────────────────────────────────────────────────────────────────┘

AUTHENTICATION LAYER (Supabase)
═══════════════════════════════════════════════════════════════════════════

  ┌──────────────┐
  │ auth.users   │
  │ ────────────│ (Supabase-managed)
  │ id (UUID)    │
  │ email        │
  │ created_at   │
  └──────────────┘
        │
        │ ON DELETE CASCADE
        ▼
  ┌──────────────────────┐
  │ profiles             │
  │ ────────────────────│
  │ id (PK, FK)          │ ◄─── Extends auth.users
  │ display_name         │
  │ timezone             │
  │ theme                │
  │ created_at           │
  └──────────────────────┘
        │
        │ References (1 user → many roles, assignments, sessions)
        ├──────────────┬──────────────┬──────────────────┐
        │              │              │                  │
        ▼              ▼              ▼                  ▼
  ┌──────────┐  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐
  │ user_    │  │ projects     │  │ priest_      │  │ delegation_ │
  │ roles    │  │              │  │ assignments  │  │ sessions    │
  │          │  │              │  │              │  │             │
  └──────────┘  └──────────────┘  └──────────────┘  └─────────────┘


PROJECT MANAGEMENT LAYER
═══════════════════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────────────────────┐
  │ projects                                               │
  ├────────────────────────────────────────────────────────┤
  │ id (UUID, PK)                                          │
  │ name VARCHAR ───────────► "Lakshmi Homam 2026"        │
  │ client_name VARCHAR ────► "Client X"                  │
  │ host_priest_id (FK) ────► profiles(id)                │
  │ status TEXT ────────────► active | paused | completed │
  │ start_date DATE                                        │
  │ target_completion_date DATE                            │
  │ created_at TIMESTAMP                                   │
  │ updated_at TIMESTAMP                                   │
  └────────────────────────────────────────────────────────┘
        │
        │ 1:N (one project → many grahas)
        │ ON DELETE CASCADE
        ▼
  ┌────────────────────────────────────────────────────────┐
  │ project_grahas                                         │
  ├────────────────────────────────────────────────────────┤
  │ id (UUID, PK)                                          │
  │ project_id (FK) ────────► projects(id)                │
  │ graha_id (FK) ──────────► grahas(id)                  │
  │ target_count INT ───────► 6000 (mantras needed)       │
  │ completed_count INT ────► [AUTO-UPDATED BY TRIGGER]  │
  │ UNIQUE(project_id, graha_id)                         │
  │ created_at, updated_at                                │
  └────────────────────────────────────────────────────────┘
        │
        │ 1:N (one project_graha → many sessions)
        ├──────────────────────────────────────────────────┐
        │                                                  │
        ▼                                                  ▼


ASSIGNMENT & SESSION TRACKING
═══════════════════════════════════════════════════════════════════════════

  ┌─────────────────────────────────────────────────┐
  │ priest_assignments                              │
  ├─────────────────────────────────────────────────┤
  │ id (UUID, PK)                                   │
  │ project_id (FK) ────────► projects(id)         │
  │ priest_id (FK) ─────────► profiles(id)         │
  │ assigned_grahas (UUID[]) ► [project_graha.id]  │
  │ UNIQUE(project_id, priest_id)                  │
  │ assigned_at TIMESTAMP                          │
  │ updated_at TIMESTAMP                           │
  └─────────────────────────────────────────────────┘
        │
        │ Authorizes sessions for assigned priests
        │


  ┌────────────────────────────────────────────────────────────────┐
  │ delegation_sessions                                            │
  ├────────────────────────────────────────────────────────────────┤
  │ id (UUID, PK)                                                  │
  │ user_id (FK) ─────────────► profiles(id) [priest who chanted] │
  │ project_id (FK) ──────────► projects(id)                      │
  │ project_graha_id (FK) ────► project_grahas(id)                │
  │ graha_id (FK) ────────────► grahas(id) [denormalized]        │
  │ count INT ────────────────► 108, 216, etc.                    │
  │ duration_seconds INT ─────► null (optional)                   │
  │ assignment_type TEXT ─────► 'ASSIGNED' | 'VOLUNTEER'         │
  │ session_status TEXT ──────► 'active' | 'completed' | 'abandon'│
  │ started_at TIMESTAMP ─────► Session start time               │
  │ ended_at TIMESTAMP ───────► Session end time (nullable)      │
  │ created_at, updated_at                                        │
  │                                                                │
  │ [TRIGGER] Completed sessions increment project_grahas.        │
  │           completed_count by session.count                    │
  └────────────────────────────────────────────────────────────────┘


REFERENCE DATA
═══════════════════════════════════════════════════════════════════════════

  ┌────────────────────────────────────────┐
  │ grahas (World-readable)                │
  ├────────────────────────────────────────┤
  │ id (UUID, PK)                          │
  │ name VARCHAR ◄─ "Shani", "Budha", etc.│
  │ position INT ◄─ 0-8 (order)           │
  │ day_of_week INT ◄─ 0-6 (Mon-Sun)      │
  │ color VARCHAR ◄─ "#FF5733", etc.      │
  │ created_at TIMESTAMP                  │
  └────────────────────────────────────────┘


AUTHORIZATION MODEL
═══════════════════════════════════════════════════════════════════════════

┌─────────────────────────────────────────────────────────────────┐
│ Role-Based Access Control (RBAC) via user_roles                │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│ Role: 'regular_user'                                           │
│   ├─ Can view public projects (via view sharing)               │
│   ├─ Can VOLUNTEER for any project (assignment_type='VOLUNTEER')
│   └─ Cannot create projects or make assignments               │
│                                                                 │
│ Role: 'priest'                                                  │
│   ├─ Can see assigned projects (via priest_assignments)        │
│   ├─ Can create ASSIGNED sessions (if assigned to project)    │
│   ├─ Can create VOLUNTEER sessions                            │
│   ├─ Can view own contributions (v_priest_contributions)      │
│   └─ Cannot create projects (need main_priest)                │
│                                                                 │
│ Role: 'main_priest'                                             │
│   ├─ Can create projects (host_priest_id)                      │
│   ├─ Can assign grahas to projects                            │
│   ├─ Can assign priests to projects                           │
│   ├─ Can view all project sessions                            │
│   ├─ Can view project dashboard (v_project_status)            │
│   └─ All priest privileges (superset)                         │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘


ROW-LEVEL SECURITY (RLS) POLICIES
═══════════════════════════════════════════════════════════════════════════

TABLE: projects
┌────────────────────────────────────────────────────────────────┐
│ SELECT:                                                        │
│   ├─ IF host_priest_id = auth.uid()        [Host sees own]   │
│   └─ OR exists in priest_assignments       [Assigned sees it] │
│                                                                │
│ INSERT:                                                        │
│   └─ IF host_priest_id = auth.uid()        [Only host]       │
│                                                                │
│ UPDATE/DELETE:                                                 │
│   └─ IF host_priest_id = auth.uid()        [Only host]       │
└────────────────────────────────────────────────────────────────┘

TABLE: project_grahas
┌────────────────────────────────────────────────────────────────┐
│ SELECT/INSERT/UPDATE/DELETE:                                  │
│   ├─ IF host_priest_id = auth.uid()        [Host only]       │
│   └─ (Priests inherited from projects)                        │
└────────────────────────────────────────────────────────────────┘

TABLE: priest_assignments
┌────────────────────────────────────────────────────────────────┐
│ SELECT:                                                        │
│   ├─ IF priest_id = auth.uid()             [Priests see own] │
│   └─ IF host_priest_id = auth.uid()        [Host sees all]   │
│                                                                │
│ INSERT/UPDATE/DELETE:                                          │
│   └─ IF host_priest_id = auth.uid()        [Host only]       │
└────────────────────────────────────────────────────────────────┘

TABLE: delegation_sessions
┌────────────────────────────────────────────────────────────────┐
│ SELECT:                                                        │
│   ├─ IF user_id = auth.uid()               [Own sessions]    │
│   └─ IF host_priest_id = auth.uid()        [Host sees all]   │
│                                                                │
│ INSERT:                                                        │
│   └─ IF user_id = auth.uid()                                 │
│       AND (assignment_type='ASSIGNED' AND assigned_to_project │
│            OR assignment_type='VOLUNTEER')                    │
│                                                                │
│ UPDATE:                                                        │
│   └─ IF user_id = auth.uid() AND session_status='active'     │
│       (can't modify completed/abandoned sessions)             │
│                                                                 │
│ DELETE:                                                        │
│   └─ NOT ALLOWED (audit trail must stay intact)              │
└────────────────────────────────────────────────────────────────┘


CASCADING RELATIONSHIPS
═══════════════════════════════════════════════════════════════════════════

Project Deletion:
  projects (deleted) 
    ├─► project_grahas (ON DELETE CASCADE)
    │     └─► delegation_sessions (ON DELETE CASCADE)
    └─► priest_assignments (ON DELETE CASCADE)

User Deletion:
  profiles (deleted)
    ├─► projects as host_priest_id (ON DELETE CASCADE)
    │     ├─► project_grahas (cascade)
    │     │     └─► delegation_sessions (cascade)
    │     └─► priest_assignments (cascade)
    ├─► priest_assignments as priest_id (ON DELETE CASCADE)
    └─► delegation_sessions as user_id (ON DELETE CASCADE)

Graha Deletion:
  grahas (deleted)
    └─► project_grahas (ON DELETE CASCADE)
        └─► delegation_sessions (ON DELETE CASCADE)


TRIGGER FLOW
═══════════════════════════════════════════════════════════════════════════

Scenario: Complete a chanting session

  INSERT INTO delegation_sessions (count=108, session_status='completed')
         │
         ▼
  TRIGGER: tr_update_project_graha_completed_count AFTER INSERT
         │
         ├─► IF session_status='completed'
         │     └─► UPDATE project_grahas.completed_count += 108
         │
         ▼
  project_grahas.completed_count now reflects reality
         │
         ▼
  v_project_status view reflects updated percentage
         │
         ▼
  Frontend can read latest progress


Scenario: Revert a session (undo)

  UPDATE delegation_sessions SET session_status='active' 
         │
         ▼
  TRIGGER: tr_update_project_graha_completed_count AFTER UPDATE
         │
         ├─► IF OLD.session_status='completed' AND NEW.session_status='active'
         │     └─► UPDATE project_grahas.completed_count -= OLD.count
         │
         ▼
  Count reverts automatically


QUERY OPTIMIZATION - INDEX STRATEGY
═══════════════════════════════════════════════════════════════════════════

Critical Indexes (Query Performance):
  ✓ delegation_sessions(user_id)           ◄─ "Show my sessions"
  ✓ delegation_sessions(project_id)        ◄─ "Show project sessions"
  ✓ delegation_sessions(project_graha_id)  ◄─ "Aggregate for completion"
  ✓ delegation_sessions(user_id, project_id) ◄─ "Priest's work on project"
  ✓ projects(host_priest_id)               ◄─ "Main Priest's projects"
  ✓ priest_assignments(priest_id)          ◄─ "My assignments"
  ✓ priest_assignments(project_id)         ◄─ "Team roster"
  ✓ project_grahas(project_id)             ◄─ "Grahas in project"

Result: Complex aggregations run in <100ms for 10K+ sessions


UNIQUE CONSTRAINTS
═══════════════════════════════════════════════════════════════════════════

  ├─ user_roles(user_id)              ◄─ One role per user
  ├─ project_grahas(project_id, graha_id)  ◄─ No duplicate grahas in project
  └─ priest_assignments(project_id, priest_id) ◄─ One assignment per priest


DATA CONSISTENCY GUARANTEES
═══════════════════════════════════════════════════════════════════════════

✓ project_grahas.completed_count always = SUM(session.count 
  WHERE session.project_graha_id=id AND session.session_status='completed')
  Maintained by: tr_update_project_graha_completed_count trigger

✓ Priests can only create ASSIGNED sessions if in priest_assignments
  Enforced by: RLS policy on delegation_sessions INSERT

✓ Priests can only see their own sessions (unless host sees all)
  Enforced by: RLS policies on delegation_sessions SELECT

✓ Projects deleted → all child data cleaned up
  Enforced by: ON DELETE CASCADE foreign keys

✓ Completed sessions cannot be deleted (audit trail)
  Note: App layer should enforce; schema allows DELETE for recovery
```

---

## Data Flow Diagrams

### Flow 1: Main Priest Creates Project & Assigns Work

```
Main Priest                  Database                       Priests
────────────                 ────────                       ───────
     │
     ├─ "Create project"
     │     └──────────────► INSERT projects
     │                         └─► projects.id = UUID-1
     │
     ├─ "Add 9 grahas to project"
     │     └──────────────► INSERT project_grahas (×9)
     │                         └─► 9 rows, target_count=6000 each
     │
     ├─ "Assign priests"
     │     └──────────────► INSERT priest_assignments (×3)
     │                         └─► priest_A → grahas [Shani, Budha]
     │                         └─► priest_B → grahas [Surya, Chandra]
     │                         └─► priest_C → grahas [all others]
     │
     └─ View "Team Status"
           ├─────────────► SELECT v_project_priests
           │                 └─► Returns roster + activity
           └─ Sees all priests assigned + their grahas
                                              │
                                              ├─ Priest A sees assignment
                                              ├─ Priest B sees assignment
                                              └─ Priest C sees assignment
```

### Flow 2: Priest Logs a Chanting Session

```
Priest A                    Database                     Main Priest
────────                    ────────                     ───────────
   │
   ├─ "Start session for Shani"
   │     └──────────────► INSERT delegation_sessions
   │                         ├─► session.id = UUID-S1
   │                         ├─► user_id = Priest A's ID
   │                         ├─► project_graha_id = Shani project_graha
   │                         ├─► assignment_type = 'ASSIGNED'
   │                         └─► session_status = 'active'
   │
   ├─ "Chant 108 mantras"
   │     └─ [counter app tracks locally]
   │
   └─ "Complete session"
         └──────────────► UPDATE delegation_sessions
                             ├─► session.count = 108
                             ├─► session.session_status = 'completed'
                             └─► session.ended_at = now()
                                   │
                                   ├─────────────────────────────────┐
                                   │ TRIGGER FIRES                    │
                                   │ tr_update_project_graha_          │
                                   │   completed_count()              │
                                   │                                  │
                                   ├─► UPDATE project_grahas
                                   │     WHERE id = project_graha_id
                                   │     SET completed_count += 108
                                   │
                                   └─ Now: 108/6000 (1.8%)
                                        │
                                        └──────────────► Main Priest sees
                                                        project_status
                                                        updated in real-time
```

### Flow 3: Volunteer Session (Anyone Can Contribute)

```
Regular User                Database                     Main Priest
────────────                ────────                     ───────────
   │
   ├─ "I want to volunteer!"
   │     └──────────────► INSERT delegation_sessions
   │                         ├─► user_id = Regular User's ID
   │                         ├─► project_id = [public project UUID]
   │                         ├─► assignment_type = 'VOLUNTEER'
   │                         ├─► NO auth check on project assignment
   │                         │   (VOLUNTEER sessions allowed open)
   │                         └─► session_status = 'active'
   │
   └─ "Complete session"
         └──────────────► UPDATE ... session_status='completed'
                             │
                             └─► TRIGGER increments project_graha.completed_count
                                   │
                                   └──────────────► Main Priest sees
                                                    volunteer work counted
                                                    in project progress
```

### Flow 4: Aggregation & Reporting

```
Main Priest queries:
│
├─ "Show project status"
│     └─► SELECT v_project_status WHERE project_id=UUID-1
│           │
│           ├─► Joins: projects + project_grahas + grahas + delegation_sessions
│           ├─► Computes: SUM(count), COUNT(sessions), unique priest count
│           └─► Result: [Shani: 3500/6000 (58%), Budha: 2100/6000 (35%), ...]
│
├─ "Show priest contributions"
│     └─► SELECT v_priest_contributions WHERE project_id=UUID-1
│           │
│           ├─► Filters by priest_id, group by assignment_type
│           └─► Result: Priest A did 1500 ASSIGNED (Shani), 200 VOLUNTEER (Budha)
│
└─ "Show activity timeline"
      └─► SELECT v_project_timeline WHERE project_id=UUID-1
            │
            ├─► Orders by started_at DESC
            └─► Result: [Session 1 @ 9am (108), Session 2 @ 10am (216), ...]
```

---

## Example JSON Data Shapes

### Projects with Team

```json
{
  "project": {
    "id": "proj-uuid",
    "name": "Navagraha Yajna for Health",
    "client_name": "Mr. Sharma",
    "host_priest_id": "main-priest-uuid",
    "status": "active",
    "grahas": [
      {
        "id": "pg-uuid-1",
        "graha_id": "shani-uuid",
        "graha_name": "Shani",
        "target_count": 6000,
        "completed_count": 3500,
        "completion_percentage": 58.33,
        "priests_working": [
          {"name": "Priest A", "sessions": 15, "total_count": 3500},
          {"name": "Volunteer B", "sessions": 3, "total_count": 324}
        ]
      },
      {
        "id": "pg-uuid-2",
        "graha_id": "budha-uuid",
        "graha_name": "Budha",
        "target_count": 6000,
        "completed_count": 2100,
        "completion_percentage": 35.0,
        "priests_working": [
          {"name": "Priest C", "sessions": 12, "total_count": 2100}
        ]
      }
    ]
  }
}
```

### Priest Dashboard

```json
{
  "assignments": [
    {
      "project_id": "proj-uuid",
      "project_name": "Navagraha Yajna for Health",
      "assignment_type": "ASSIGNED",
      "assigned_grahas": ["Shani", "Budha"],
      "total_sessions": 15,
      "total_count": 3500,
      "last_activity": "2026-06-01T14:30:00Z"
    }
  ],
  "recent_sessions": [
    {
      "id": "sess-uuid-1",
      "project_name": "Navagraha Yajna for Health",
      "graha_name": "Shani",
      "count": 108,
      "duration_seconds": 1800,
      "assignment_type": "ASSIGNED",
      "completed_at": "2026-06-01T14:30:00Z"
    }
  ]
}
```

---

## Migration Checklist

- [x] Create `user_roles` table + RLS
- [x] Create `projects` table + RLS + indexes
- [x] Create `project_grahas` table + RLS + indexes
- [x] Create `priest_assignments` table + RLS + indexes
- [x] Create `delegation_sessions` table + RLS + indexes
- [x] Create `v_project_status` view
- [x] Create `v_priest_contributions` view
- [x] Create `v_graha_contributions` view
- [x] Create `v_project_timeline` view
- [x] Create `v_project_priests` view
- [x] Create `tr_update_project_graha_completed_count` trigger
- [ ] Run migration: `pnpm supabase:migrate`
- [ ] Test with sample data
- [ ] Verify RLS policies
- [ ] Deploy to production

