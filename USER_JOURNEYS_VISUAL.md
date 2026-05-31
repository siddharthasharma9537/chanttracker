# ChantTracker User Journeys - Visual Guide

## Journey 1: Brand New User (Signup)

```
START
  |
  v
[Browser loads chanttracker.com/]
  |
  | (Root redirect)
  v
[Unauthenticated check]
  |
  | (Not logged in)
  v
┌─────────────────────────────┐
│   /auth/signin              │
│   (Sign In Screen)          │
│                             │
│  Email: [_______________]   │
│  Password: [_______________] │
│  [Sign In] button           │
│                             │
│  "Don't have account?"       │
│  > Sign up link             │
└──────────┬──────────────────┘
           |
           | (User clicks "Sign up")
           v
┌─────────────────────────────┐
│   /auth/signup              │
│   (Sign Up Screen)          │
│                             │
│  Email: [_______________]   │
│  Password: [_______________] │
│  Display Name: [__________] │
│  [Sign Up] button           │
│                             │
│  "Have account?"            │
│  > Sign in link             │
└──────────┬──────────────────┘
           |
           | (User enters email/password/name)
           | (Clicks Sign Up)
           v
[Supabase creates user account]
  |
  | (Success)
  v
useAuth.signUp() → router.push('/dashboard')
  |
  v
┌─────────────────────────────┐
│   /dashboard                │
│   (Home Screen)             │
│                             │
│  Welcome back               │
│  [Progress Ring: 0/108]     │
│  [Quick Stats]              │
│  [Panchang Widget]          │
│                             │
│  [START CHANTING] button    │
│                             │
│  Bottom Nav:                │
│  [Home*] [Chant] [History]  │
│  [Settings]                 │
└──────────┬──────────────────┘
           |
           | (User ready to chant)
           | (Clicks START CHANTING or Chant nav)
           v
┌─────────────────────────────┐
│   /chant                    │
│   (Counter Screen)          │
│                             │
│  [← Dashboard] button       │
│                             │
│  Select Mantra:             │
│  [Dropdown: "Choose..."]    │
└──────────┬──────────────────┘
           |
           | (User selects mantra, e.g., "Om Namah Shivaya")
           v
[useStartSession creates session in DB]
  |
  v
┌─────────────────────────────┐
│   /chant (Active Session)   │
│                             │
│  Om Namah Shivaya           │
│          ___                │
│        /     \              │
│       | 42/108│             │
│        \___/               │
│                             │
│  Timer: 2:15                │
│                             │
│  [−] [Increment] [+]        │
│  [⏸ Pause]                 │
│  [✓ Complete]               │
│  [✕ Abandon]               │
└──────────┬──────────────────┘
           |
      (User taps + button 66 times)
      (Reaches target 108)
           |
           | (Clicks ✓ Complete)
           v
[useSessionCounter.complete()]
  |
  | (Calls completeSession RPC)
  v
[DB triggers fire]
  | - Update streak
  | - Update sankalpa
  | - Check achievements
  |
  v
(Auto-redirect to /dashboard after 0-2 sec)
  |
  v
┌─────────────────────────────┐
│   /dashboard (UPDATED!)     │
│                             │
│  Welcome back               │
│  [Progress Ring: 108/108]   │
│  [Quick Stats]              │
│  ✓ Streak: 1 day           │
│  ✓ Total: 108              │
│  [Panchang Widget]          │
│                             │
│  [START CHANTING] button    │
└──────────┬──────────────────┘
           |
           | (User can continue chanting)
           | (or check history/settings)
           v
[USER COMPLETES DAILY PRACTICE]
```

---

## Journey 2: Existing User (Daily Session)

```
START
  |
  v
[Browser loads app / New session]
  |
  | (Providers.tsx initializes on mount)
  | - supabase.auth.getUser()
  | - setUser in authStore
  |
  v
[Root redirect] → /dashboard
  |
  | (Auth guard passes: isSignedIn = true)
  |
  v
┌─────────────────────────────┐
│   /dashboard                │
│   (Home Screen - Loaded)    │
│                             │
│  Welcome back               │
│  [Progress Ring: 42/500]    │
│  (Today's progress)         │
│                             │
│  [Quick Stats]              │
│  ✓ Streak: 5 days          │
│  ✓ Total: 2,150            │
│                             │
│  [Panchang Widget]          │
│  Monday, May 31 2026        │
│  Nakshatra: [...]           │
│                             │
│  [START CHANTING] or        │
│  Bottom Nav > Chant         │
└──────────┬──────────────────┘
           |
           | (User taps Chant nav)
           v
┌─────────────────────────────┐
│   /chant                    │
│   (Counter - Ready)         │
│                             │
│  [← Dashboard] button       │
│                             │
│  Select Mantra:             │
│  [Dropdown: "Gayatri Mantra"]
│                             │
│  [Today's recommendations]  │
│  (Optional feature)         │
└──────────┬──────────────────┘
           |
           | (User selects mantra)
           v
┌─────────────────────────────┐
│   /chant (Active Session)   │
│                             │
│  Gayatri Mantra             │
│          ___                │
│        /     \              │
│       | 0/108 │             │
│        \___/               │
│                             │
│  Timer: 0:00                │
│                             │
│  [−] [Tap to count] [+]     │
│  [⏸ Pause]                 │
│  [✓ Complete]               │
│  [✕ Abandon]               │
└──────────┬──────────────────┘
           |
    (User taps + to increment)
    (Pauses session, resumes)
    (Continues until 108 or chooses)
           |
           | (After reaching target or manually)
           | (Clicks ✓ Complete)
           v
[Session marked complete in DB]
  |
  | (Streak remains intact)
  | (Daily count incremented)
  |
  v
┌─────────────────────────────┐
│   /dashboard (REFRESHED)    │
│                             │
│  Welcome back               │
│  [Progress Ring: 150/500]   │
│  (Increased from 42)        │
│                             │
│  [Quick Stats]              │
│  ✓ Streak: 5 days (same)    │
│  ✓ Total: 2,258 (up 108)   │
└──────────┬──────────────────┘
           |
           | (User can:)
           | - Check History to see all sessions
           | - Adjust Settings
           | - Start another chant session
           | - Close app (progress saved in DB)
           |
           v
[SESSION ENDS]
```

