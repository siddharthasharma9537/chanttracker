# Priest Dashboard Integration Guide

## Overview

The Priest Dashboard is a complete delegation system interface for priests to manage their assigned work and volunteer on additional grahas within a delegation project. This document provides integration guidance and usage examples.

## File Structure

### New Files Created

```
apps/web/src/
├── components/
│   ├── delegation/
│   │   ├── PriestDashboard.tsx                 (Main component)
│   │   ├── AssignedGrahasSection.tsx           (Assigned work section)
│   │   ├── VolunteerOpportunitiesSection.tsx   (Volunteer opportunities)
│   │   ├── PRIEST_DASHBOARD.md                 (Component documentation)
│   │   └── index.ts                            (Updated with exports)
│   └── chant/
│       └── SessionCounter.tsx                  (Delegation session counter)
├── hooks/
│   └── useDelegation.ts                        (Updated with new hooks)
├── app/
│   └── delegation/
│       └── projects/
│           └── [id]/
│               └── priest/
│                   └── page.tsx                (Priest dashboard route)
└── types/
    └── delegation.ts                           (Types - no changes needed)

docs/
└── PRIEST_DASHBOARD_INTEGRATION.md             (This file)
```

## Component Architecture

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│              PriestDashboard                        │
│  (Main orchestrator, renders sections & counter)    │
└──────────────────┬──────────────────────────────────┘
                   │
        ┌──────────┴──────────┐
        │                     │
   ┌────▼─────────┐   ┌──────▼──────────────┐
   │Data Fetching │   │Session Management   │
   ├──────────────┤   ├─────────────────────┤
   │ usePriest    │   │ useLogDelegation    │
   │  Dashboard   │   │ Session mutation    │
   ├──────────────┤   ├─────────────────────┤
   │ useDelegation│   │ SessionCounter      │
   │ Project      │   │ Component           │
   └──────────────┘   └─────────────────────┘
        │                     │
        ├─────────────────────┤
        │                     │
   ┌────▼──────────────┐ ┌───▼──────────────────┐
   │AssignedGrahas     │ │VolunteerOpportunities│
   │Section            │ │Section               │
   └───────────────────┘ └──────────────────────┘
```

### Component Responsibilities

**PriestDashboard**
- Manages overall dashboard state
- Fetches priest assignments and project data
- Handles session lifecycle (start → complete)
- Renders sections based on data
- Shows loading/error states

**AssignedGrahasSection**
- Displays assigned work
- Shows progress for each graha
- Provides "START SESSION" buttons
- Calculates totals for assigned work

**VolunteerOpportunitiesSection**
- Shows incomplete grahas available for volunteering
- Displays remaining counts needed
- Provides "VOLUNTEER" buttons
- Filters out already-assigned grahas

**SessionCounter**
- Full-screen counter interface
- Tap-to-increment bead
- Timer with pause/resume
- Session confirmation dialog
- Color-coded by assignment type

## Usage Guide

### Basic Integration

To add the Priest Dashboard to your application:

```typescript
import { PriestDashboard } from '@/components/delegation'
import { useAuth } from '@/hooks/useAuth'

export default function MyPage() {
  const { user } = useAuth()
  const projectId = '...' // from route params or props
  
  return (
    <PriestDashboard
      projectId={projectId}
      priestId={user.id}
      onNavigateToProjectDashboard={() => {
        // Navigate to project overview
      }}
      onNavigateToHome={() => {
        // Navigate to personal chanting
      }}
    />
  )
}
```

### Route Setup

The dashboard is available at:
```
/delegation/projects/{projectId}/priest
```

Example from `app/delegation/projects/[id]/priest/page.tsx`:

```typescript
'use client'

import { useParams, useRouter } from 'next/navigation'
import { useAuth } from '@/hooks/useAuth'
import { MainLayout } from '@/components/layout/MainLayout'
import { PriestDashboard } from '@/components/delegation'

