# Delegation History Tab - Implementation Guide

## Overview

The Delegation History Tab is a comprehensive interface for viewing, filtering, and exporting session history from delegation projects. It provides multi-level drill-down views, detailed filtering capabilities, and export functionality in both PDF and Excel formats.

## Architecture

### Components

#### 1. **DelegationHistoryTab** (Main Component)
Located: `/apps/web/src/components/delegation/DelegationHistoryTab.tsx`

The primary component that orchestrates the entire history view. Responsibilities:
- Renders the control panel (date range, filters, export buttons)
- Displays the graha-centric summary view
- Manages modal state for detail views
- Coordinates data fetching and filtering

**Props:**
```typescript
interface DelegationHistoryTabProps {
  projectId: string          // Project UUID
  clientName: string         // Display name for the client/project
  onNavigateBack?: () => void // Optional callback to navigate back
}
```

**State Management:**
- `dateRange`: Filter timespan (7d, 14d, 30d, all)
- `filterByPriest`: Optional priest ID to restrict history
- `filterByGraha`: Optional graha ID to restrict history
- `showDetailModal`: Boolean to control modal visibility
- `detailViewType`: Type of detail view ('priest-sessions' | 'graha-sessions' | 'priest-summary' | 'graha-summary')
- `selectedPriest`: Currently selected priest for detail view
- `selectedGraha`: Currently selected graha for detail view

#### 2. **HistoryDetailModal** (Detail View Modal)
Located: `/apps/web/src/components/delegation/HistoryDetailModal.tsx`

A modal that displays detailed views based on user selection. Handles four types of views:
- Session-level history (sortable by date or count)
- Priest contribution summary (assigned + volunteer breakdown)
- Graha contribution summary (priest contributions aggregated)

**Props:**
```typescript
interface HistoryDetailModalProps {
  isOpen: boolean
  title: string
  viewType: 'sessions' | 'contribution'
  sessions?: DelegationSession[]
  priestContribution?: PriestContribution[]
  grahaContributions?: GrahaContribution[]
  isLoading?: boolean
  onClose: () => void
  onExport?: (format: 'pdf' | 'excel') => void
}
```

**Features:**
- Sortable session table (by date or count)
- Progress visualization with bars
- Summary footer with totals
- Export buttons (PDF/Excel)
- Responsive design (bottom sheet on mobile)

#### 3. **ExportButton** (Export Utility)
Located: `/apps/web/src/components/delegation/ExportButton.tsx`

Handles PDF and Excel export functionality. Uses:
- `jsPDF` + `jspdf-autotable` for PDF generation
- `XLSX` for Excel workbook creation

**Props:**
```typescript
interface ExportButtonProps {
  projectName: string
  startDate?: string
  endDate?: string
  sessions?: DelegationSession[]
  summary?: Record<string, any>
  format: 'pdf' | 'excel'
  label?: string
  className?: string
}
```

**Export Formats:**
- **PDF**: Professional report with header, summary stats, data table, and footer
- **Excel**: Multi-sheet workbook with Summary sheet and Session Details sheet

### Data Hooks

Located: `/apps/web/src/hooks/useDelegationHistory.ts`

#### 1. **useDelegationHistory**
Fetches detailed session history with optional filtering.

```typescript
export function useDelegationHistory(
  projectId: string,
  options: {
    startDate?: string | null    // YYYY-MM-DD
    endDate?: string | null      // YYYY-MM-DD
    priestId?: string | null
    grahaId?: string | null
    enabled?: boolean
  }
): UseQueryResult<DelegationSession[], Error>
```

**Query Key:** `['delegation-history', projectId, startDate, endDate, priestId, grahaId]`

#### 2. **useProjectGrahas**
Fetches all grahas for a project with priest assignments and progress.

```typescript
export function useProjectGrahas(
  projectId: string,
  options: { enabled?: boolean }
): UseQueryResult<ProjectGrahaBreakdown[], Error>
```

**Query Key:** `['project-grahas', projectId]`

#### 3. **useGrahaContributions**
Fetches all priests contributing to a specific graha.

```typescript
export function useGrahaContributions(
  projectId: string,
  grahaId: string,
  options: { enabled?: boolean }
): UseQueryResult<GrahaContribution[], Error>
```

**Query Key:** `['graha-contributions', projectId, grahaId]`

