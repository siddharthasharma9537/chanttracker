# ChantTracker Design System - Phase 1: Core Design Tokens

## Overview

This document describes all available design tokens in the ChantTracker design system. These tokens are the single source of truth for visual consistency across the entire application.

Tokens are defined as CSS custom properties (variables) in `design-tokens.css` and automatically integrated into the Tailwind configuration for seamless usage throughout the application.

---

## Color Palette

### Primary Colors: Sacred Orange

The primary color palette represents spiritual devotion and sacred significance in Hindu practice. Sacred Orange is used for primary actions, highlights, and key interactive elements.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-primary-50` | `#fff7ed` | Lightest backgrounds, disabled states |
| `--color-primary-100` | `#ffedd5` | Very light backgrounds |
| `--color-primary-200` | `#fed7aa` | Light hover states |
| `--color-primary-300` | `#fdba74` | Light accents |
| `--color-primary-400` | `#fb923c` | Medium accents |
| `--color-primary-500` | `#f59e0b` | **Main primary color** - Use for primary buttons, key UI elements |
| `--color-primary-600` | `#d97706` | Hover state for primary buttons |
| `--color-primary-700` | `#b45309` | Active/pressed state |
| `--color-primary-800` | `#92400e` | Dark emphasis |
| `--color-primary-900` | `#78350f` | Darkest variant |

**Tailwind Usage:**
```html
<!-- Primary button -->
<button class="bg-primary-500 hover:bg-primary-600">Start Chanting</button>

<!-- Primary text -->
<span class="text-primary-500">Sacred Orange</span>

<!-- Tailwind CSS variable access -->
<div class="border-2 border-primary-300">Accent border</div>
```

**CSS Usage:**
```css
.sacred-button {
  background-color: var(--color-primary-500);
  color: var(--color-white-full);
}

.sacred-button:hover {
  background-color: var(--color-primary-600);
}
```

### Secondary Colors: Accent Red-Orange

Secondary colors are used for emphasis, warnings, and secondary actions.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-secondary-500` | `#dc2626` | Main secondary color - errors, urgent actions |
| `--color-secondary-600` | `#b91c1c` | Hover state |
| `--color-secondary-700` | `#991b1b` | Active/pressed state |

**Tailwind Usage:**
```html
<button class="bg-secondary-500">Delete Action</button>
<span class="text-secondary-600">Error message</span>
```

### Background Colors

Dark spiritual base colors for the app's background and layered components.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-background-base` | `#1a2332` | Deep spiritual navy base |
| `--color-background-50` | `#f8f8f8` | Very light backgrounds (light mode) |
| `--color-background-100` | `#e8e8e8` | Light backgrounds |
| `--color-background-900` | `#1a202c` | Darkest backgrounds |

### White Opacity Variants

For glassmorphic layering and transparency effects.

| Token | Value | Usage |
|-------|-------|-------|
| `--color-white-full` | `#ffffff` | Full white text/elements |
| `--color-white-70` | `rgba(255,255,255,0.7)` | Primary text, glass layers |
| `--color-white-60` | `rgba(255,255,255,0.6)` | Secondary text |
| `--color-white-50` | `rgba(255,255,255,0.5)` | Tertiary text |
| `--color-white-40` | `rgba(255,255,255,0.4)` | Disabled text, subtle accents |

**Glassmorphic Card Example:**
```html
<div class="bg-white/5 backdrop-blur-lg border border-white/15">
  <!-- Content with proper opacity hierarchy -->
  <h2 class="text-white">Title</h2>
  <p class="text-white/60">Secondary information</p>
  <span class="text-white/40">Disabled content</span>
</div>
```

### Semantic Colors

Colors with specific meanings for user feedback and status indication.

#### Success - Emerald
| Token | Value | Usage |
|-------|-------|-------|
| `--color-success-light` | `#6ee7b7` | Light success backgrounds |
| `--color-success` | `#10b981` | Main success color |
| `--color-success-dark` | `#059669` | Dark success variant |

**Usage:**
```html
<div class="bg-success/10 text-success">
  Session completed successfully!
</div>
```

#### Error - Red
| Token | Value | Usage |
|-------|-------|-------|
| `--color-error-light` | `#fca5a5` | Light error backgrounds |
| `--color-error` | `#ef4444` | Main error color |
| `--color-error-dark` | `#dc2626` | Dark error variant |

#### Warning - Amber
| Token | Value | Usage |
|-------|-------|-------|
| `--color-warning-light` | `#fcd34d` | Light warning backgrounds |
| `--color-warning` | `#f59e0b` | Main warning color |
| `--color-warning-dark` | `#d97706` | Dark warning variant |

