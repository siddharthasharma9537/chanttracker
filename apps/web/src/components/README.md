# ChantTracker Component Library

## Overview

This directory contains the ChantTracker reusable component library built on Phase 1 design tokens. All components are production-ready, fully accessible, and TypeScript-enabled.

## Quick Start

### Using Components

```tsx
import { Button } from '@/components/buttons'
import { Card } from '@/components/cards'
import { Input } from '@/components/forms'
import { Badge, Progress } from '@/components/feedback'
import { EmptyState, ErrorState, LoadingSkeleton } from '@/components/states'

export default function MyPage() {
  return (
    <Card variant="featured">
      <h2>Welcome</h2>
      <Button variant="primary" onClick={() => console.log('clicked')}>
        Click Me
      </Button>
    </Card>
  )
}
```

### Viewing Demo

The component library has a comprehensive demo page showcasing all components and variants:

```bash
cd apps/web
npm run dev
# Visit http://localhost:3000/components-demo
```

## Directory Structure

```
components/
├── buttons/           # Button component (primary, secondary, tertiary, ghost)
├── cards/             # Card component (featured, standard, subtle)
├── forms/             # Input component (text, email, password, etc.)
├── feedback/          # Badge and Progress components
├── states/            # EmptyState, ErrorState, LoadingSkeleton
├── COMPONENT_LIBRARY.md # Complete documentation
└── README.md          # This file
```

## Components at a Glance

### Button
- **Variants:** primary, secondary, tertiary, ghost
- **Sizes:** sm, md, lg
- **States:** default, hover, active, disabled, loading
- **Uses:** Sacred orange primary color, smooth transitions

### Card
- **Variants:** featured (15% opacity), standard (10% opacity), subtle (8% opacity)
- **Features:** Glassmorphic design, backdrop blur, interactive mode
- **Uses:** For content containers, lightweight cards

### Input
- **Types:** text, email, password, number, textarea, select
- **Features:** Labels, error messages, helper text, required indicators
- **Uses:** Forms, data entry, user input

### Badge
- **Variants:** success, error, warning, info, neutral
- **Sizes:** sm, md
- **Uses:** Status indicators, tags, labels

### Progress
- **Variants:** linear, circular
- **Features:** Auto color coding (0-25%: red, 25-50%: orange, 50-75%: blue, 75-100%: green)
- **Uses:** Progress bars, completion indicators

### EmptyState
- **Features:** Icon, heading, description, CTA button
- **Uses:** No data states, initial empty screens

### ErrorState
- **Features:** Error icon, message, retry button
- **Uses:** Error handling, failure states

### LoadingSkeleton
- **Variants:** card, text, avatar, heading
- **Features:** Animated pulse, shimmer effect
- **Uses:** Loading placeholders, skeleton screens

## Design Token Integration

All components use CSS custom properties from Phase 1:

```css
/* Colors */
--color-primary-500 through --color-primary-900
--color-success, --color-error, --color-warning, --color-info

/* Typography */
--font-size-h1 through --font-size-caption
--line-height-h1 through --line-height-caption
--font-weight-h1 through --font-weight-body-sm

/* Spacing */
--spacing-xs (4px) through --spacing-4xl (64px)

/* Effects */
--shadow-sm through --shadow-xl
--shadow-glass-sm through --shadow-glass-lg
--transition-fast through --transition-slowest

/* Borders */
--border-radius-sm through --border-radius-full
--border-color-light through --border-color-strong
```

## Accessibility Features

All components include:

- ✅ **Semantic HTML** - Proper heading, button, label, and input elements
- ✅ **ARIA Labels** - Descriptive labels for screen readers
- ✅ **Keyboard Navigation** - Full tab and enter key support
- ✅ **Focus Management** - Visible focus indicators (2px outline)
- ✅ **Color Contrast** - WCAG 2.1 AA compliance
- ✅ **Motion** - Respects `prefers-reduced-motion`
- ✅ **Error Handling** - Proper error announcements
- ✅ **Reduced Motion** - Disables animations when preferred

## Responsive Design

All components are mobile-first and tested at:
- **Mobile:** 320px minimum
- **Tablet:** 640px
- **Desktop:** 1024px+

## Styling Architecture

### CSS Modules
Each component uses CSS Modules for style isolation:

