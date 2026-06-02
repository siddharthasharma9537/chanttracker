# Delegation History Tab - Quick Start Guide

## Installation

### 1. Install Dependencies
```bash
cd apps/web
pnpm install  # Installs jspdf, jspdf-autotable, xlsx
```

### 2. Import Component
```tsx
import { DelegationHistoryTab } from '@/components/delegation'
```

## Basic Usage

### Minimal Example
```tsx
export function ProjectHistoryPage() {
  return (
    <DelegationHistoryTab
      projectId="e4a4c9c8-1234-5678-abcd-ef1234567890"
      clientName="Rama Sharma"
    />
  )
}
```

### With Navigation
```tsx
import { useRouter } from 'next/navigation'

export function ProjectHistoryPage() {
  const router = useRouter()

  return (
    <div className="space-y-4">
      <button
        onClick={() => router.back()}
        className="px-4 py-2 bg-gray-200 rounded-lg"
      >
        ← Back
      </button>
      
      <DelegationHistoryTab
        projectId="e4a4c9c8-1234-5678-abcd-ef1234567890"
        clientName="Rama Sharma"
        onNavigateBack={() => router.back()}
      />
    </div>
  )
}
```

## Features

### Date Range Filtering
The component includes built-in date range filtering:
- Last 7 days
- Last 14 days
- Last 30 days (default)
- All time

No configuration needed - just select from the dropdown.

### Multi-Level Drill-Down

#### 1. View Session History by Priest
```
1. Click priest name in summary → modal opens
2. See all sessions for that priest
3. Sort by date or count
4. View total japas and duration
```

#### 2. View Session History by Graha
```
1. Click graha name in summary → modal opens
2. See all sessions for that graha
3. View priest contributions breakdown
4. See each priest's assigned/volunteer work
```

#### 3. View Priest Contribution Summary
```
1. Click "View Details" button on priest entry
2. See assigned grahas with progress
3. See volunteer grahas
4. View total contribution
```

#### 4. View Graha Contribution Summary
```
1. Click "View Details" button on graha entry
2. See all priests contributing
3. View their contribution counts
4. See assignment type (assigned/volunteer)
```

### Export to PDF
```
PDF Export includes:
✓ Project name and date range
✓ Summary statistics
✓ Complete session table
✓ Professional formatting
✓ Footer with generation timestamp
```

**Filename format:** `ProjectName_History_YYYY-MM-DD.pdf`

### Export to Excel
```
Excel Workbook includes:
✓ Summary sheet (project info + stats)
✓ Session Details sheet (all session data)
✓ Formatted columns and headers
✓ Ready for further analysis
```

**Filename format:** `ProjectName_History_YYYY-MM-DD.xlsx`

## User Interactions

### For Project Hosts
1. **Monitor Progress:** See real-time completion percentages for each graha
2. **Track Priests:** Click priest names to see their session history
3. **Export Reports:** Download project history for records/sharing
4. **Verify Data:** Review all sessions for a specific period

### For Priests
1. **View Sessions:** Click on a graha to see your sessions for it
2. **Check Contributions:** See how much you've completed for each assigned graha
3. **Volunteer Work:** Separate tracking for volunteer vs assigned work
4. **Export Records:** Download your contribution summary for personal records

## API Requirements

The component requires these backend RPCs to be implemented:

```javascript
// In packages/api/index.js, these must exist:

export const getProjectStatus = (projectId)
  // Returns: graha breakdown with assigned priests

export const getProjectHistory = (projectId, startDate, endDate, priestId, grahaId)
  // Returns: session-level detail history

export const getGrahaContributions = (projectId, grahaId)
  // Returns: all priests working on a graha

export const getPriestContributions = (projectId, priestId)
  // Returns: all grahas a priest is working on
```

## Styling & Customization

### Color Scheme
The component uses Tailwind classes:
- Primary: `temple-500` / `temple-600` / `temple-900`
- Secondary: `sacred-500`
- Accent: `amber-600` (volunteer), `blue-600` (assigned)

To customize colors, update the color references in:
- `/apps/web/src/components/delegation/DelegationHistoryTab.tsx`
- `/apps/web/src/components/delegation/HistoryDetailModal.tsx`

### Responsive Design
The component automatically adjusts for:
- **Mobile:** Single column, bottom-sheet modal
- **Tablet:** 2-column layout, centered modal
- **Desktop:** Full 3+ column layout, side modal

No configuration needed.

## Troubleshooting

### "No data available" message
**Cause:** No sessions recorded for selected period
**Solution:** 
1. Check date range (try "All time")
2. Verify sessions exist in backend
3. Check filters aren't too restrictive

### Modal doesn't open
**Cause:** Query still loading or data missing
**Solution:**
1. Check `priestId` or `grahaId` are valid UUIDs
2. Wait for loading state to finish
3. Check browser console for errors

### Export fails silently
**Cause:** jsPDF or XLSX not installed, or browser doesn't support download
**Solution:**
1. Run `pnpm install` again
2. Check browser console for errors
3. Verify browser allows downloads

### Slow performance with large datasets
**Cause:** Component rendering many sessions
**Solution:**
1. Use date range filter to narrow data
2. Implement pagination (future feature)
3. Check React Query devtools for query counts

## Advanced Usage

### Custom Fetch Options
```tsx
// Modify data fetch behavior
const grahasQuery = useProjectGrahas(projectId, {
  enabled: true,
  refetchInterval: 10000, // 10 seconds
  staleTime: 60000,       // 1 minute
})
```

### Access Raw Data
```tsx
// In parent component
const { data: historyData } = useDelegationHistory(projectId, {
  startDate, endDate, priestId, grahaId
})

// Use historyData for custom processing
```

### Manual Export Trigger
```tsx
import { ExportButton } from '@/components/delegation'

export function CustomExportButton() {
  return (
    <ExportButton
      projectName="Rama Sharma"
      startDate="2024-01-01"
      endDate="2024-01-31"
      sessions={sessionData}
      format="pdf"
      className="custom-button-class"
      label="Download Report"
    />
  )
}
```

## Performance Tips

### 1. Reduce Query Frequency
```tsx
// Default is 30s stale time - can increase for less frequent updates
<DelegationHistoryTab
  projectId={projectId}
  clientName={clientName}
/>
```

### 2. Lazy Load Modals
The component already lazy-loads detail modals - they only fetch when opened.

### 3. Export Large Datasets
For exports with 1000+ sessions:
```tsx
// Use date range to limit export size
// E.g., export 7-day chunks rather than full year
```

## Browser Compatibility

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support
- Mobile browsers: Full support with responsive design

## Accessibility

- Keyboard navigable (Tab/Enter)
- ARIA labels on interactive elements
- Color contrast meets WCAG AA standards
- Screen reader friendly

## Next Steps

1. **Backend Implementation:** Ensure all 4 RPCs are implemented
2. **Integration:** Add to project dashboard/detail page
3. **Testing:** Test with real project data
4. **Monitoring:** Check error logs for failed queries

## Support & Documentation

- Full API docs: `/docs/DELEGATION_HISTORY_TAB.md`
- Type definitions: `/apps/web/src/hooks/useDelegationHistory.ts`
- Component code: `/apps/web/src/components/delegation/DelegationHistoryTab.tsx`
