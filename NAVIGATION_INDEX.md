# ChantTracker Navigation & Workflows - Complete Index

## Overview

ChantTracker is fully documented with comprehensive screen workflow mapping, user journey documentation, and navigation audits. All routes are implemented, tested, and working correctly.

**Status:** ✅ All 7 routes implemented, 19 navigation links verified, 0 broken links found.

---

## Documentation Files

### 1. SCREEN_WORKFLOW.md (14 KB)
**Best for:** Understanding the complete app structure at a glance

Contents:
- Screen map & routes (visual tree)
- Navigation structure (desktop sidebar vs mobile bottom nav)
- 3 detailed user journeys (signup, daily session, settings)
- Auth flow & guards
- State dependencies & data flow
- Entry & exit points
- Known issues & recommendations
- Screen summary table
- Accessibility notes
- Theme & color system

**Start here** if you're new to the codebase and want a complete overview.

---

### 2. SCREEN_FLOWCHART.txt (30 KB)
**Best for:** Visual diagram lovers who prefer ASCII art flowcharts

Contents:
- Entry points & auth flow (visual flowchart)
- Protected screens navigation (visual map)
- Chant counter flow (detailed step-by-step)
- Settings flow (detailed step-by-step)
- Mobile vs desktop layout differences
- Deep route protection pattern
- API calls & data flow
- Error handling flows
- Auth state lifecycle
- All diagrams are ASCII art for easy reading in terminal/IDE

**Use this** if you need to trace a flow visually or understand the exact order of operations.

---

### 3. ROUTING_AUDIT.md (14 KB)
**Best for:** Developers auditing routes, testing navigation, verifying no broken links

Contents:
- Executive summary (✅ all routes verified)
- Route inventory & directory structure
- Route table (7 routes total)
- Navigation link verification (19 links verified)
- Auth guard implementation patterns
- Protected screens with guards
- Navigation components (Navigation.tsx, MainLayout.tsx, Header.tsx)
- State dependencies
- Route transitions (complete path matrix)
- Navigation components list
- Potential issues & recommendations (4 found, mostly minor)
- Navigation summary (link matrix)
- Testing checklist
- Conclusion

**Use this** for code review, testing, or ensuring all navigation works before deployment.

---

### 4. USER_JOURNEYS_VISUAL.md (19 KB)
**Best for:** Product managers, designers, QA engineers, or anyone focusing on user experience

Contents:
- Journey 1: Brand new user (signup) - complete with visual steps
- Journey 2: Existing user (daily session) - morning to completion
- Journey 3: Customize settings - preferences & profile
- Journey 4: View history - check past sessions
- Journey 5: Offline session - resilience testing
- Journey 6: Error states - how errors are handled
- Complete navigation map (quick reference)
- State machine for auth flow
- Key flows at a glance (table)

**Use this** to understand user experience, test journeys, or train support staff.

---

## Quick Reference: All Routes

```
PUBLIC (No Auth Required)
  / → redirect to /dashboard
  /auth/signin → Sign in form
  /auth/signup → Create account form

PROTECTED (Auth Required)
  /dashboard → Home screen (progress, stats, panchang)
  /chant → Counter interface (select mantra, count repetitions)
  /history → View past sessions
  /settings → User profile, preferences, account
```

---

## Quick Reference: Key Navigation Paths

### For New Users
```
/ → /dashboard → /auth/signin → /auth/signup → /dashboard
```

### For Daily Practice
```
/dashboard → /chant → [counter session] → /dashboard
```

### For Exploring App
```
/dashboard → /history (see past sessions)
/dashboard → /settings (customize)
/dashboard → /chant (practice)
```

### Sign Out
```
/settings → [Sign Out button] → /auth/signin
```

---

## Quick Reference: Navigation Components

### Desktop Layout (lg+ breakpoint)
- Fixed left sidebar (w-64)
- 4 navigation items: Dashboard, Chant, History, Settings
- User card at bottom showing email
- Active item: highlighted with temple color
- Sidebar occupies fixed space, main content scrolls

