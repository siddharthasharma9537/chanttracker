# Host Project Form - Component API Reference

## HostProjectForm Component

### Import
```tsx
import { HostProjectForm } from '@/components/delegation'
```

### Props
None - The component is self-contained and manages all state internally.

### Usage
```tsx
export default function NewProjectPage() {
  return (
    <div className="container mx-auto">
      <HostProjectForm />
    </div>
  )
}
```

## Form Data Structure

### HostProjectFormData
```typescript
interface HostProjectFormData {
  clientName: string                  // 2-100 characters
  selectedGrahas: string[]            // Array of graha UUIDs, min 1
  hostPriestName: string             // 2-100 characters
  priestAssignments: PriestAssignment[] // Min 1, each needs ≥1 graha
}
```

### PriestAssignment
```typescript
interface PriestAssignment {
  priestName: string                 // 2-100 characters
  assignedGrahas: string[]          // Array of graha UUIDs, min 1
}
```

## Custom Hooks

### useGrahas()
Fetches all Navagrahas from database.

```typescript
const { data: grahas, isLoading, error } = useGrahas()
```

**Returns:**
- `data`: Array of Graha objects
- `isLoading`: Boolean
- `error`: Error object if failed

**Cache**: 1 hour

### useCreateProject()
Mutation hook for creating a new project.

```typescript
const mutation = useCreateProject()

await mutation.mutateAsync(formData)
```

**Methods:**
- `mutateAsync(formData)`: Submit form data
- `isPending`: Boolean while submitting
- `error`: Error if submission failed

**Data Flow:**
1. Validates formData structure
2. Calls `create_project()` RPC
3. Calls `assign_priests()` RPC
4. Returns project ID

**Throws:**
- User not authenticated error
- RPC execution error
- Network error

### useProjectStatus(projectId)
Fetches comprehensive project status.

```typescript
const { data: project, isLoading, error } = useProjectStatus(projectId)
```

**Parameters:**
- `projectId`: Project UUID or null

**Returns:**
- `data`: ProjectStatus object
  - `client_name`: string
  - `status`: 'active' | 'completed' | 'abandoned'
  - `overall_completion_pct`: 0-100
  - `total_target`: number
  - `total_completed`: number
  - `graha_breakdown`: Array of GrahaBreakdown objects

**Cache**: 30 seconds

**Enabled**: Only when projectId is provided and user is authenticated

### useProjectsList()
Lists all projects visible to current user.

```typescript
const { data: projects, isLoading, error } = useProjectsList()
```

**Returns:**
- `data`: Array of ProjectStatus objects

**Cache**: 1 minute

**Enabled**: Only when user is authenticated

### usePriestContributions(projectId)
Gets per-priest work summary.

```typescript
const { data: contributions, isLoading, error } = usePriestContributions(projectId)
```

**Returns:**
- `data`: Array of contribution objects
  - `priest_id`: UUID
  - `project_id`: UUID
  - `client_name`: string
  - `graha_id`: UUID
  - `graha_name`: string
  - `assignment_type`: 'assigned' | 'volunteer'
  - `target`: number
  - `completed`: number
  - `sessions_count`: number

**Cache**: 30 seconds

## Type Definitions

### Graha
```typescript
interface Graha {
  id: string
  name: string
  position: number
  day_of_week: number | null
  color: string | null
  created_at: string
}
```