#### Info - Blue
| Token | Value | Usage |
|-------|-------|-------|
| `--color-info-light` | `#93c5fd` | Light info backgrounds |
| `--color-info` | `#3b82f6` | Main info color |
| `--color-info-dark` | `#1d4ed8` | Dark info variant |

---

## Typography Scale

Consistent typography hierarchy for all text elements.

### Heading 1 (Page Titles)
```
Size: 3.5rem (56px)
Weight: 700 (Bold)
Line Height: 1.2
Letter Spacing: -0.02em
```

**CSS Usage:**
```css
h1 {
  font-size: var(--font-size-h1);
  font-weight: var(--font-weight-h1);
  line-height: var(--line-height-h1);
  letter-spacing: var(--letter-spacing-h1);
}
```

**Tailwind Usage:**
```html
<h1 class="text-h1">Welcome to ChantTracker</h1>
```

### Heading 2 (Section Headers)
```
Size: 2.25rem (36px)
Weight: 700 (Bold)
Line Height: 1.3
Letter Spacing: -0.015em
```

### Heading 3 (Subsection Headers)
```
Size: 1.875rem (30px)
Weight: 600 (Semi-bold)
Line Height: 1.4
Letter Spacing: -0.01em
```

### Heading 4 (Card Titles)
```
Size: 1.5rem (24px)
Weight: 600 (Semi-bold)
Line Height: 1.4
Letter Spacing: 0
```

### Body Text (Main Reading)
```
Size: 1rem (16px)
Weight: 400 (Regular)
Line Height: 1.6
Letter Spacing: 0
```

**Tailwind Usage:**
```html
<p class="text-body">This is body text with comfortable reading line height.</p>
```

### Body Small (Secondary Text)
```
Size: 0.875rem (14px)
Weight: 400 (Regular)
Line Height: 1.5
Letter Spacing: 0
```

**Tailwind Usage:**
```html
<p class="text-sm">This is secondary text.</p>
```

### Caption/Extra Small
```
Size: 0.75rem (12px)
Weight: 500 (Medium)
Line Height: 1.4
Letter Spacing: 0.02em
```

**Tailwind Usage:**
```html
<span class="text-xs">Label or caption</span>
```

### Font Families

| Token | Fonts | Usage |
|-------|-------|-------|
| `--font-serif` | Merriweather, Georgia, serif | Default body text, elegant headings |
| `--font-devanagari` | Noto Sans Devanagari, Tiro Devanagari Sanskrit | Hindi/Sanskrit text in mantras |
| `--font-telugu` | Noto Sans Telugu, system-ui | Telugu text |
| `--font-sanskrit` | Tiro Devanagari Sanskrit | Sanskrit mantras, religious text |
| `--font-system` | system-ui, -apple-system, sans-serif | UI elements, labels |

---

## Spacing System

Base unit: 4px. All spacing values are multiples of 4 for rhythmic consistency.

| Token | Size | Usage |
|-------|------|-------|
| `--spacing-xs` | 0.25rem (4px) | Micro spacing within components |
| `--spacing-sm` | 0.5rem (8px) | Small gaps between elements |
| `--spacing-md` | 0.75rem (12px) | Standard padding |
| `--spacing-lg` | 1rem (16px) | Default spacing, paragraph margins |
| `--spacing-xl` | 1.5rem (24px) | Large gaps, section spacing |
| `--spacing-2xl` | 2rem (32px) | Major section spacing |
| `--spacing-3xl` | 3rem (48px) | Large section breaks |
| `--spacing-4xl` | 4rem (64px) | Page-level spacing |

**Tailwind Usage:**
```html
<!-- Padding -->
<div class="p-lg">Standard padding</div>
<div class="px-xl py-md">Custom padding per side</div>

<!-- Margin -->
<div class="m-lg">Standard margin</div>
<div class="mb-2xl">Bottom margin</div>

<!-- Gap (flexbox/grid) -->
<div class="flex gap-md">Elements with 12px gap</div>
<div class="grid gap-lg">Grid with 16px gap</div>
```

**CSS Usage:**
```css
.card {
  padding: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.button-group {
  gap: var(--spacing-md);
}
```

---

## Border Radius System

Rounded corner values for consistent corner treatments.

