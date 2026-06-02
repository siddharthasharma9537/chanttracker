# Host Project Form - Quick Start Guide

## Access the Form

Navigate to: `/delegation/new`

Or import and use in your code:
```tsx
import { HostProjectForm } from '@/components/delegation'
```

## Form Structure

### 1. CLIENT NAME (Required)
- Single text input
- 2-100 characters
- Name of the person/entity requesting the delegation project

### 2. SELECT GRAHAS FOR THIS PROJECT (Required)
- 9 checkboxes (one for each Navagraha)
- Must select at least 1
- Checked grahas will be available for priest assignments below

### 3. HOST PRIEST NAME (Required)
- Single text input
- 2-100 characters
- The priest who is hosting/coordinating the project

### 4. ASSIGN PRIESTS TO GRAHAS (Required)
- Dynamic section with add/remove functionality
- Default: 1 priest assignment (add more with "+ Add More Priests")
- For each priest:
  - **Priest Name**: Text input (2-100 chars)
  - **Assigned Grahas**: Multi-select checkboxes showing only selected grahas above
  - Each priest must have at least 1 graha assigned

### 5. ACTION BUTTONS
- **START**: Validates and submits form → creates project → redirects to dashboard
- **CANCEL**: Returns to previous page

## Form Data Structure

```typescript
{
  clientName: "Client Name",
  selectedGrahas: ["graha-id-1", "graha-id-2"],
  hostPriestName: "Priest Name",
  priestAssignments: [
    {
      priestName: "Priest A",
      assignedGrahas: ["graha-id-1"]
    },
    {
      priestName: "Priest B", 
      assignedGrahas: ["graha-id-2", "graha-id-3"]
    }
  ]
}
```

## Validation Rules

### All Required
- Client name must be 2-100 characters
- At least 1 graha must be selected
- Host priest name must be 2-100 characters
- At least 1 priest assignment
- Each priest name must be 2-100 characters
- Each priest must have at least 1 graha assigned

### Error Display
- Field-level errors appear below each input
- Form-level errors appear in a banner at the top
- Error messages are clear and actionable

## API Flow

1. **Validate** form client-side (Zod schema)
2. **Create Project** via `create_project()` RPC
   - Sets client name, host priest ID
   - Creates project_grahas entries (108,000 target each)
3. **Assign Priests** via `assign_priests()` RPC
   - Creates priest_assignments entries
   - Maps each priest to their selected grahas
4. **Success** → Redirect to `/delegation/projects/{projectId}`
5. **Error** → Display error message, form remains open

## Real-World Example

**Form Input:**
```
Client Name: "Maharaja's Temple"
Selected Grahas: Surya, Chandra, Shani
Host Priest Name: "Pandit Sharma"

Priest 1:
  Name: "Priest A"
  Grahas: Surya, Chandra

Priest 2:
  Name: "Priest B"
  Grahas: Shani
```

**Result:**
- New project created for "Maharaja's Temple"
- 3 grahas added to project (Surya, Chandra, Shani)
- Each graha gets 108,000 target japas
- Priest A assigned to Surya + Chandra
- Priest B assigned to Shani
- Project accessible at `/delegation/projects/{projectId}`

## Feature Highlights

✅ **Smart Dropdown Filtering**
- Priest assignment dropdowns only show grahas selected in step 2
- Prevents assigning unavailable grahas

✅ **Dynamic Priest Management**
- Add unlimited priests
- Remove priests (except if only 1 remains)
- Each priest tracked independently

✅ **Real-time Validation**
- Errors shown immediately as you type
- Clear feedback on what's required

✅ **Loading States**
- Visual feedback during form submission
- Button disabled during processing
- Clear "Creating Project..." message

✅ **Responsive Design**
- Works on mobile, tablet, desktop
- Touch-friendly inputs
- Readable on all screen sizes

✅ **Error Recovery**
- Failed submissions leave form intact
- Error message clearly displayed
- Can retry without data loss

## Styling Notes

- **Primary Color**: Orange (#FF6B35)
- **Theme**: Dark glassmorphism
- **Consistency**: Matches existing ChantTracker UI
- **Accessibility**: Proper labels and semantic HTML

## Testing the Form

### Happy Path
1. Fill all fields
2. Select multiple grahas
3. Add 2-3 priests with different graha assignments
4. Click START
5. Should redirect to project page

### Validation
1. Try submitting with empty client name → error appears
2. Try with 0 grahas selected → error appears
3. Try adding priest with no grahas → error on submit
4. Fill only 1 field → error appears on submit

### Edge Cases
1. Client name with 101 characters → truncated by validation
2. Rapid form submissions → handled gracefully
3. Network error → displayed with retry option
4. Same graha assigned to multiple priests → allowed (by design)

## Common Tasks

**I want to create a project for a client**
→ Navigate to `/delegation/new` and fill the form

**I want to assign multiple priests to the same graha**
→ Select that graha for multiple priests in their assignment

**I want to see project progress**
→ After creation, you're redirected to the project dashboard

**I want to modify a project after creation**
→ Future feature (not yet implemented)

## Support

For issues or questions:
1. Check error messages in the form
2. Ensure all required fields are filled
3. Verify grahas are properly selected
4. Check that each priest has at least one assigned graha

## Files Reference

- **Form Component**: `/apps/web/src/components/delegation/HostProjectForm.tsx`
- **Hooks**: `/apps/web/src/hooks/useDelegation.ts`
- **Types**: `/apps/web/src/types/delegation.ts`
- **Form Page**: `/apps/web/src/app/delegation/new/page.tsx`
- **Project Page**: `/apps/web/src/app/delegation/projects/[id]/page.tsx`

## Next Steps

After creating a project, explore:
- Project dashboard at `/delegation/projects/{projectId}`
- View priest assignments and progress
- Log chanting sessions (future feature)
- Track project completion

---

**Status**: Production Ready ✅