### Mobile Layout (< lg breakpoint)
- Fixed bottom navigation bar (4 items)
- Icons visible, text labels visible
- Active item: highlighted with temple color
- Bottom safe area padding for iOS notches
- Content above nav with padding to prevent overlap

### All Protected Screens
- Use MainLayout component wrapper
- MainLayout includes Header + Navigation
- Header shows app name, settings icon, sign-out button
- Navigation provides consistent access to all 4 main screens

### Chant Page (Exception)
- Custom header with back button (not MainLayout)
- Shows manual "Dashboard" back button
- No sidebar on desktop (full-width counter)
- Still shows mobile bottom nav

---

## For Different Roles

### Frontend Developers
Start with: **SCREEN_WORKFLOW.md** → **ROUTING_AUDIT.md**

Key files to know:
- `/apps/web/src/app/` - All page components
- `/apps/web/src/components/layout/` - Navigation.tsx, MainLayout.tsx
- `/apps/web/src/hooks/useAuth.ts` - Auth state & methods

### Product Managers / Designers
Start with: **USER_JOURNEYS_VISUAL.md** → **SCREEN_WORKFLOW.md** (Sections: Screen Map, Navigation Structure)

Key concepts:
- 7 screens total (2 auth, 4 main, 1 root redirect)
- 3-4 main user journeys (signup, daily, history, settings)
- Protected screens require authentication
- Responsive: works on desktop, tablet, mobile

### QA / Testing
Start with: **ROUTING_AUDIT.md** → **USER_JOURNEYS_VISUAL.md**

Key checklists:
- Route accessibility tests (11 scenarios)
- Navigation link tests (10 buttons/links)
- Auth flow tests (3 paths)
- Responsive design tests (3 breakpoints)

### DevOps / Deployment
Start with: **ROUTING_AUDIT.md** (Executive Summary + Potential Issues)

Key things to verify:
- No broken routes → all 7 routes implemented
- Auth guards on all protected screens
- Minor UX recommendations documented (non-blocking)

---

## Finding Specific Information

### "How does user sign in?"
→ SCREEN_WORKFLOW.md: Authentication Guards section
→ USER_JOURNEYS_VISUAL.md: Journey 1, Sign In Step

### "What's the complete flow from signup to first chant?"
→ USER_JOURNEYS_VISUAL.md: Journey 1: Brand New User

### "Are there any broken links?"
→ ROUTING_AUDIT.md: Navigation Link Verification (19 links checked, 0 broken)

### "How is the chant counter supposed to work?"
→ SCREEN_FLOWCHART.txt: Chant Counter Flow section
→ USER_JOURNEYS_VISUAL.md: Journey 2 (Active Session part)

### "What happens if user doesn't select a mantra?"
→ SCREEN_FLOWCHART.txt: Chant Counter Flow (Idle Redirect)
→ SCREEN_WORKFLOW.md: Potential Issues #1 (2-second timeout)

### "How does offline support work?"
→ USER_JOURNEYS_VISUAL.md: Journey 5: Offline Session
→ SCREEN_WORKFLOW.md: Offline Support section

### "What are the design issues I should know about?"
→ SCREEN_WORKFLOW.md: Potential Issues Found (4 items documented)

### "Can I see all navigation paths visually?"
→ SCREEN_FLOWCHART.txt: All major flows visualized
→ USER_JOURNEYS_VISUAL.md: Navigation maps at bottom

### "Which routes require authentication?"
→ ROUTING_AUDIT.md: Route Table (Auth Required column)

### "What's the mobile layout look like?"
→ SCREEN_WORKFLOW.md: Navigation Structure section
→ SCREEN_FLOWCHART.txt: Mobile vs Desktop Layout Differences

---

## Key Findings Summary

### What's Working
✅ All 7 routes implemented and accessible
✅ Auth guards on all protected screens
✅ Navigation consistent across desktop & mobile
✅ 19 navigation links verified, 0 broken
✅ Clear user journeys from signup to daily practice
✅ Error handling in place (forms, data loads)
✅ Offline support queued but not breaking

