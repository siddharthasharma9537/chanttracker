# Delegation Components

This directory contains components for the Host/Delegation system in ChantTracker.

## HostProjectForm

The main form component for creating new host delegation projects.

### Features

- **Multi-field validation** using Zod schemas
- **Dynamic priest assignments** - add/remove priests with array field management
- **Graha selection** - checkbox interface for selecting which grahas to include
- **Multi-select dropdowns** - priests can be assigned multiple grahas
- **Real-time grahas loading** via React Query
- **Error handling** with field-level and form-level error messages
- **Loading states** with visual feedback
- **Responsive design** - mobile-friendly TailwindCSS styling
- **Dark theme** integration with glassmorphism effects

### Form Fields

1. **clientName** (required, string)
   - The name of the client requesting the delegation project
   - Min 2, Max 100 characters

2. **selectedGrahas** (required, array of UUID strings)
   - The Navagrahas to include in the project
   - Must select at least 1 graha
   - Displayed as checkboxes with visual feedback

3. **hostPriestName** (required, string)
   - The name of the host priest creating the project
   - Min 2, Max 100 characters

4. **priestAssignments** (required, array)
   - Dynamic array of priest assignments
   - Each assignment includes:
     - priestName: string (min 2 chars)
     - assignedGrahas: array of UUID strings (min 1 required)
   - Must have at least 1 priest assignment
   - Each priest must be assigned at least 1 graha

### Data Flow

```
Form Submit
    ↓
Validate with Zod Schema
    ↓
Call useCreateProject() mutation
    ↓
Call create_project() RPC with:
  - host_priest_id (from auth user)
  - client_name
  - description
  - graha_ids (selected grahas)
    ↓
Create project_grahas entries (108000 target each)
    ↓
Call assign_priests() RPC with:
  - project_id
  - priest_assignments array
    ↓
Success → Redirect to /delegation/projects/{projectId}
Error   → Display error message
```

### API Integration

The form integrates with these Supabase RPCs:

1. **create_project(host_priest_id, client_name, description, graha_ids)**
   - Creates projects table entry
   - Creates project_grahas entries for each selected graha
   - Returns: { project_id, status, total_target_count }

2. **assign_priests(project_id, priest_assignments)**
   - Creates priest_assignments table entries
   - Maps each priest to their assigned grahas
   - Returns: { success, assigned_count }

### Usage

```tsx
import { HostProjectForm } from '@/components/delegation/HostProjectForm'

export default function NewProjectPage() {
  return (
    <div className="p-8">
      <h1>Create New Project</h1>
      <HostProjectForm />
    </div>
  )
}
```

### Styling

- **Colors**: Orange (#FF6B35) for primary, Gray for neutral
- **Theme**: Dark glassmorphism with backdrop blur effects
- **Spacing**: TailwindCSS spacing utilities
- **Responsive**: Adapts from mobile to desktop layouts

### Error Handling

The form handles:
- **Validation errors**: Zod schema validation with field-level error messages
- **API errors**: Try-catch with error message display
- **Network errors**: Graceful error handling with user feedback
- **Loading states**: Visual feedback during async operations

### Dependencies

- `react-hook-form` - Form state management
- `@hookform/resolvers` - Zod schema integration
- `zod` - Schema validation
- `@tanstack/react-query` - API data fetching
- `lucide-react` - Icons
- `tailwindcss` - Styling

### Notes

- The form currently assigns all priests as the host user (auth.user.id)
- In a future version, priest selection could be enhanced with a modal to select from existing priests
- The default target count per graha is 108,000 japas (set in the RPC)
- Form data is validated both client-side and will be validated server-side by RLS policies
