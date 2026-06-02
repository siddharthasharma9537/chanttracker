# Priest Dashboard for Delegation System

## Overview

The Priest Dashboard is a dedicated interface for priests participating in delegation projects. It displays their assigned work and volunteer opportunities, allowing them to start sessions and contribute to project completion.

## Components

### 1. PriestDashboard (Main Component)
**File:** `PriestDashboard.tsx`

The main dashboard component that orchestrates the priest's view of a delegation project.

**Props:**
```typescript
interface PriestDashboardProps {
  projectId: string              // UUID of the delegation project
  priestId: string               // UUID of the current priest
  onNavigateToProjectDashboard?: () => void  // Navigate to project overview
  onNavigateToHome?: () => void  // Navigate to personal chanting
}
```

**Features:**
- Real-time updates (5s polling) of assigned work and volunteer opportunities
- Overall progress tracking with stats cards
- Quick access to start sessions on any graha
- Integration with session counter for detailed tracking
- Responsive design for mobile and desktop
- Offline-aware with pending session tracking

**State Management:**
- Uses `usePriestDashboard` hook for dashboard data
- Uses `useDelegationProject` hook for project metadata
- Uses `useLogDelegationSession` mutation for session logging

### 2. AssignedGrahasSection
**File:** `AssignedGrahasSection.tsx`

Displays all grahas the priest is assigned to work on.

**Props:**
```typescript
interface AssignedGrahasSectionProps {
  items: PriestDashboardItem[]
  onStartSession: (grahaId: string, grahaName: string, assignmentType: 'assigned' | 'volunteer') => void
}
```

**Features:**
- Shows target and completed counts
- Progress bars for visual feedback
- "START SESSION" button for each graha
- "ASSIGNED" badge for clarity
- Subtotal of assigned work
- Shows remaining count needed

### 3. VolunteerOpportunitiesSection
**File:** `VolunteerOpportunitiesSection.tsx`

Shows incomplete grahas available for volunteering.

**Props:**
```typescript
interface VolunteerOpportunitiesSectionProps {
  items: PriestDashboardItem[]
  onStartSession: (grahaId: string, grahaName: string, assignmentType: 'assigned' | 'volunteer') => void
}
```

**Features:**
- Lists all incomplete grahas not assigned to this priest
- Shows progress toward completion
- "VOLUNTEER" button for each opportunity
- "VOLUNTEER" badge to distinguish from assigned work
- Summary of volunteer opportunities

### 4. SessionCounter
**File:** `../chant/SessionCounter.tsx`

Full-screen counter for logging delegation sessions.

**Props:**
```typescript
interface SessionCounterProps {
  grahaName: string
  projectId: string
  grahaId: string
  assignmentType: 'assigned' | 'volunteer'
  onComplete: (count: number, durationSecs: number) => Promise<void>
  onCancel: () => void
}
```

**Features:**
- Large, easy-to-tap bead counter
- Real-time timer
- Pause/resume functionality
- Increment/decrement controls
- Session confirmation dialog
- Color-coded by assignment type (assigned: magenta, volunteer: cyan)
- Offline support with pending session tracking

## Data Flow

### Dashboard Load
```
PriestDashboard
  ├─ usePriestDashboard(projectId, priestId)
  │  └─ RPC: get_priest_dashboard
  │     ├─ Returns assigned grahas
  │     └─ Returns incomplete grahas for volunteering
  │
  └─ useDelegationProject(projectId)
     └─ RPC: get_project_status (for project metadata)
```

### Session Flow
```
User clicks "START SESSION" or "VOLUNTEER"
  │
  ├─ setActiveSession(grahaId, grahaName, assignmentType)
  │
  ├─ Show SessionCounter component
  │
  ├─ User taps bead to increment count
  │
  ├─ User completes session
  │
  ├─ useLogDelegationSession mutation
  │  └─ RPC: log_delegation_session
  │     └─ Updates project_grahas.completed_count
  │     └─ Triggers automatic project_grahas.total update
  │
  ├─ Dashboard refetch (via refetch())
  │
  └─ Clear session, show updated dashboard
```