#### 4. **usePriestContributions**
Fetches all grahas a priest is working on (assigned + volunteer).

```typescript
export function usePriestContributions(
  projectId: string,
  priestId: string,
  options: { enabled?: boolean }
): UseQueryResult<PriestContribution[], Error>
```

**Query Key:** `['priest-contributions', projectId, priestId]`

## Data Flow

### 1. Initial Load
1. Component mounts with `projectId` and `clientName`
2. `useProjectGrahas` fetches all grahas for the project
3. `useDelegationHistory` fetches sessions for the selected date range
4. Summary data is computed from the raw session history

### 2. User Interactions

#### Filter by Date Range
```
User selects dateRange → recalculate startDate/endDate → 
re-run useDelegationHistory → update UI
```

#### Click Priest Name in Summary
```
User clicks priest → set selectedPriest → set detailViewType='priest-sessions' → 
open modal → display filtered sessions in HistoryDetailModal
```

#### Click Graha Name in Summary
```
User clicks graha → set selectedGraha → set detailViewType='graha-sessions' → 
open modal → display filtered sessions in HistoryDetailModal
```

#### View Priest Summary
```
User clicks "View Details" on priest in summary → set detailViewType='priest-summary' → 
usePriestContributions fetches assigned+volunteer grahas → modal displays breakdown
```

#### View Graha Summary
```
User clicks "View Details" on graha → set detailViewType='graha-summary' → 
useGrahaContributions fetches all priests → modal displays priest contributions
```

### 3. Export Flow
1. User clicks PDF/Excel button
2. `ExportButton` component calls appropriate export function
3. Data is formatted and file is generated/downloaded
4. Filename includes project name and current date

## UI/UX Features

### Main Summary View
```
┌─────────────────────────────────────────────────────────────┐
│ Controls                                                      │
│ Client: [Rama Sharma]  Date: [Last 30 days ▼]  PDF  Excel   │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ Surya - 4000/6000 [66.7%]                  [View Details]    │
│ ████████░░░ 66.7%                                            │
│ └─ Priest A - 2430 japas [ASSIGNED]                          │
│ └─ Priest B - 1570 japas [VOLUNTEER]                         │
└─────────────────────────────────────────────────────────────┘

[More grahas...]
```

### Detail Modal (Sessions View)
```
┌─────────────────────────────────────────────────────────┐
│ Priest A - Session History                        [✕]   │
│ 12 sessions recorded                                    │
├─────────────────────────────────────────────────────────┤
│ [Sort by Date] [Sort by Count]                         │
│                                                         │
│ Date   | Graha   | Count | Duration | Type    | Status │
│ -------|---------|-------|----------|---------|------- │
│ 12-Jan | Surya   | 540   | 20 min   | ASSIGNED| ✓      │
│ 12-Jan | Surya   | 600   | 25 min   | ASSIGNED| ✓      │
│ 13-Jan | Surya   | 1290  | 45 min   | ASSIGNED| ✓      │
│ 14-Jan | Mangal  | 1080  | 50 min   | ASSIGNED| ✓      │
│ 14-Jan | Shukra  | 850   | 35 min   | VOLUNTEER| ✓     │
│                                                         │
│ Total Sessions: 5 | Total Japas: 4360 | Duration: 2h30m│
├─────────────────────────────────────────────────────────┤
│ [Close]  [Download PDF]  [Download Excel]              │
└─────────────────────────────────────────────────────────┘
```

### Detail Modal (Priest Summary View)
```
┌─────────────────────────────────────────────────────────┐
│ Priest A - Complete Contribution                  [✕]   │
│ 7 grahas                                                │
├─────────────────────────────────────────────────────────┤
│ ASSIGNED GRAHAS                                         │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Surya          2,430 / 6,000 (40.5%)        →    │  │
│ │ ████████░░░░░░░░░░                              │  │
│ │ 3 sessions                                       │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Mangal         5,000 / 5,000 (100%) ✓           │  │
│ │ ████████████████████                            │  │
│ │ 2 sessions                                       │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ VOLUNTEER GRAHAS                                        │
│                                                         │
│ ┌───────────────────────────────────────────────────┐  │
│ │ Shukra         1,700 / 6,500 (26.2%)             │  │
│ │ ██████░░░░░░░░░░░░                               │  │
│ │ 2 volunteer sessions                             │  │
│ └───────────────────────────────────────────────────┘  │
│                                                         │
│ TOTALS                                                  │
│ Total Assigned: 13,230 | Total Volunteer: 1,700        │
│ Total Contribution: 14,930                              │
├─────────────────────────────────────────────────────────┤
│ [Close]  [Download PDF]  [Download Excel]              │
└─────────────────────────────────────────────────────────┘
```

