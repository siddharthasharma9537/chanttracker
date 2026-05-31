# ChantTracker Screen Workflow & User Journeys

## Screen Map & Routes

```
ROOT (/)
  └─ redirect to /dashboard

AUTHENTICATION (public, no auth required)
├─ /auth/signin (SignInPage)
│  └─ Navigation link to /auth/signup
│
└─ /auth/signup (SignUpPage)
   └─ Navigation link to /auth/signin

PROTECTED SCREENS (requires auth.isSignedIn)
├─ /dashboard (DashboardPage) - HOME SCREEN
│  └─ Components:
│     ├─ ProgressRing (today's mantra progress)
│     ├─ QuickStats (streak, total count)
│     └─ PanchangWidget (Hindu calendar info)
│
├─ /chant (ChantPage) - COUNTER SCREEN
│  └─ Components:
│     ├─ MantrasDropdown (select mantra)
│     ├─ CounterDisplay (live counter + timer)
│     └─ SessionControls (start/pause/complete/abandon)
│
├─ /history (HistoryPage) - HISTORY SCREEN
│  └─ Components:
│     ├─ DateSelector (filter by date)
│     └─ SessionList (past sessions grouped by date)
│
└─ /settings (SettingsPage) - SETTINGS SCREEN
   └─ Components:
      ├─ SettingsForm
      │  ├─ Profile section (display name, daily goal)
      │  ├─ Preferences (theme, language, timezone, haptics, sound)
      │  └─ Account (email, sign out button)
```

---

## Navigation Structure

### Desktop (lg breakpoint+)
- Fixed left sidebar (w-64)
- Navigation items (4):
  - Dashboard (icon: Home) -> /dashboard
  - Chant (icon: Play) -> /chant
  - History (icon: Clock) -> /history
  - Settings (icon: Settings) -> /settings
- User card at bottom showing email

### Mobile (< lg breakpoint)
- Bottom fixed navigation bar (4 items)
- Same navigation items + icons
- Bottom safe area padding for iOS

---

## User Journeys

### Journey 1: New User Signup & First Session

```
[Landing] (/)
    ↓
redirect to /dashboard
    ↓
[redirect to /auth/signin because not authenticated]
    ↓
[Auth: Sign In] (/auth/signin)
    ├─ Email/password input
    ├─ "Sign in" button
    └─ Link to "/auth/signup"
    
[User clicks "Sign up" link]
    ↓
[Auth: Sign Up] (/auth/signup)
    ├─ Email input
    ├─ Password input (8+ chars, 1 uppercase, 1 number)
    ├─ Display name (optional)
    ├─ "Sign up" button
    └─ Link back to "/auth/signin"
    
[After successful signup]
    ↓
SignUpForm.onSubmit() -> router.push('/dashboard')
    ↓
[Dashboard] (/dashboard)
    ├─ Auth guard passes (isSignedIn = true)
    ├─ Shows:
    │  ├─ Progress ring (0/target)
    │  ├─ Quick stats (streak, total)
    │  ├─ Panchang widget
    │  └─ CTA "Ready to chant?" button
    └─ Bottom nav: Dashboard (active), Chant, History, Settings
    
[User clicks "Start Chanting" or Chant nav button]
    ↓
[Chant Counter] (/chant)
    ├─ Auth guard passes
    ├─ Mantra selector dropdown
    ├─ No counter visible until mantra selected
    └─ Bottom nav: Dashboard, Chant (active), History, Settings
    
[User selects mantra from dropdown]
    ↓
handleSelectMantra() -> startSessionMutation()
    ├─ Creates session in DB (status: 'active')
    ├─ Initializes counter state (count: 0, target: 108)
    ├─ Shows CounterDisplay + SessionControls
    └─ User manually increments counter (tap/click)
    
[User reaches target or manually completes]
    ↓
complete() -> completeSession() RPC
    ├─ Updates session (status: 'completed')
    ├─ Triggers DB updates (streaks, sankalpa, achievements)
    └─ Redirects to /dashboard after 2sec if idle
    
[Back on Dashboard]
    ├─ ProgressRing updated (shows new count)
    ├─ QuickStats updated (streak, total)
    └─ User can:
       ├─ Start another session (Chant)
       ├─ View history (History)
       ├─ Adjust settings (Settings)
       └─ Or return tomorrow
```

---

### Journey 2: Existing User Daily Session

```
[Browser refresh or new session]
    ↓
Root (/) -> redirect to /dashboard
    ↓
useAuthStore initializes (Providers.tsx)
    ├─ On mount: supabase.auth.getUser()
    ├─ Sets user in authStore
    └─ Listens for auth state changes
    
[Dashboard auth guard checks]
    ├─ isSignedIn = !!user -> true
    ├─ No redirect, renders dashboard
    └─ useDashboard() hook fetches today's progress
    
[Dashboard] (/dashboard)
    ├─ Shows:
    │  ├─ Progress ring (today's count vs target)
    │  ├─ Streak (days consecutive)
    │  ├─ Total (lifetime count)
    │  ├─ Panchang (today's astrological info)
    │  └─ CTA "Start Chanting"
    └─ User options:
       ├─ Tap "Start Chanting" -> /chant
       ├─ Tap Chant nav -> /chant
       ├─ Tap History nav -> /history
       └─ Tap Settings nav -> /settings
    
[User goes to /chant]
    ↓
[Chant Counter] (/chant)
    ├─ Auto-redirect back to /dashboard if idle >2sec
    ├─ Wait for mantra selection
    └─ After mantra selected:
       ├─ Counter visible
       ├─ Manual taps/clicks increment
       ├─ Can pause/resume
       └─ Can complete or abandon
    
[User completes session]
    ↓
Returns to /dashboard (auto-redirect or nav click)
    ├─ Stats updated
    └─ Can start another session or navigate elsewhere
```