export default function PriestDashboardPage() {
  const params = useParams()
  const router = useRouter()
  const { user } = useAuth()
  const projectId = params.id as string

  if (!user) return null

  return (
    <MainLayout>
      <PriestDashboard
        projectId={projectId}
        priestId={user.id}
        onNavigateToProjectDashboard={() =>
          router.push(`/delegation/projects/${projectId}`)
        }
        onNavigateToHome={() => router.push('/dashboard')}
      />
    </MainLayout>
  )
}
```

## Hook APIs

### usePriestDashboard

Fetches priest's assigned work and volunteer opportunities.

```typescript
const {
  data,      // PriestDashboardItem[]
  isLoading,
  error,
  refetch,
} = usePriestDashboard(projectId, priestId, {
  refetchInterval: 5000, // Poll every 5 seconds
})
```

**Returns:**
```typescript
interface PriestDashboardItem {
  graha_id: string
  graha_name: string
  target: number
  completed: number
  completion_pct: number
  assignment_type: 'assigned' | 'unassigned'
  can_volunteer: boolean
}
```

**Filters:**
- `assignment_type === 'assigned'`: Priest's assigned work
- `assignment_type === 'unassigned' && can_volunteer === true`: Volunteer opportunities

### useLogDelegationSession

Logs a delegation session for a priest.

```typescript
const mutation = useLogDelegationSession()

await mutation.mutateAsync({
  projectId: '...',
  priestId: '...',
  grahaId: '...',
  count: 108,           // Japas completed
  durationSecs: 1800,   // Optional: duration in seconds
  assignmentType: 'assigned' | 'volunteer'
})
```

**Behavior:**
- Inserts row into `delegation_sessions` table
- Triggers automatic update to `project_grahas.completed_count`
- Triggers automatic update to `projects.overall_completion_pct`
- Updates `priest_assignments.completed_count` for tracking

### usePriestDashboard Hook Details

```typescript
export function usePriestDashboard(
  projectId: string | null,
  priestId: string | null,
  options = { refetchInterval: 5000 }
): UseQueryResult<PriestDashboardItem[], Error> {
  const supabase = createClient()
  const { user } = useAuth()

  return useQuery<PriestDashboardItem[], Error>({
    queryKey: ['priestDashboard', projectId, priestId],
    queryFn: async () => {
      if (!projectId || !priestId) throw new Error(...)

      // Calls get_priest_dashboard RPC
      const { data, error } = await supabase.rpc(
        'get_priest_dashboard',
        { p_project_id: projectId, p_priest_id: priestId }
      )

      if (error) throw error
      return (data || []) as PriestDashboardItem[]
    },
    enabled: !!projectId && !!priestId && !!user,
    refetchInterval: options.refetchInterval || 5000,
    staleTime: 2000,
  })
}
```

## Database Integration

### RPCs Called

The implementation uses these Supabase RPCs:

1. **get_priest_dashboard(project_id, priest_id)**
   - Returns assigned grahas + unassigned incomplete grahas
   - Includes completion progress for each

2. **get_project_status(project_id)**
   - Returns overall project progress
   - Used for project metadata in dashboard

3. **log_delegation_session(project_id, priest_id, graha_id, count, duration_secs, assignment_type)**
   - Logs session to `delegation_sessions` table
   - Triggers automatic updates to project/assignment totals

### Triggers Used

The following PostgreSQL triggers handle automatic updates:

- `trig_update_project_graha_completion`
  - Updates `project_grahas.completed_count`
  - Updates `priest_assignments.completed_count`
  - Recalculates `projects.overall_completion_pct`

## Styling & Theming

### Color Scheme

**Assigned Work:**
```css
/* Primary colors */
background-color: #8b5cf6;  /* temple-500 */
color: #6d28d9;             /* temple-700 */

/* Badges and accents */
badge-background: #ddd6fe;  /* temple-100 */
badge-text: #6d28d9;        /* temple-700 */

/* Progress bars */
progress-gradient: linear-gradient(
  to right,
  #8b5cf6,                  /* temple-500 */
  #7c3aed                   /* temple-600 */
)
```

**Volunteer Work:**
```css
/* Primary colors */
background-color: #0ea5e9;  /* sacred-500 */
color: #075985;             /* sacred-700 */

/* Badges and accents */
badge-background: #cffafe;  /* sacred-100 */
badge-text: #075985;        /* sacred-700 */