## Type Definitions

All types are defined in `/apps/web/src/hooks/useDelegationHistory.ts`:

```typescript
interface DelegationSession {
  session_date: string
  priest_name: string
  priest_id: string
  graha_name: string
  graha_id: string
  count: number
  duration_secs?: number
  assignment_type: 'assigned' | 'volunteer'
  session_id: string
}

interface GrahaContribution {
  priest_id: string
  priest_name: string
  completed_count: number
  assignment_type: 'assigned' | 'volunteer'
  sessions_count: number
}

interface PriestContribution {
  graha_id: string
  graha_name: string
  target: number
  completed: number
  completion_pct: number
  assignment_type: 'assigned' | 'volunteer'
  sessions_count: number
}

interface ProjectGrahaBreakdown {
  graha_id: string
  graha_name: string
  target: number
  completed: number
  completion_pct: number
  assigned_priests?: Array<{
    priest_id: string
    priest_name: string
    assignment_type: string
  }>
}
```

## Integration Points

### Backend Dependency (RPCs)
The component relies on these backend RPCs via `/packages/api/index.js`:

1. **getProjectStatus(projectId)** → `ProjectGrahaBreakdown[]`
2. **getProjectHistory(projectId, startDate, endDate, priestId, grahaId)** → `DelegationSession[]`
3. **getGrahaContributions(projectId, grahaId)** → `GrahaContribution[]`
4. **getPriestContributions(projectId, priestId)** → `PriestContribution[]`

All must be implemented in the Supabase backend before this component can function.

### Parent Component Integration

To integrate into a project view:

```tsx
import { DelegationHistoryTab } from '@/components/delegation'

export function ProjectPage() {
  return (
    <DelegationHistoryTab
      projectId="project-uuid-here"
      clientName="Rama Sharma"
      onNavigateBack={() => router.back()}
    />
  )
}
```

## Styling

### Color Scheme
- **Primary (Temple):** #8b4513 - Main interactions, progress bars
- **Sacred:** #d97706 - Accents
- **Success (Green):** #22c55e - Completion indicators
- **Info (Blue):** #3b82f6 - Assigned work badges
- **Warning (Amber):** #f59e0b - Volunteer work badges
- **Danger (Red):** #ef4444 - Error states

### Responsive Design
- **Mobile:** Bottom sheet modal, single-column layout
- **Tablet:** 2-column layout, full-width modal
- **Desktop:** 3-column controls, full-featured interface

## Performance Considerations

### Query Caching
- Stale time: 30 seconds
- Cache keys include all filter parameters
- Query refetch on window focus disabled for history data

### Optimization Tips
1. Use `enabled` option to prevent unnecessary queries
2. Implement pagination for large datasets (100+ sessions)
3. Consider virtualizing long session lists
4. Lazy-load export functionality

## Testing Checklist

- [ ] Load with different date ranges
- [ ] Click priest names to view session history
- [ ] Click graha names to view priest contributions
- [ ] Export to PDF with multiple grahas
- [ ] Export to Excel with large datasets
- [ ] Verify mobile modal responsiveness
- [ ] Test with no data (empty period)
- [ ] Test with single priest/graha
- [ ] Verify sorting in session view
- [ ] Check export file naming and format

## Known Limitations

1. **Priest ID Handling:** Currently uses priest name as fallback ID in some places
2. **Large Datasets:** May require pagination for projects with 1000+ sessions
3. **Export Size:** Very large exports (10000+ rows) may be slow
4. **Real-time Updates:** Not real-time; requires manual refresh or query refetch

## Future Enhancements

1. Real-time WebSocket updates for live history
2. Pagination or virtual scrolling for large datasets
3. Custom date range picker
4. Comparison views (priest-to-priest, graha-to-graha)
5. Analytics/charts view with trends
6. Inline filtering by assignment type
7. Bulk session edit/delete operations
8. Session notes/annotations