## Styling & Design

### Color Scheme
- **Assigned Work:** Temple colors (purple/magenta)
  - Primary: `bg-temple-500` / `text-temple-700`
  - Badges: `bg-temple-100 text-temple-700`
  - Progress: Gradient from `temple-500` to `temple-600`

- **Volunteer Work:** Sacred colors (blue/cyan)
  - Primary: `bg-sacred-500` / `text-sacred-700`
  - Badges: `bg-sacred-100 text-sacred-700`
  - Progress: Gradient from `sacred-400` to `sacred-500`

### Responsive Design
- Mobile-first approach
- Adapts to tablet and desktop screens
- Touch-friendly button sizes (44px+ on mobile)
- Readable typography at all sizes

## Hooks

### usePriestDashboard
```typescript
export function usePriestDashboard(
  projectId: string | null,
  priestId: string | null,
  options = { refetchInterval: 5000 }
): UseQueryResult<PriestDashboardItem[], Error>
```

**Returns:**
- Array of items with `assignment_type` ('assigned' | 'unassigned')
- Each item has: graha_id, graha_name, target, completed, completion_pct, can_volunteer

### useLogDelegationSession
```typescript
export function useLogDelegationSession(): UseMutationResult<any, Error, LogSessionParams>
```

**Params:**
- projectId, priestId, grahaId, count, durationSecs, assignmentType

## Integration with Existing Systems

### Personal Chanting
- Priests can toggle between personal and delegation chanting
- "Personal Chanting" button returns to `/dashboard`
- Separate session tracking for personal vs. project work

### Project Dashboard
- "View Project Dashboard" shows overall project progress
- Accessible to both host priests and assigned priests
- Navigates to `/delegation/projects/{id}`

### History
- Delegation sessions logged to `delegation_sessions` table
- Accessible via project history endpoint
- Separate from personal `chant_sessions` table

## Offline Support

The SessionCounter integrates with the offline store to:
- Queue sessions when offline
- Sync when connection restored
- Display "Offline — changes will sync" indicator
- Prevent loss of work during connectivity issues

## Real-time Updates

The dashboard uses React Query with automatic polling:
- **Refetch interval:** 5 seconds (configurable)
- **Stale time:** 2 seconds
- Timestamp shows when last updated
- Manual refresh button available

## Error Handling

- Loading states with skeleton UI
- Error boundaries with retry functionality
- Specific error messages for failed operations
- Graceful fallbacks for missing data

## Accessibility

- Semantic HTML structure
- ARIA labels on buttons
- Keyboard navigation support (Tab, Enter, Space)
- Sufficient color contrast (temple/sacred colors meet WCAG AA)
- Touch targets sized for mobile (min 44x44px)

## Mobile Responsiveness

**Mobile (< 640px):**
- Single column layout
- Compact spacing and font sizes
- Touch-optimized controls
- Bottom sheet dialogs

**Tablet (640px - 1024px):**
- Adjusted spacing
- Larger tap targets
- Two-column stats

**Desktop (> 1024px):**
- Full-width content
- Optimized reading width (max-w-2xl)
- Hover effects on interactive elements

## Testing Considerations

### Unit Tests
- Dashboard data calculations (sums, percentages)
- Component rendering with different data states
- Button click handlers

### Integration Tests
- Full session flow from start to completion
- Dashboard refresh after session logging
- Navigation between priest and project dashboards

### E2E Tests
- Priest assignment workflow
- Session counting and logging
- Volunteer opportunity completion
- Real-time dashboard updates

## Future Enhancements

1. **Multiple Projects**
   - Project selector dropdown
   - Summary across all projects

2. **Team View**
   - See other priests' progress on shared grahas
   - Collaborative motivation

3. **Notifications**
   - Graha completion alerts
   - Project milestone notifications
   - Volunteer opportunities

4. **Analytics**
   - Personal contribution breakdown
   - Session duration trends
   - Daily/weekly patterns

5. **Customization**
   - Theme preferences (light/dark)
   - Font size adjustments
   - Language preferences (Te/Hi/En/Sa)
