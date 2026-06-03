# ChantTracker Component Library

## Phase 2: Reusable Component Library

This document describes the core components available in the ChantTracker design system.

### Overview

The component library is organized into 5 categories:

- **Buttons** - User interaction and call-to-action elements
- **Cards** - Content containers with glassmorphic styling
- **Forms** - Input fields with various types and states
- **Feedback** - Badges, progress indicators, and status displays
- **States** - Empty states, error states, and loading states

All components use design tokens from Phase 1 (CSS custom properties) for consistent styling.

---

## Button Component

**Location:** `/components/buttons/Button.tsx`

**Variants:** primary, secondary, tertiary, ghost

**Sizes:** sm, md, lg

**Features:**
- 4 semantic variants with appropriate color coding
- 3 size options for different contexts
- Loading state with animated spinner
- Disabled state with proper visual feedback
- Full keyboard navigation support
- Smooth transitions and hover effects

### Usage

```tsx
import { Button } from '@/components/buttons'

<Button variant="primary" size="md">Click me</Button>
<Button variant="secondary" disabled>Disabled</Button>
<Button variant="ghost" loading>Loading...</Button>
```

### Props

- `variant?: 'primary' | 'secondary' | 'tertiary' | 'ghost'` - Default: 'primary'
- `size?: 'sm' | 'md' | 'lg'` - Default: 'md'
- `disabled?: boolean` - Disable the button
- `loading?: boolean` - Show loading state
- `onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void`
- Standard HTMLButtonElement attributes

---

## Card Component

**Location:** `/components/cards/Card.tsx`

**Variants:** featured, standard, subtle

**Features:**
- Glassmorphic design with backdrop blur
- 3 opacity variants for visual hierarchy
- Smooth hover effects with elevation change
- Interactive mode with click handling
- Responsive padding and border radius

### Usage

```tsx
import { Card } from '@/components/cards'

<Card variant="featured">
  <h3>Featured Content</h3>
  <p>This is a featured card with maximum opacity</p>
</Card>

<Card variant="standard" interactive>
  Clickable card
</Card>
```

### Props

- `variant?: 'featured' | 'standard' | 'subtle'` - Default: 'standard'
- `interactive?: boolean` - Adds click styling
- Standard HTMLDivElement attributes

---

## Input Component

**Location:** `/components/forms/Input.tsx`

**Types:** text, email, password, number, textarea, select

**Features:**
- Semantic form fields with proper labeling
- Error states with validation messages
- Helper text support
- Required field indicators
- Disabled state support
- Focus management and accessibility
- Smooth transitions and blur effects

### Usage

```tsx
import { Input } from '@/components/forms'

<Input
  label="Email"
  type="email"
  placeholder="your@email.com"
  helperText="We'll never share your email"
/>

<Input
  label="Password"
  type="password"
  error="Password is required"
/>

<Input
  label="Message"
  type="textarea"
  rows={4}
/>

<Input
  label="Select Option"
  type="select"
  value={selected}
  onChange={(e) => setSelected(e.currentTarget.value)}
>
  <option value="1">Option 1</option>
  <option value="2">Option 2</option>
</Input>
```

### Props

- `label?: string` - Field label
- `error?: string` - Error message
- `helperText?: string` - Helper text below field
- `disabled?: boolean`
- `required?: boolean`
- `type?: 'text' | 'email' | 'password' | 'number' | 'textarea' | 'select'` - Default: 'text'
- Standard input attributes (placeholder, value, onChange, etc.)

---

## Badge Component

**Location:** `/components/feedback/Badge.tsx`

**Variants:** success, error, warning, info, neutral

**Sizes:** sm, md

**Features:**
- 5 semantic variants with color coding
- 2 size options
- Lightweight and inline
- Proper color contrast for accessibility
- Perfect for status indicators and tags

### Usage

```tsx
import { Badge } from '@/components/feedback'

<Badge variant="success">Active</Badge>
<Badge variant="error" size="sm">Failed</Badge>
<Badge variant="warning">Warning</Badge>
```

### Props

- `variant?: 'success' | 'error' | 'warning' | 'info' | 'neutral'` - Default: 'neutral'
- `size?: 'sm' | 'md'` - Default: 'md'
- Standard HTMLSpanElement attributes

---

## Progress Component

**Location:** `/components/feedback/Progress.tsx`

**Variants:** linear, circular

**Sizes:** sm, md, lg

**Color Coding:**
- 0-25%: Red (error)
- 25-50%: Orange (warning)
- 50-75%: Blue (info)
- 75-100%: Green (success)