### ProjectGrahaBreakdown
```typescript
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

### ProjectCreateResponse
```typescript
interface ProjectCreateResponse {
  project_id: string
  status: string
  total_target_count: number
}
```

### ProjectStatus
```typescript
interface ProjectStatus {
  client_name: string
  status: string
  overall_completion_pct: number
  total_target: number
  total_completed: number
  graha_breakdown: ProjectGrahaBreakdown[]
}
```

## API Integration Points

### Supabase RPCs Called

#### create_project
```sql
create_project(
  p_host_priest_id UUID,
  p_client_name TEXT,
  p_description TEXT,
  p_graha_ids UUID[]
)
→ RETURNS (project_id UUID, status TEXT, total_target_count INT)
```

**Behavior:**
- Creates projects row
- Creates project_grahas rows (one per graha)
- Sets target_count to 108,000 per graha
- Returns project ID and totals

#### assign_priests
```sql
assign_priests(
  p_project_id UUID,
  p_priest_assignments JSONB
)
→ RETURNS (success BOOLEAN, assigned_count INT)
```

**Input Format:**
```jsonb
[
  {
    "priest_id": "uuid",
    "priest_name": "name",
    "assigned_graha_ids": ["uuid", "uuid"]
  }
]
```

**Behavior:**
- Creates priest_assignments rows
- One row per (priest, graha) pair
- Returns count of assignments created

#### get_project_status
```sql
get_project_status(p_project_id UUID)
→ RETURNS project status with breakdown
```

## Validation Schema (Zod)

```typescript
const hostProjectSchema = z.object({
  clientName: z
    .string()
    .min(2, 'Client name must be at least 2 characters')
    .max(100, 'Client name must not exceed 100 characters'),
  
  selectedGrahas: z
    .array(z.string())
    .min(1, 'Please select at least one graha'),
  
  hostPriestName: z
    .string()
    .min(2, 'Priest name must be at least 2 characters')
    .max(100, 'Priest name must not exceed 100 characters'),
  
  priestAssignments: z
    .array(z.object({
      priestName: z
        .string()
        .min(2, 'Priest name must be at least 2 characters'),
      assignedGrahas: z
        .array(z.string())
        .min(1, 'Each priest must be assigned at least one graha'),
    }))
    .min(1, 'Please add at least one priest assignment'),
})
```

## Error Handling

### Validation Errors
- Caught by Zod schema
- Displayed below respective fields
- Clear, actionable messages

### API Errors
- Caught by mutation.error
- Displayed in form-level banner
- Includes original error message

### Network Errors
- Handled by React Query
- Displayed with retry option
- Non-blocking for UX

## Form Events

### onSubmit
Triggered when form is submitted after validation passes.

```tsx
const onSubmit = async (data: HostProjectFormData) => {
  // 1. Call createProjectMutation
  // 2. Handle response
  // 3. Redirect or show error
}
```

## Component State

### Internal State
- Form values (managed by React Hook Form)
- Form errors (managed by Zod validation)
- Open dropdown index (for priest graha selection)
- Form-level error message

### External State
- User authentication (from useAuth)
- Grahas data (from useGrahas)
- Project creation mutation (from useCreateProject)

## Lifecycle

1. **Mount**
   - Check user authentication
   - Load grahas data
   - Initialize form with empty values

2. **User Interaction**
   - Update form values
   - Show validation errors as needed
   - Show/hide dropdowns

3. **Submit**
   - Validate form
   - Show loading state
   - Call API endpoints
   - Show success/error
   - Redirect on success

## Performance Considerations

### React Query Caching
- Grahas: 1 hour cache
- Project status: 30 second cache
- Automatic stale updates

### Form Optimization
- React Hook Form prevents re-renders
- Controlled component updates
- useFieldArray for efficient array handling

### Bundle Impact
- Form: ~15KB (minified)
- Dependencies already in project
- No additional installs needed

## Accessibility

### Semantic HTML
- Proper label elements
- Input types match content
- Fieldset for related inputs

### Error Messages
- Associated with form fields
- Clear and descriptive
- Read by screen readers

### Keyboard Navigation
- Tab through form fields
- Enter submits form
- Escape closes dropdowns (future)

## Browser Support

Tested on:
- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- Mobile browsers

Requirements:
- ES2020+ JavaScript
- CSS Grid/Flexbox
- LocalStorage (for React Query)

## Configuration

### Customization Points

**Default Target per Graha**
- Currently: 108,000 (set in RPC)
- To change: Modify `v_default_target` in SQL

**Cache Duration**
- Grahas: 1 hour
- Project status: 30 seconds
- Modify in useGrahas/useProjectStatus

**Form Validation**
- Rules in hostProjectSchema
- Modify Zod schema to change

## Troubleshooting

### Form Won't Submit
1. Check console for validation errors
2. Ensure user is authenticated
3. Verify at least 1 graha selected
4. Check network connection

### API Error on Submit
1. Check Supabase status
2. Verify RLC permissions
3. Check browser console for details
4. Try again (may be transient)

### Grahas Not Loading
1. Check useGrahas hook
2. Verify database connection
3. Check React Query devtools
4. Refresh page

## Examples

### Basic Usage
```tsx
import { HostProjectForm } from '@/components/delegation'

export default function NewProject() {
  return <HostProjectForm />
}
```

### With Custom Styling
```tsx
<div className="bg-gradient-to-br from-slate-900">
  <h1>Create Project</h1>
  <HostProjectForm />
</div>
```

### With Error Boundary (Optional)
```tsx
<ErrorBoundary fallback={<div>Error loading form</div>}>
  <HostProjectForm />
</ErrorBoundary>
```

---

**Last Updated**: June 1, 2026
**Version**: 1.0
**Status**: Production Ready