| Token | Size | Usage |
|-------|------|-------|
| `--border-radius-sm` | 0.375rem (6px) | Subtle corners, small components |
| `--border-radius-md` | 0.5rem (8px) | Standard corners, buttons |
| `--border-radius-lg` | 0.75rem (12px) | Cards, containers |
| `--border-radius-xl` | 1rem (16px) | Large cards, modals |
| `--border-radius-2xl` | 1.5rem (24px) | Very rounded cards |
| `--border-radius-full` | 9999px | Pills, circles |

**Tailwind Usage:**
```html
<button class="rounded-md">Standard button</button>
<div class="rounded-xl">Large card</div>
<div class="rounded-full h-10 w-10">Avatar circle</div>
```

**CSS Usage:**
```css
.button {
  border-radius: var(--border-radius-md);
}

.card {
  border-radius: var(--border-radius-xl);
}
```

---

## Shadow & Elevation System

Shadows define depth and hierarchy through elevation levels.

### Elevation Levels

| Token | Usage |
|-------|-------|
| `--shadow-sm` | Subtle elevation - form inputs, small cards |
| `--shadow-md` | Standard elevation - floating elements, tooltips |
| `--shadow-lg` | Prominent elevation - modals, dialog boxes |
| `--shadow-xl` | Deep elevation - dropdowns, menus |

### Glassmorphic Shadows

Sacred orange-tinted glows for glass-morphic components:

| Token | Value | Usage |
|-------|-------|-------|
| `--shadow-glass-sm` | `0 0 20px rgba(245,158,11,0.1)` | Subtle glow |
| `--shadow-glass-md` | `0 0 30px rgba(245,158,11,0.15)` | Medium glow |
| `--shadow-glass-lg` | `0 0 40px rgba(245,158,11,0.2)` | Strong glow |

**Tailwind Usage:**
```html
<input class="shadow-md">Standard input</input>
<div class="shadow-lg">Modal dialog</div>
<div class="shadow-glass-md">Glassmorphic card</div>
```

**CSS Usage:**
```css
.button {
  box-shadow: var(--shadow-md);
}

.button:hover {
  box-shadow: var(--shadow-lg);
}

.glass-card {
  box-shadow: var(--shadow-glass-md);
}
```

---

## Transitions & Animation

Timing values for consistent interaction feedback.

| Token | Duration | Usage |
|-------|----------|-------|
| `--transition-fast` | 150ms | Quick hover states, toggles |
| `--transition-base` | 300ms | Standard buttons, form inputs |
| `--transition-slow` | 500ms | Modal entrance, complex animations |
| `--transition-slowest` | 800ms | Dramatic effects, page transitions |

### Easing Functions

| Token | Timing | Usage |
|-------|--------|-------|
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements entering/appearing |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements exiting/disappearing |
| `--ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Back-and-forth animations |
| `--ease-linear` | `linear` | Continuous movements |

**CSS Usage:**
```css
.button {
  transition: background-color var(--transition-base) var(--ease-in-out);
}

.button:hover {
  background-color: var(--color-primary-600);
}

.modal {
  animation: slideIn var(--transition-slow) var(--ease-out);
}