---

### Journey 3: Settings Flow

```
[From any protected screen]
    ├─ Dashboard (/dashboard)
    ├─ Chant (/chant)
    ├─ or History (/history)
    
[User taps Settings nav]
    ↓
[Settings] (/settings)
    ├─ Auth guard passes (isSignedIn required)
    ├─ MainLayout wraps (sidebar + nav visible)
    ├─ Loads user profile from 'profiles' table
    ├─ Shows form sections:
    │  ├─ Profile
    │  │  ├─ Display name
    │  │  └─ Daily goal
    │  ├─ Preferences
    │  │  ├─ Theme (radio: temple/midnight/dawn)
    │  │  ├─ Language (select: en/hi/te/sa)
    │  │  ├─ Timezone (select: UTC, regions)
    │  │  ├─ Haptics (checkbox)
    │  │  └─ Chant sound (checkbox)
    │  └─ Account
    │     ├─ Email (read-only display)
    │     └─ Sign Out button
    └─ "Save Changes" button at bottom
    
[User modifies settings and clicks Save]
    ↓
onSubmit(data)
    ├─ If theme changed: applyTheme() + setTheme()
    │  └─ Removes old theme class, adds new one
    ├─ Upserts profile to 'profiles' table
    └─ Shows "Settings saved successfully" toast (3sec)
    
[User can:]
    ├─ Navigate away (nav clicks)
    ├─ Sign out:
    │  ├─ Calls supabase.auth.signOut()
    │  ├─ Calls clearAuth()
    │  └─ Redirects to /auth/signin
    └─ Modify more settings and save again
```

---

## Authentication Guards

### Protected Screen Pattern
Every protected screen (dashboard, chant, history, settings) has:

```tsx
useEffect(() => {
  if (!authLoading && !isSignedIn) {
    router.push('/auth/signin')
  }
}, [authLoading, isSignedIn, router])

if (authLoading) return <LoadingSpinner />
if (!isSignedIn) return null // Redirect handles this
```

### Auth State Flow
```
[App loads]
    ↓
Providers.tsx useEffect (on mount)
    ├─ createClient() (Supabase)
    ├─ supabase.auth.getUser()
    ├─ setUser(data.user) in authStore
    └─ Listen: supabase.auth.onAuthStateChange()
    
[useAuth hook] (called by all pages)
    ├─ Reads user from authStore
    ├─ Computed: isSignedIn = !!user
    ├─ Methods: signIn(email, password)
    ├─ Methods: signUp(email, password, displayName)
    └─ Methods: signOut()
```

---

## Navigation Link Summary

### Auth Pages (public, no sidebar)
- Sign In page -> link to /auth/signup
- Sign Up page -> link to /auth/signin

### Protected Pages (all have MainLayout with sidebar + bottom nav)

| From | Destination | Trigger |
|------|-------------|---------|
| /dashboard | /chant | "Start Chanting" button or Chant nav |
| /dashboard | /history | History nav |
| /dashboard | /settings | Settings nav |
| /chant | /dashboard | "Dashboard" back button (in header) or idle >2sec or Dashboard nav |
| /chant | /history | History nav |
| /chant | /settings | Settings nav |
| /history | /dashboard | Dashboard nav |
| /history | /chant | Chant nav |
| /history | /settings | Settings nav |
| /settings | /dashboard | Dashboard nav or browser back |
| /settings | /chant | Chant nav |
| /settings | /history | History nav |
| /settings | /auth/signin | "Sign Out" button in Account section |

---

## State Dependencies & Data Flow

### Authentication State
```
authStore.user (Zustand)
    ├─ Set on app load: Providers.tsx
    ├─ Cleared on sign out: useAuth.signOut()
    └─ Used by: every protected page guard
```

### UI State
```
uiStore.theme (Zustand)
    ├─ Default: 'temple'
    ├─ Modified: SettingsForm (radio select)
    ├─ Applied: HTML class theme-{temple|midnight|dawn}
    └─ Persisted: 'profiles' table
```

### Dashboard Data
```
useDashboard() hook (React Query)
    ├─ Calls: get_today_progress RPC
    ├─ Returns: done, target, streak, total
    ├─ Refetch: manual via button or auto-refresh
    └─ Error state: show retry button
```