### Potential Improvements (Non-Blocking)
⚠️ Chant page layout inconsistent (custom header vs MainLayout)
⚠️ 2-second idle timeout on chant page could benefit from toast notification
⚠️ Settings form load failure silently continues (should create profile on signup)
⚠️ Root redirect to /dashboard doesn't check auth first

### Accessibility
✅ Active nav states clearly indicated
✅ Form inputs have labels
✅ Loading states with spinners
✅ Error states with messages

---

## File Locations

### Route Files
```
/apps/web/src/app/page.tsx                    → / (root)
/apps/web/src/app/layout.tsx                  → Root layout
/apps/web/src/app/auth/signin/page.tsx        → /auth/signin
/apps/web/src/app/auth/signup/page.tsx        → /auth/signup
/apps/web/src/app/dashboard/page.tsx          → /dashboard
/apps/web/src/app/chant/page.tsx              → /chant
/apps/web/src/app/history/page.tsx            → /history
/apps/web/src/app/settings/page.tsx           → /settings
```

### Navigation Components
```
/apps/web/src/components/layout/Navigation.tsx  → Nav sidebar & bottom nav
/apps/web/src/components/layout/MainLayout.tsx  → Layout wrapper
/apps/web/src/components/layout/Header.tsx      → Header bar
```

### Auth & State
```
/apps/web/src/hooks/useAuth.ts                → Auth logic
/apps/web/src/store/authStore.ts             → Auth state (Zustand)
/apps/web/src/store/uiStore.ts               → Theme state
/apps/web/src/store/offlineStore.ts          → Offline queue
/apps/web/src/providers/Providers.tsx        → App initialization
```

---

## How to Use This Documentation

### Daily Reference
- Keep **ROUTING_AUDIT.md** open for quick lookups during development
- Copy the Navigation Link Verification table for manual testing

### Code Review
- Use **ROUTING_AUDIT.md** to verify PRs don't break navigation
- Reference **SCREEN_WORKFLOW.md** potential issues to watch for

### Onboarding New Dev
- Have them read **SCREEN_WORKFLOW.md** first (20 min)
- Then **ROUTING_AUDIT.md** (10 min)
- Then explore code using file list above

### Bug Triage
- Check **SCREEN_FLOWCHART.txt** for the expected flow
- Compare against **USER_JOURNEYS_VISUAL.md** for what user expects
- Use **SCREEN_WORKFLOW.md** Potential Issues section

### Testing
- Use **ROUTING_AUDIT.md** Testing Checklist
- Follow paths in **USER_JOURNEYS_VISUAL.md**
- Check error states in Journey 6

---

## Document Versions

All files created: May 31, 2026

- **SCREEN_WORKFLOW.md** - Comprehensive reference (14 KB)
- **SCREEN_FLOWCHART.txt** - Visual diagrams (30 KB)
- **ROUTING_AUDIT.md** - Audit & testing (14 KB)
- **USER_JOURNEYS_VISUAL.md** - UX focused (19 KB)
- **NAVIGATION_INDEX.md** - This file (index & guide)

---

## Next Steps

### If Adding New Routes
1. Update the Route Table in ROUTING_AUDIT.md
2. Add to routes section in SCREEN_WORKFLOW.md
3. Add flowchart in SCREEN_FLOWCHART.txt
4. Add user journey if it's a main user flow

### If Changing Navigation
1. Update Navigation.tsx
2. Reflect in SCREEN_WORKFLOW.md (Navigation Structure)
3. Update ROUTING_AUDIT.md (Navigation Link Verification)
4. Run testing checklist

### If Adding New Features
1. Map out flow in SCREEN_FLOWCHART.txt
2. Add to relevant USER_JOURNEYS_VISUAL.md journey
3. Update ROUTING_AUDIT.md if routes changed

---

## Questions?

Refer to the index above or use the "Finding Specific Information" section to locate relevant documentation.

All documentation is self-contained and can be read independently or in order.