---

## Journey 3: Customize Settings

```
START
  |
  v
[User on any protected screen]
  | (Dashboard, Chant, History)
  |
  | (Clicks Settings in nav)
  |
  v
┌─────────────────────────────┐
│   /settings                 │
│   (Settings Page)           │
│                             │
│  Settings                   │
│  Manage profile & prefs     │
│                             │
│  PROFILE SECTION:           │
│  Display Name:              │
│  [John Sharma____________]  │
│  Daily Goal:                │
│  [500_________________]     │
│                             │
│  PREFERENCES SECTION:       │
│  Theme:                     │
│  (•) Temple (orange)        │
│  ( ) Midnight (dark)        │
│  ( ) Dawn (pastels)         │
│                             │
│  Language:                  │
│  [English▼]                 │
│                             │
│  Timezone:                  │
│  [America/Los_Angeles▼]     │
│                             │
│  Haptics:         [Toggle✓] │
│  Sound:           [Toggle✓] │
│                             │
│  ACCOUNT SECTION:           │
│  Email: john@example.com    │
│  [Sign Out] button          │
│                             │
│  [Save Changes] button      │
└──────────┬──────────────────┘
           |
      (User modifies settings)
      (E.g., changes theme)
           |
      Display Name: "Siddhartha"
      Theme: (•) Midnight
      Language: [Hindi▼]
           |
           v
      (Clicks "Save Changes")
           |
      [Saving Changes...]
           |
           v
[onSubmit() called]
  |
  | - If theme changed: applyTheme() on DOM
  | - Upsert 'profiles' table in DB
  |
  v
[Success: Settings saved]
  |
  v
┌─────────────────────────────┐
│   /settings (UPDATED)       │
│                             │
│  [Success message appears]  │
│  "Settings saved            │
│   successfully"             │
│                             │
│  (Form reflects changes)    │
│  Display Name: Siddhartha   │
│  Theme: Midnight (dark)     │
│  Language: Hindi            │
│                             │
│  [Page theme changed to     │
│   dark colors]              │
│                             │
│  (User can:)               │
│  - Make more changes       │
│  - Click another nav item  │
│  - Or sign out             │
└──────────┬──────────────────┘
           |
           | (If clicks Sign Out)
           v
[Confirmation/Sign Out clicked]
  |
  | handleSignOut()
  | - supabase.auth.signOut()
  | - clearAuth() - sets user = null
  | - router.push('/auth/signin')
  |
  v
┌─────────────────────────────┐
│   /auth/signin              │
│   (Back to sign in form)    │
│                             │
│  (User logged out)          │
│  Can sign in again          │
└──────────┬──────────────────┘
           |
           v
[SETTINGS SESSION ENDS]
```

---

## Journey 4: View History

```
START
  |
  v
[User on Dashboard/Chant/Settings]
  |
  | (Clicks History in nav)
  |
  v
┌─────────────────────────────┐
│   /history                  │
│   (History Page)            │
│                             │
│  History                    │
│  Review sessions & track    │
│                             │
│  Date Selector:             │
│  [< May 31, 2026 >]         │
│                             │
│  Sessions for May 31:       │
│  ┌────────────────────────┐ │
│  │ 8:30 AM - 8:45 AM     │ │
│  │ Om Namah Shivaya      │ │
│  │ 108 repetitions       │ │
│  └────────────────────────┘ │
│                             │
│  ┌────────────────────────┐ │
│  │ 6:00 PM - 6:20 PM     │ │
│  │ Gayatri Mantra        │ │
│  │ 108 repetitions       │ │
│  └────────────────────────┘ │
│                             │
│  [No sessions on May 30]    │
│                             │
│  [Navigation]               │
│  [Home] [Chant] [History*]  │
│  [Settings]                 │
└──────────┬──────────────────┘
           |
           | (User can:)
           | - Change date with arrows
           | - See past sessions
           | - Analyze practice patterns
           | - Navigate to other screens
           |
           v
[HISTORY EXPLORATION ENDS]
```