/* Progress bars */
progress-gradient: linear-gradient(
  to right,
  #22d3ee,                  /* sacred-400 */
  #0ea5e9                   /* sacred-500 */
)
```

### Responsive Breakpoints

- **Mobile:** < 640px (sm)
- **Tablet:** 640px - 1024px (md)
- **Desktop:** > 1024px (lg)

## Performance Considerations

### Polling Strategy

- **Refetch interval:** 5 seconds (configurable)
- **Stale time:** 2 seconds
- **Background updates:** Yes (auto-refetch in background)
- **Manual refresh:** Button available for immediate update

### Optimization Tips

1. **Disable polling when not needed:**
```typescript
usePriestDashboard(projectId, priestId, {
  refetchInterval: false // Disable auto-polling
})
```

2. **Increase stale time for better UX:**
```typescript
// Modified hook call
refetchInterval: 30000,  // Every 30 seconds instead of 5
```

3. **Use offline queue:**
```typescript
// Sessions are automatically queued when offline
// and synced when connection restored
```

## Error Handling

### Error States

The dashboard handles these error scenarios:

1. **Loading**
   - Displays skeleton UI
   - Shows estimated content layout

2. **Network Error**
   - Shows error alert with retry button
   - Specific error message displayed

3. **Authorization Error**
   - User redirected if not part of project
   - Graceful fallback to home

4. **No Assignments**
   - Shows empty state
   - Suggests next actions

### Recovery Actions

- **Manual Refresh Button:** Forces immediate refetch
- **Try Again Button:** Retries failed operation
- **Navigation:** Switch views to avoid error context

## Testing

### Unit Tests

```typescript
import { render, screen } from '@testing-library/react'
import { PriestDashboard } from '@/components/delegation/PriestDashboard'

describe('PriestDashboard', () => {
  it('renders assigned grahas', () => {
    // Test assigned section visibility
  })

  it('renders volunteer opportunities', () => {
    // Test volunteer section visibility
  })

  it('calculates total progress correctly', () => {
    // Test percentage calculation
  })
})
```

### Integration Tests

```typescript
describe('Priest Delegation Session Flow', () => {
  it('completes full session lifecycle', async () => {
    // 1. Render dashboard
    // 2. Click "START SESSION"
    // 3. Increment counter
    // 4. Complete session
    // 5. Verify data updated
  })
})
```

### E2E Tests

```typescript
describe('Priest Dashboard E2E', () => {
  it('allows priest to start and complete session', () => {
    // 1. Navigate to priest dashboard
    // 2. Click graha START SESSION
    // 3. Increment 108 times
    // 4. Complete session
    // 5. Verify dashboard updates
  })
})
```

## Accessibility

### Keyboard Navigation

- Tab through buttons
- Enter/Space to activate buttons
- Escape to close modals

### Screen Reader Support

- ARIA labels on all buttons
- Semantic HTML structure
- Alt text on icons

### Visual Accessibility

- WCAG AA contrast ratios met
- Clear focus indicators
- Readable font sizes (14px minimum)

## Mobile Considerations

### Touch Optimization

- Button sizes: 44x44px minimum
- Tap targets: 10px padding minimum
- No hover-only controls

### Landscape Mode

- Adapts to landscape orientation
- Maintains usability at all angles
- Respects system preferences

### Offline First

- Sessions queue when offline
- Sync indication shown
- No data loss

## Troubleshooting

### Common Issues

**Dashboard not loading:**
- Check user is logged in
- Verify projectId is valid UUID
- Check user has project access (RLS policies)

**Sessions not saving:**
- Verify online connectivity
- Check offline queue (DevTools → Application)
- Check browser console for errors

**Counts not updating:**
- Manually refresh dashboard
- Check database triggers are active
- Verify RPC response structure

**Performance issues:**
- Increase refetchInterval
- Disable polling when not viewing dashboard
- Check network tab for slow requests

## Future Enhancements

1. **Batch Session Logging**
   - Log multiple sessions at once
   - Reduce API calls

2. **Push Notifications**
   - Graha completion alerts
   - Volunteer opportunity notifications
   - Project milestones

3. **Advanced Analytics**
   - Session duration trends
   - Daily/weekly patterns
   - Team contributions

4. **Social Features**
   - See other priests' progress
   - Motivational messages
   - Leaderboards

5. **Customization**
   - Theme preferences
   - Font size settings
   - Language selection (Te/Hi/En/Sa)

## Support & Resources

- **Component Docs:** `apps/web/src/components/delegation/PRIEST_DASHBOARD.md`
- **Schema Docs:** `supabase/migrations/20260602000001_create_host_delegation_system.sql`
- **API Docs:** `packages/api/index.js` (RPC comments)
- **Type Definitions:** `apps/web/src/types/delegation.ts`
