# Design Tokens Quick Reference

Quick lookup guide for common design token usage patterns.

## Colors - Most Used

```css
/* Primary Sacred Orange */
background-color: var(--color-primary-500);    /* Main action color */
background-color: var(--color-primary-600);    /* Hover state */
background-color: var(--color-primary-700);    /* Active state */

/* Text Layers */
color: var(--color-white-full);                /* Full opacity text */
color: var(--color-white-70);                  /* Primary text */
color: var(--color-white-60);                  /* Secondary text */
color: var(--color-white-50);                  /* Tertiary text */
color: var(--color-white-40);                  /* Disabled text */

/* Semantic */
color: var(--color-success);                   /* Success messages */
color: var(--color-error);                     /* Error messages */
color: var(--color-warning);                   /* Warning messages */
color: var(--color-info);                      /* Info messages */
```

## Spacing - Most Used

```css
/* Padding/Margin */
padding: var(--spacing-lg);                    /* 16px standard */
padding: var(--spacing-xl);                    /* 24px larger sections */
margin-bottom: var(--spacing-md);              /* 12px small gaps */

/* Gap in Flexbox/Grid */
gap: var(--spacing-md);                        /* 12px between items */
gap: var(--spacing-lg);                        /* 16px between items */
```

## Typography - Most Used

```html
<h1 class="text-h1">Page Title</h1>           <!-- 56px, bold -->
<h2 class="text-h2">Section Title</h2>         <!-- 36px, bold -->
<h3 class="text-h3">Subsection</h3>            <!-- 30px, semi-bold -->
<h4 class="text-h4">Card Title</h4>            <!-- 24px, semi-bold -->
<p class="text-body">Body text</p>             <!-- 16px, regular -->
<p class="text-sm">Secondary text</p>           <!-- 14px, regular -->
<span class="text-xs">Label</span>             <!-- 12px, medium -->
```

## Shadows - Most Used

```css
box-shadow: var(--shadow-md);                  /* Standard floating elements */
box-shadow: var(--shadow-lg);                  /* Modals, emphasized cards */
box-shadow: var(--shadow-glass-md);            /* Glassmorphic glow effect */
```

## Border Radius - Most Used

```css
border-radius: var(--border-radius-md);        /* 8px standard buttons */
border-radius: var(--border-radius-lg);        /* 12px cards */
border-radius: var(--border-radius-xl);        /* 16px large cards */
border-radius: var(--border-radius-full);      /* Pills & circles */
```

## Transitions - Most Used

```css
transition: all var(--transition-base) var(--ease-in-out);  /* Standard */
transition: background-color var(--transition-fast) var(--ease-out);
transition: transform var(--transition-slow) var(--ease-in-out);
```

## Tailwind Shortcuts

```html
<!-- Background color -->
<div class="bg-primary-500">Primary action</div>
<div class="bg-success">Success state</div>

<!-- Text color -->
<p class="text-white">Full white</p>
<p class="text-white/60">Secondary text</p>

<!-- Padding & Margin -->
<div class="p-lg">Padding</div>
<div class="m-xl">Margin</div>
<div class="gap-md">Gap</div>

<!-- Border Radius -->
<div class="rounded-md">Button corners</div>
<div class="rounded-xl">Card corners</div>

<!-- Shadow -->
<div class="shadow-md">Standard shadow</div>
<div class="shadow-lg">Elevated shadow</div>

<!-- Typography -->
<h1 class="text-h1">Heading 1</h1>
<p class="text-body">Body text</p>

<!-- Transitions -->
<button class="duration-base ease-in-out hover:bg-primary-600">
  Button
</button>
```

## Common Patterns

### Button
```html
<button class="
  bg-primary-500
  hover:bg-primary-600
  active:scale-95
  text-white
  px-lg py-md
  rounded-md
  transition-all
  duration-base
  shadow-md
">
  Action
</button>
```

### Card
```html
<div class="
  bg-white/5
  backdrop-blur-lg
  border border-white/15
  rounded-xl
  p-xl
  shadow-lg
">
  Content
</div>
```

### Input Field
```html
<input class="
  bg-white/5
  border border-white/15
  rounded-md
  px-lg py-md
  text-white
  placeholder-white/40
  focus:border-primary-500
  focus:ring-2
  focus:ring-primary-500/20
" />
```

### Overlay Text Hierarchy
```html
<h3 class="text-h4 text-white mb-lg">Title</h3>
<p class="text-body text-white/70 mb-md">Primary text</p>
<p class="text-sm text-white/50">Secondary text</p>
<span class="text-xs text-white/40">Tertiary</span>
```

## When to Use What

| Pattern | Token Family | Use Case |
|---------|--------------|----------|
| Sacred Orange | Primary colors (50-900) | Primary actions, highlights, CTAs |
| Red-Orange | Secondary colors | Errors, urgency, destructive actions |
| White opacity | White (full, 70, 60, 50, 40) | Text hierarchy in dark UI |
| Semantic colors | success, error, warning, info | Status feedback, alerts |
| Spacing | spacing-xs through spacing-4xl | Padding, margins, gaps |
| Typography scale | text-h1 through text-xs | Consistent text hierarchy |
| Shadows | shadow-sm through shadow-xl | Depth and elevation |
| Border radius | border-radius-sm through full | Corners and pill buttons |
| Transitions | transition-fast through slowest | Interactive feedback |

## File Locations

- **Token Definitions:** `/apps/web/src/styles/design-tokens.css`
- **Full Documentation:** `/apps/web/src/styles/DESIGN_TOKENS.md`
- **Imports:** Included automatically in `/apps/web/src/styles/globals.css`
- **Tailwind Config:** `/apps/web/tailwind.config.ts`

## Color Reference Sheet

```
Primary (Sacred Orange):
  50: #fff7ed    100: #ffedd5   200: #fed7aa   300: #fdba74
  400: #fb923c   500: #f59e0b   600: #d97706   700: #b45309
  800: #92400e   900: #78350f

Secondary (Accent Red):
  500: #dc2626   600: #b91c1c   700: #991b1b

Semantic:
  Success: #10b981   Error: #ef4444   Warning: #f59e0b   Info: #3b82f6

White Opacity:
  full: #ffffff    70: rgba(255,255,255,0.7)    60: rgba(255,255,255,0.6)
  50: rgba(255,255,255,0.5)    40: rgba(255,255,255,0.4)
```

## Typography Reference Sheet

```
H1: 56px, weight 700, line-height 1.2
H2: 36px, weight 700, line-height 1.3
H3: 30px, weight 600, line-height 1.4
H4: 24px, weight 600, line-height 1.4
Body: 16px, weight 400, line-height 1.6
Small: 14px, weight 400, line-height 1.5
Caption: 12px, weight 500, line-height 1.4
```

## Spacing Reference Sheet

```
xs: 4px       sm: 8px       md: 12px      lg: 16px
xl: 24px      2xl: 32px     3xl: 48px     4xl: 64px
```

## Accessibility Notes

- Respects `prefers-reduced-motion` - all transitions disabled if user preference set
- Respects `prefers-contrast: more` - uses darker colors and reduced opacity
- Respects `prefers-color-scheme` - supports both dark and light modes
- All semantic colors meet WCAG AA contrast ratios for accessibility

---

For complete documentation, see `DESIGN_TOKENS.md` in this directory.