---

## Journey 5: Offline Session (Resilience)

```
START (No Internet Connection)
  |
  v
[User on Chant page]
  |
  | offlineStore.isOnline = false
  |
  v
[User selects mantra]
  |
  | startSessionMutation() still creates session
  | (Optimistic: may fail)
  |
  v
IF OFFLINE:
┌─────────────────────────────┐
│   Session Created Locally   │
│   (Pending sync)            │
│                             │
│  offlineStore.addPending({  │
│    sessionId,               │
│    count,                   │
│    durationSecs             │
│  })                         │
│                             │
│  User can chant normally    │
│  Counter works offline      │
└──────────┬──────────────────┘
           |
           | (User completes session)
           | (Session in pending queue)
           |
           v
[User regains internet]
  |
  | offlineStore.setIsOnline(true)
  |
  v
[Sync to Supabase]
  |
  | Queue is processed
  | Sessions synced to DB
  |
  v
[offlineStore.removePending()]
  |
  v
[USER'S DATA NOW SYNCHRONIZED]
```

---

## Journey 6: Error States

### Sign In Error
```
/auth/signin
   |
   | User enters wrong password
   |
   v
[Sign In button clicked]
   |
   | try { signIn(email, password) }
   | catch (error) {
   |   setError('password', error.message)
   | }
   |
   v
┌──────────────────────────────┐
│ Error appears below password │
│ field in red text:           │
│                              │
│ "Invalid login credentials"  │
└──────────────────────────────┘
   |
   | User corrects and retries
```

### Dashboard Load Error
```
/dashboard
   |
   | useDashboard() hook fails
   |
   v
┌──────────────────────────────┐
│ Error Banner:                │
│ "Unable to load dashboard"   │
│ Error details in smaller text│
│ [Retry] button               │
└──────────────────────────────┘
   |
   | User clicks [Retry]
   |
   v
[refetch() called]
   |
   | Retry succeeds or shows same error
```

### Settings Save Error
```
/settings
   |
   | Form has validation errors
   |
   v
┌──────────────────────────────┐
│ Form fields show:            │
│ ✗ Display name required      │
│ ✗ Daily goal >= 1            │
│                              │
│ [Save Changes] button DISABLED
└──────────────────────────────┘
   |
   | OR
   |
   v
[Save succeeds then fails on Upsert]
   |
   v
┌──────────────────────────────┐
│ Error Banner (red):          │
│ "Failed to save settings"    │
│ [Retry] button               │
└──────────────────────────────┘
   |
   | User fixes and retries
```

---

## Complete Navigation Map (Quick Reference)

```
                      ┌─────────────┐
                      │ / (root)    │
                      │ redirect to │
                      │ /dashboard  │
                      └──────┬──────┘
                             │
              ┌──────────────┴─────────────┐
              │                            │
         [Not Auth]                   [Auth]
              │                            │
              v                            v
    ┌──────────────────┐        ┌──────────────────┐
    │ /auth/signin     │        │ /dashboard (HOME)│
    │ /auth/signup     │        │ ✓ Protected      │
    │ ✗ Protected      │        │ ✓ Sidebar visible│
    │                  │        └──────┬───────────┘
    │ Links between    │               │
    │ signin↔signup    │    ┌──────────┼────────────┐
    │ + Sign In/Up btn │    │          │            │
    │   → /dashboard   │    v          v            v
    └──────────────────┘ /chant   /history   /settings
                         │
                         | (Protected routes)
                         | (All have sidebar + nav)
                         | (All have auth guard)
                         |
                         v
                    (Users can navigate
                     between protected routes
                     via nav component)
```

---

## State Machine: Auth

```
[No User]
    ↓ (App mount: getUser() in Providers)
    ├─ If user found → [Authenticated]
    └─ If no user → [Unauthenticated]

[Unauthenticated]
    ↓ (User signs in/up)
    ├─ Success → [Authenticated]
    └─ Error → [Unauthenticated] (show error)

[Authenticated]
    ↓ (User signs out or auth expires)
    └─ [Unauthenticated]

(Protected routes check state)
    ├─ [Unauthenticated] → redirect to /auth/signin
    └─ [Authenticated] → allow access
```

---

## Key Flows At a Glance

| Task | Starting Point | Destination | Triggers |
|------|---|---|---|
| New user signup | /auth/signin | /dashboard | Sign up button |
| Login existing | /auth/signin | /dashboard | Sign in button |
| Start chanting | /dashboard | /chant | "Start Chanting" button or Chant nav |
| Complete chant | /chant | /dashboard | Complete button or idle timeout |
| View history | Any protected | /history | History nav |
| Edit settings | Any protected | /settings | Settings nav |
| Sign out | /settings | /auth/signin | Sign Out button |
| No auth | Protected route | /auth/signin | Guard redirect |

