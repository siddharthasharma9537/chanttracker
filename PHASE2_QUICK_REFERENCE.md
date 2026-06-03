# Phase 2 Quick Reference

## Component Import Quick Start

```tsx
// Buttons
import { Button } from '@/components/buttons'
<Button variant="primary" size="md">Click</Button>

// Cards
import { Card } from '@/components/cards'
<Card variant="featured">Content</Card>

// Forms
import { Input } from '@/components/forms'
<Input type="email" label="Email" />
<Input type="textarea" label="Message" rows={4} />

// Feedback
import { Badge, Progress } from '@/components/feedback'
<Badge variant="success">Done</Badge>
<Progress value={75} />

// States
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/states'
<EmptyState heading="No data" />
<ErrorState message="Error" onRetry={() => {}} />
<LoadingSkeleton variant="card" count={3} />
```

## Button Variants

| Variant | Use Case | Colors |
|---------|----------|--------|
| primary | Main actions, CTAs | Sacred orange |
| secondary | Secondary actions | Semi-transparent white |
| tertiary | Less emphasis | Outlined orange |
| ghost | Minimal, text-only | Orange text |

## Card Variants

| Variant | Opacity | Use Case |
|---------|---------|----------|
| featured | 15% | Highlighted content |
| standard | 10% | Default cards |
| subtle | 8% | Background cards |

## Input Types

- `text` - General text input
- `email` - Email validation
- `password` - Hidden password input
- `number` - Numeric input with spinner
- `textarea` - Multi-line text
- `select` - Dropdown selection

## Badge Variants

| Variant | Color | Use Case |
|---------|-------|----------|
| success | Green | Completed, active |
| error | Red | Failed, error |
| warning | Orange | Caution, warning |
| info | Blue | Information |
| neutral | Gray | Default status |

## Progress Color Coding

- **0-25%**: Red (error)
- **25-50%**: Orange (warning)
- **50-75%**: Blue (info)
- **75-100%**: Green (success)

## Common Props

### Button
```tsx
<Button
  variant="primary"           // primary | secondary | tertiary | ghost
  size="md"                  // sm | md | lg
  disabled={false}           // boolean
  loading={false}            // boolean
  onClick={() => {}}         // function
>
  Label
</Button>
```

### Input
```tsx
<Input
  type="text"               // text | email | password | number | textarea | select
  label="Field"             // optional label
  error="Required"          // error message
  helperText="Help text"    // optional helper
  disabled={false}          // boolean
  required={true}           // boolean
  value={value}             // controlled value
  onChange={(e) => {}}      // change handler
  placeholder="Placeholder" // placeholder text
/>
```

### Progress
```tsx
<Progress
  value={65}                // 0-100
  variant="linear"          // linear | circular
  size="md"                 // sm | md | lg
  showLabel={true}          // show percentage
  label="Custom Label"      // optional custom label
/>
```

## Design Tokens Quick Reference

```css
/* Colors */
--color-primary-500         /* Sacred orange */
--color-success             /* Green */
--color-error              /* Red */
--color-warning            /* Orange */
--color-info               /* Blue */

/* Spacing */
--spacing-sm              /* 8px */
--spacing-md              /* 12px */
--spacing-lg              /* 16px */
--spacing-xl              /* 24px */

/* Typography */
--font-size-body          /* 16px */
--font-size-body-sm       /* 14px */
--font-size-caption       /* 12px */

/* Shadows */
--shadow-md               /* Standard elevation */
--shadow-glass-md         /* Glassmorphic glow */

/* Transitions */
--transition-base         /* 300ms ease-in-out */
```

## Demo Page Routes

- Main demo: `/components-demo`
- Shows all components
- All variants and states
- Interactive examples
- Responsive grid layout

## File Locations

```
/apps/web/src/components/
├── buttons/Button.tsx
├── cards/Card.tsx
├── forms/Input.tsx
├── feedback/Badge.tsx
├── feedback/Progress.tsx
├── states/EmptyState.tsx
├── states/ErrorState.tsx
├── states/LoadingSkeleton.tsx
└── COMPONENT_LIBRARY.md

/apps/web/src/app/components-demo/page.tsx
```

## Common Patterns

### Form with Error
```tsx
const [email, setEmail] = useState('')
const [error, setError] = useState('')

const handleSubmit = () => {
  setError(email ? '' : 'Required')
}

<Input
  label="Email"
  value={email}
  onChange={(e) => setEmail(e.currentTarget.value)}
  error={error}
/>
<Button onClick={handleSubmit}>Submit</Button>
```

### Loading States
```tsx
const [loading, setLoading] = useState(true)
const [data, setData] = useState(null)

useEffect(() => {
  fetch('/api/data')
    .then(r => r.json())
    .then(d => { setData(d); setLoading(false) })
}, [])

{loading ? (
  <LoadingSkeleton variant="card" count={3} />
) : (
  <div>{data}</div>
)}
```

### Card Grid
```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
  {items.map(item => (
    <Card key={item.id} variant="standard">
      <h3>{item.name}</h3>
      <p>{item.desc}</p>
    </Card>
  ))}
</div>
```

## Build Commands

```bash
# Build
pnpm build

# Development
pnpm dev

# View demo
# Visit http://localhost:3000/components-demo
```

## Accessibility Checklist

- ✅ Use semantic HTML (button, input, label)
- ✅ Add ARIA labels to icon-only elements
- ✅ Test with keyboard (Tab, Enter, Escape)
- ✅ Check focus indicators visible
- ✅ Verify color contrast
- ✅ Test with screen reader

## Phase 3 Next Steps

1. Integrate components into dashboard
2. Update history page
3. Implement form validation
4. Add loading/error states to pages
5. Create responsive layouts with components

---

**Status:** ✅ Complete
**Total Components:** 8
**Build Status:** ✅ No errors
**Documentation:** ✅ Complete