@keyframes slideIn {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

**Tailwind Usage:**
```html
<button class="duration-base ease-in-out hover:bg-primary-600">
  Interactive button
</button>
```

**Accessibility Note:** Respects `prefers-reduced-motion` - all transitions are disabled if the user has enabled reduced motion in their system settings.

---

## Border System

Border styling tokens for consistent outlines and separators.

| Token | Value | Usage |
|-------|-------|-------|
| `--border-width-thin` | 1px | Standard borders, separators |
| `--border-width-md` | 2px | Emphasized borders |
| `--border-width-thick` | 4px | Strong emphasis |
| `--border-color-light` | `rgba(255,255,255,0.15)` | Subtle separators |
| `--border-color-medium` | `rgba(255,255,255,0.25)` | Standard borders |
| `--border-color-strong` | `rgba(255,255,255,0.4)` | Emphasized borders |

**CSS Usage:**
```css
.card {
  border: var(--border-width-thin) solid var(--border-color-medium);
  border-radius: var(--border-radius-xl);
}

.input:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
}
```

---

## Component Sizing

Predefined sizes for common interactive elements.

| Token | Size | Usage |
|-------|------|-------|
| `--button-height-sm` | 2rem (32px) | Small buttons |
| `--button-height-md` | 2.5rem (40px) | Standard buttons |
| `--button-height-lg` | 3rem (48px) | Large buttons, mobile |
| `--input-height` | 2.5rem (40px) | Standard form inputs |
| `--input-height-lg` | 3rem (48px) | Large form inputs |
| `--icon-size-sm` | 1rem (16px) | Inline icons |
| `--icon-size-md` | 1.5rem (24px) | Standard icons |
| `--icon-size-lg` | 2rem (32px) | Large icons |
| `--icon-size-xl` | 3rem (48px) | Extra large icons |

**Tailwind Usage:**
```html
<button class="h-[var(--button-height-md)]">Standard Button</button>
<input class="h-[var(--input-height)]" />
```

---

## Z-Index Scale

Layering values for modal, dropdown, and tooltip positioning.

| Token | Value | Usage |
|-------|-------|-------|
| `--z-dropdown` | 1000 | Dropdown menus |
| `--z-sticky` | 1020 | Sticky headers |
| `--z-fixed` | 1030 | Fixed navigation |
| `--z-modal-backdrop` | 1040 | Modal dark overlay |
| `--z-modal` | 1050 | Modal dialog boxes |
| `--z-popover` | 1060 | Popovers, floating UI |
| `--z-tooltip` | 1070 | Tooltips (highest) |

**CSS Usage:**
```css
.modal-backdrop {
  z-index: var(--z-modal-backdrop);
}

.modal {
  z-index: var(--z-modal);
}

.tooltip {
  z-index: var(--z-tooltip);
}
```

---

## Breakpoints

Responsive design breakpoints for media queries.

| Token | Size | CSS |
|-------|------|-----|
| `--breakpoint-sm` | 640px | `@media (min-width: 640px)` |
| `--breakpoint-md` | 768px | `@media (min-width: 768px)` |
| `--breakpoint-lg` | 1024px | `@media (min-width: 1024px)` |
| `--breakpoint-xl` | 1280px | `@media (min-width: 1280px)` |
| `--breakpoint-2xl` | 1536px | `@media (min-width: 1536px)` |

**CSS Usage:**
```css
@media (min-width: var(--breakpoint-md)) {
  .container {
    padding: var(--spacing-2xl);
  }
}
```

---

## Accessibility Considerations

### Reduced Motion

Users who prefer reduced motion will have all transitions and animations disabled automatically:

```css
@media (prefers-reduced-motion: reduce) {
  /* All transitions become instant (0ms) */
}
```

### High Contrast Mode

Enhanced colors for users who prefer higher contrast:

```css
@media (prefers-contrast: more) {
  /* Darker primary color, less transparency */
}
```

### Color Scheme Preference

The design system supports both dark and light color schemes:

```css
@media (prefers-color-scheme: dark) {
  /* Current default - dark theme */
}

@media (prefers-color-scheme: light) {
  /* Light theme variant */
}
```

---

## Implementation Examples

### Complete Button Component

```html
<button class="
  bg-primary-500
  text-white
  px-lg py-md
  rounded-md
  font-bold
  shadow-md
  transition-all
  duration-base
  ease-in-out
  hover:bg-primary-600
  hover:shadow-lg
  active:scale-95
">
  Click me
</button>
```

### Complete Card Component

```html
<div class="
  bg-white/5
  backdrop-blur-lg
  border border-white/15
  rounded-xl
  p-xl
  shadow-lg
  hover:shadow-glass-md
  transition-shadow
  duration-base
">
  <h3 class="text-h4 mb-md">Card Title</h3>
  <p class="text-body text-white/60">Card description text</p>
</div>
```

### Complete Input Component

```html
<input
  type="text"
  placeholder="Enter text..."
  class="
  w-full
  h-[var(--input-height)]
  bg-white/5
  border border-white/15
  rounded-md
  px-lg
  text-white
  placeholder-white/40
  transition-colors
  duration-fast
  ease-in-out
  focus:border-primary-500
  focus:outline-none
  focus:ring-2
  focus:ring-primary-500/20
"
/>
```

---

## Design Token Usage Guidelines

1. **Always use tokens** instead of hardcoding colors, sizes, or spacing values
2. **Prefer Tailwind utilities** when available (e.g., `bg-primary-500` instead of inline styles)
3. **Use CSS variables** for dynamic theming or complex calculations
4. **Maintain consistency** by following the semantic naming conventions
5. **Test accessibility** - ensure sufficient color contrast and respect motion preferences
6. **Document custom deviations** if you must deviate from the token system

---

## Future Enhancements

This Phase 1 design system provides the foundation for:

- **Phase 2:** Reusable component library built on these tokens
- **Phase 3:** Page-level design improvements using token-based components
- **Phase 4:** Micro-interactions and polish with advanced animations

Future phases will not deviate from these tokens but will add specialized component tokens for buttons, forms, cards, and other UI patterns.