**Features:**
- Linear progress bars for sequential progress
- Circular progress for status displays
- Automatic color coding by percentage
- Optional labels
- Smooth animations
- Responsive sizing

### Usage

```tsx
import { Progress } from '@/components/feedback'

<Progress variant="linear" value={65} showLabel />
<Progress variant="circular" value={45} size="md" />
<Progress variant="linear" value={100} label="Complete" />
```

### Props

- `value: number` - Progress value (0-100)
- `variant?: 'linear' | 'circular'` - Default: 'linear'
- `size?: 'sm' | 'md' | 'lg'` - Default: 'md'
- `label?: string` - Custom label text
- `showLabel?: boolean` - Show percentage - Default: true
- Standard HTMLDivElement attributes

---

## EmptyState Component

**Location:** `/components/states/EmptyState.tsx`

**Features:**
- Icon/visual element support
- Clear heading and description
- Optional call-to-action button
- Centered layout
- Perfect for empty data states

### Usage

```tsx
import { EmptyState } from '@/components/states'

<EmptyState
  icon="📚"
  heading="No mantras yet"
  description="Start by adding a new mantra to your practice"
  ctaLabel="Add Mantra"
  onCTA={() => navigate('/add')}
/>
```

### Props

- `icon?: ReactNode` - Icon or visual element
- `heading: string` - Main heading
- `description: string` - Description text
- `ctaLabel?: string` - CTA button label
- `onCTA?: () => void` - CTA click handler
- `className?: string`

---

## ErrorState Component

**Location:** `/components/states/ErrorState.tsx`

**Features:**
- Error icon/visual
- Clear error message
- Optional detailed error information
- Retry button support
- Centered layout

### Usage

```tsx
import { ErrorState } from '@/components/states'

<ErrorState
  message="Failed to load mantras"
  details="Please check your connection and try again"
  onRetry={() => refetch()}
/>
```

### Props

- `icon?: ReactNode` - Error icon (defaults to ⚠️)
- `message: string` - Error message
- `details?: string` - Detailed error information
- `onRetry?: () => void` - Retry handler
- `className?: string`

---

## LoadingSkeleton Component

**Location:** `/components/states/LoadingSkeleton.tsx`

**Variants:** card, text, avatar, heading

**Features:**
- Multiple skeleton variants
- Animated pulse effect
- Shimmer animation for depth
- Respects prefers-reduced-motion
- Lightweight placeholders

### Usage

```tsx
import { LoadingSkeleton } from '@/components/states'

<LoadingSkeleton variant="card" count={3} />
<LoadingSkeleton variant="text" count={5} />
<LoadingSkeleton variant="avatar" count={2} />
```

### Props

- `variant?: 'card' | 'text' | 'avatar' | 'heading'` - Default: 'text'
- `count?: number` - Number of skeleton items - Default: 1
- `className?: string`

---

## Component Demo Page

Access the component showcase at `/components-demo`:

```bash
npm run dev
# Visit http://localhost:3000/components-demo
```

This page demonstrates all components with their variants and states.

---

## Accessibility

All components include:

- Proper semantic HTML
- ARIA labels and descriptions
- Keyboard navigation support
- Focus management
- Color contrast compliance (WCAG 2.1 AA)
- Reduced motion support
- Screen reader announcements for states

---

## Design Tokens Integration

Components use CSS custom properties from `design-tokens.css`:

- **Colors:** `--color-primary-*`, `--color-success`, `--color-error`, etc.
- **Typography:** `--font-size-*`, `--line-height-*`, `--font-weight-*`
- **Spacing:** `--spacing-xs` through `--spacing-4xl`
- **Shadows:** `--shadow-sm` through `--shadow-xl`
- **Transitions:** `--transition-fast`, `--transition-base`, `--transition-slow`
- **Border Radius:** `--border-radius-sm` through `--border-radius-full`

To customize component appearance, modify the CSS custom properties in your root CSS or override individual component styles.

---

## Component Architecture

Each component follows this structure:

```
/component-name/
  ├── ComponentName.tsx        # Main component with TypeScript
  ├── ComponentName.module.css # Styles using design tokens
  └── index.ts                 # Named exports
```

This ensures:
- Clean separation of concerns
- Easy styling customization
- CSS module isolation
- Proper TypeScript support

---

## Future Enhancements

Phase 3 will integrate these components into pages for:
- Better data context and state management
- Enhanced animations and micro-interactions
- Form validation and submission
- Responsive breakpoint testing
- Component composition patterns

---

## Questions?

Refer to individual component files for detailed JSDoc comments and prop definitions.