### Chant Session State
```
useSessionCounter() hook (custom)
    ├─ State: idle | active | paused | completed | abandoned
    ├─ Mutations:
    │  ├─ start(sessionId, mantraId, target)
    │  ├─ increment() / decrement()
    │  ├─ pause() / resume()
    │  ├─ complete()
    │  └─ abandon()
    └─ Syncs to DB via useStartSession & complete/abandon RPCs
```

### Offline Support
```
offlineStore (Zustand)
    ├─ isOnline: navigator.onLine (synced on mount)
    ├─ addPending(): queue session for sync
    └─ removePending(): clear after sync
    
When offline:
    ├─ startSession still works (optimistic)
    ├─ Session added to pending queue
    └─ On reconnect: queue syncs to DB
```

---

## Entry & Exit Points

### Entry Points
1. **Primary:** `/` redirects to `/dashboard`
2. **Auth:** `/auth/signin` or `/auth/signup` (public, no auth needed)
3. **Deep link:** Any protected route if authenticated
4. **Deep link error:** Protected route redirects to `/auth/signin` if not auth

### Exit Points
1. **Sign out:** `/settings` -> "Sign Out" button -> `/auth/signin`
2. **Browser back:** Protected page -> auth redirect (if logged out elsewhere)
3. **Session storage:** Auth persists in Supabase token; survives refresh

---

## Potential Issues Found

### 1. Chant Page Idle Redirect (Possible UX Issue)
**File:** `/apps/web/src/app/chant/page.tsx:54-77`

```tsx
// Redirects to dashboard if idle >2sec with no mantra selected
useEffect(() => {
  if (counterState.state === 'idle' && !selectedMantra && !authLoading && !isStarting) {
    const timer = setTimeout(() => {
      if (counterState.state === 'idle' && !selectedMantra) {
        router.push('/dashboard')
      }
    }, 2000)
    return () => clearTimeout(timer)
  }
}, [...])
```

**Status:** Working as intended. User has 2 seconds to select a mantra before auto-redirect.

**Recommendation:** Consider toast notification before redirect to inform user why page changed.

---

### 2. Settings Form Profile Load (Potential Edge Case)
**File:** `/apps/web/src/components/settings/SettingsForm.tsx:83-124`

The form loads profile on mount, but if:
- User has never set profile -> returns error (row doesn't exist)
- Component doesn't handle profile creation

**Status:** May silently fail if 'profiles' table doesn't have RLS insert permission or profile not created on signup.

**Recommendation:** Ensure signup form creates default profile row for new users.

---

### 3. Navigation Active State
**File:** `/apps/web/src/components/layout/Navigation.tsx:24-26`

```tsx
const isActive = (href: string) => {
  return pathname === href || pathname.startsWith(href + '/')
}
```

**Status:** Works correctly. Nested routes like `/auth/signin` won't trigger active state on main nav (correct).

**Recommendation:** No issue; logic is sound.

---

### 4. Chant Page Header Button (Back Navigation)
**File:** `/apps/web/src/app/chant/page.tsx:131-137`

The /chant page has a manual "Dashboard" button because it doesn't use MainLayout. This is inconsistent with other pages.

**Status:** Manual button works; not a bug, but breaks consistency.

**Recommendation:** Consider wrapping Chant page in MainLayout for consistency, or add nav to header.

---

## Screen Summary Table

| Screen | Route | Auth Required | Layout | Key Components | Navigation Links |
|--------|-------|---------------|--------|-----------------|------------------|
| Sign In | `/auth/signin` | No | Custom | SignInForm | - signup link |
| Sign Up | `/auth/signup` | No | Custom | SignUpForm | - signin link |
| Dashboard | `/dashboard` | Yes | MainLayout | ProgressRing, QuickStats, Panchang | - chant, history, settings, home |
| Chant | `/chant` | Yes | Custom | MantrasDropdown, CounterDisplay, SessionControls | - back button, nav (mobile) |
| History | `/history` | Yes | MainLayout | DateSelector, SessionList | - dashboard, chant, settings |
| Settings | `/settings` | Yes | MainLayout | SettingsForm (profile, prefs, account) | - dashboard, chant, history, signout |

---

## Accessibility Notes

### Keyboard Navigation
- All nav buttons have `aria-current="page"` when active
- Form inputs have associated labels
- Mobile nav items have `aria-label` attributes

### Visual Indicators
- Active nav item: `bg-temple-100 text-temple-600 font-semibold` (desktop)
- Active nav item: `text-temple-600` (mobile)
- Focus states: `focus:ring-2 focus:ring-orange-500`

### Loading States
- Spinners shown during auth check, data load
- Buttons disabled during form submission

---

## Color & Theme System

### Applied Themes
- `theme-temple` (default, orange/temple colors)
- `theme-midnight` (dark mode)
- `theme-dawn` (soft pastels)

### Where Applied
- Set on `<html>` element as class
- Applied on: Providers (mount) + SettingsForm (save)
- Persisted in: 'profiles.theme' column

### Active UI Colors
- Primary: `text-temple-600`, `bg-temple-100`, `border-temple-100`
- Buttons: `bg-orange-600 hover:bg-orange-700`
- Focus: `focus:ring-2 focus:ring-orange-500`