```tsx
// Components/buttons/Button.tsx
import styles from './Button.module.css'

<button className={styles.button} />
```

### Design Tokens
All styles reference CSS custom properties:

```css
/* Components/buttons/Button.module.css */
.button {
  background-color: var(--color-primary-500);
  padding: var(--spacing-lg);
  border-radius: var(--border-radius-md);
  transition: all var(--transition-base);
}
```

## TypeScript Support

All components are fully typed:

```tsx
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  children: ReactNode
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(...)
```

## State Management

Components are "uncontrolled" by default - they manage their own visual states (hover, focus, active) but accept controlled props:

```tsx
// Controlled input
const [value, setValue] = useState('')
<Input value={value} onChange={(e) => setValue(e.currentTarget.value)} />

// Controlled button state
const [isLoading, setIsLoading] = useState(false)
<Button loading={isLoading} onClick={() => setIsLoading(true)}>
  Submit
</Button>
```

## Performance

Components are optimized for performance:

- **React.forwardRef** - Proper ref forwarding for DOM access
- **CSS Modules** - Isolated styles, no global conflicts
- **No Extra Re-renders** - Minimal prop dependencies
- **Lightweight** - Minimal bundle impact
- **Smooth Animations** - Using CSS transitions (GPU accelerated)

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

Requirements:
- CSS Custom Properties (CSS Variables)
- CSS Grid
- SVG (for circular progress)
- CSS Backdrop Filter

## Customization

### Override Styles
Use CSS to customize components:

```css
/* Custom button style */
.my-button :global(.button) {
  background-color: var(--color-error) !important;
}
```

### Change Design Tokens
Modify the root CSS variables:

```css
:root {
  --color-primary-500: #your-color;
  --spacing-lg: 1.25rem;
}
```

## Common Patterns

### Form with Validation
```tsx
const [email, setEmail] = useState('')
const [error, setError] = useState<string>()

const handleSubmit = () => {
  if (!email.includes('@')) {
    setError('Invalid email')
    return
  }
  setError(undefined)
  // submit...
}

<Input
  label="Email"
  type="email"
  value={email}
  onChange={(e) => setEmail(e.currentTarget.value)}
  error={error}
  required
/>
<Button onClick={handleSubmit}>Submit</Button>
```

### Card Grid
```tsx
<div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 'var(--spacing-lg)' }}>
  {items.map(item => (
    <Card key={item.id} variant="standard">
      <h3>{item.name}</h3>
      <p>{item.description}</p>
    </Card>
  ))}
</div>
```

### Loading State
```tsx
const [loading, setLoading] = useState(true)
const [data, setData] = useState(null)

useEffect(() => {
  fetch('/api/data')
    .then(r => r.json())
    .then(d => { setData(d); setLoading(false) })
}, [])

return loading ? (
  <LoadingSkeleton variant="card" count={3} />
) : (
  <div>{data}</div>
)
```

## Documentation

- **COMPONENT_LIBRARY.md** - Complete component reference
- **Individual JSDoc comments** - In each component file
- **/components-demo** - Interactive showcase
- **PHASE2_SUMMARY.md** - Implementation details

## Contributing

When adding new components:

1. Create component structure: `ComponentName.tsx`, `ComponentName.module.css`, `index.ts`
2. Use design tokens for all styling
3. Add TypeScript types with proper interfaces
4. Include accessibility features (ARIA, keyboard, focus)
5. Add JSDoc comments
6. Test responsive design (320px, 640px, 1024px)
7. Build with `pnpm build` - must succeed with no errors
8. Add demo to `/components-demo/page.tsx`

## Phase 3 Integration

These components are ready for Phase 3 page integration:
- Dashboard page
- History page
- Settings page
- Delegation pages
- Form pages

Components can be dropped in as replacements for existing UI.

## FAQ

**Q: How do I change a component's appearance?**
A: Use CSS custom properties or override styles in your component's CSS.

**Q: Can I use components with Redux?**
A: Yes! Use controlled props with Redux-managed state.

**Q: How do I make custom components?**
A: Build on top of core components or use them as examples.

**Q: Are components mobile-friendly?**
A: Yes, all components are mobile-first and responsive.

**Q: What about dark mode?**
A: All components are designed for dark mode. Light mode support is optional.

---

**Last Updated:** June 3, 2026
**Status:** Production Ready
**Phase:** 2 (Complete)
