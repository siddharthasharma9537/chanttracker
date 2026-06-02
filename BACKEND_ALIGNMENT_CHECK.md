# Backend-Frontend Alignment Check: Priest Assignment System

## Overview
This document audits the Supabase backend schema against the frontend priest assignment implementation to identify gaps, conflicts, and required fixes.

---

## Frontend Workflow Analysis

### 1. Host Priest Assignment Flow (AssignPriestModal.tsx)
**What the frontend does:**
```typescript
// Step 1: User enters email + mobile
// Step 2: Generate 6-char code from email+mobile (deterministic hash)
// Step 3: Insert into priest_assignments WITHOUT priest_id
await supabase.from('priest_assignments').insert({
  project_id: projectId,
  priest_email: email.toLowerCase(),
  priest_mobile: mobile.replace(/\D/g, ''),
  assignment_code: assignmentCode,
  // NOTE: priest_id is NOT included here
})
```

**Database expectations from schema:**
- `priest_id` is NOT NULL (required foreign key)
- UNIQUE(project_id, priest_id) constraint exists
- RLS policies require `priest_id` to be set

### 2. Assigned Priest Code Entry Flow (assigned/page.tsx)
**What the frontend does:**
```typescript
// Step 1: User enters 6-char assignment code
// Step 2: Query priest_assignments by code
const { data } = await supabase
  .from('priest_assignments')
  .select('project_id, priest_email')
  .eq('assignment_code', assignmentCode.toUpperCase().trim())
  .single()

// Step 3: Verify current user's email matches priest_email
if (data.priest_email.toLowerCase() !== user.email.toLowerCase()) {
  throw Error('Code not for your email')
}

// Step 4: Use current user's ID (from auth)
setSelectedAssignment({
  projectId: data.project_id,
  priestId: user.id,  // This comes from auth context, not from the assignment record
})
```

---

## Critical Issues Identified

### ❌ ISSUE 1: priest_id Uniqueness Constraint Conflict
**Severity:** CRITICAL - Will cause runtime failures

**Problem:**
- Frontend inserts `priest_assignments` WITHOUT `priest_id` (it's undefined/NULL)
- Database schema has `UNIQUE(project_id, priest_id)` constraint
- Multiple assignments to same project with NULL priest_id will violate constraint
- Insert will fail with unique constraint violation

**Root Cause:**
The assignment design is email-based (before priest claims it), but the schema expects priest_id at insert time.

**Solution Required:**
Either:
1. ✅ **OPTION A (Recommended):** Make priest_id NULLABLE, remove UNIQUE(project_id, priest_id), keep UNIQUE(assignment_code)
2. **OPTION B:** Update INSERT to generate priest_id (but we don't know it yet - only have email)
3. **OPTION C:** Create separate "pending_assignments" table for unclaimed codes

---

### ❌ ISSUE 2: RLS Policy Mismatch
**Severity:** CRITICAL - RLS will block valid operations

**Problem:**
Current RLS policy for INSERT (20260601000007_create_delegation_system.sql):
```sql
CREATE POLICY "host_priest_creates_assignments" ON priest_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = priest_assignments.project_id
        AND projects.host_priest_id = auth.uid()
    )
  );
```

This policy:
- ✅ Correctly requires host_priest_id to match current user
- ❌ Does NOT validate priest_email or prevent duplicate assignments to same email
- ❌ Will fail when priest_id is NULL (foreign key constraint)

**Required Updates:**
- Add constraint: Only one assignment per project+email combination
- Allow priest_id to be NULL during initial assignment
- Add separate policy for when assigned priest "claims" their code

---

### ⚠️ ISSUE 3: No Update Path for Claiming Assignment
**Severity:** HIGH - Feature incomplete

**Problem:**
Frontend code shows assigned priest using `user.id`, but never updates the priest_assignments record to set the actual priest_id. The priestId is only stored in the component state, not persisted to database.

**Current Flow:**
1. Host assigns via email → record created with priest_id=NULL
2. Priest enters code → system verifies email → uses auth.uid() as priestId
3. ❌ priestId is never stored in database record

**Consequences:**
- RLS policies won't work correctly (they check priest_id)
- Priest cannot query their assignments properly
- Dashboard won't show assignments in list queries

**Required Solution:**
Either:
1. Add UPDATE operation when priest claims code: `UPDATE priest_assignments SET priest_id = auth.uid() WHERE assignment_code = ? AND priest_email = ?`
2. Change workflow: Remove priest_id from assignments table entirely, use email as primary identifier

---

### ⚠️ ISSUE 4: Assignment Code Index vs Uniqueness
**Severity:** MEDIUM - Functional but not optimized

**Current migration adds:**
```sql
CREATE INDEX IF NOT EXISTS idx_priest_assignments_code ON priest_assignments(assignment_code);
```

**Issue:**
- UNIQUE constraint on assignment_code would serve double duty as both constraint AND index
- Current UNIQUE(project_id, priest_id) doesn't guarantee code uniqueness if fields are NULL

**Required:**
```sql
ALTER TABLE priest_assignments 
  ADD CONSTRAINT unique_assignment_code UNIQUE (assignment_code);
```

---

### ⚠️ ISSUE 5: SELECT Query RLS Compatibility
**Severity:** HIGH - Queries may return no rows

**Problem:**
When assigned priest queries their assignment (assigned/page.tsx):
```typescript
.select('project_id, priest_email')
.eq('assignment_code', assignmentCode.toUpperCase().trim())
```

This uses the RLS policy:
```sql
CREATE POLICY "priests_see_own_assignments" ON priest_assignments FOR SELECT
  USING (auth.uid() = priest_id);
```

**Issue:**
- Query filters by assignment_code (not by priest_id)
- RLS policy filters by priest_id = auth.uid()
- If priest_id is NULL, priest won't see their own assignment!
- Query will return 0 rows even though assignment exists

**Solution:**
Update RLS policy to allow SELECT by assignment_code without requiring priest_id match:
```sql
CREATE POLICY "anyone_can_view_by_code" ON priest_assignments FOR SELECT
  USING (assignment_code IS NOT NULL);  -- Allow lookup by code
```

Or better:
```sql
CREATE POLICY "priests_see_assignments_by_code" ON priest_assignments FOR SELECT
  USING (
    auth.uid() = priest_id  -- If they're the assigned priest
    OR priest_email = auth.jwt() ->> 'email'  -- If email matches their account
  );
```

---

## Required Database Changes

### Change Set 1: Schema Fixes (Create New Migration)
```sql
-- Migration: 20260603000002_fix_priest_assignments_for_email_based_claims.sql

-- 1. Make priest_id NULLABLE to allow email-based unclaimed assignments
ALTER TABLE priest_assignments ALTER COLUMN priest_id DROP NOT NULL;

-- 2. Remove the (project_id, priest_id) uniqueness constraint
ALTER TABLE priest_assignments DROP CONSTRAINT priest_assignments_project_id_priest_id_key;

-- 3. Add UNIQUE constraint on assignment_code (if not exists)
ALTER TABLE priest_assignments 
  ADD CONSTRAINT unique_assignment_code UNIQUE (assignment_code);

-- 4. Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_priest_assignments_email ON priest_assignments(priest_email);

-- 5. Allow multiple unclaimed assignments to same project (different emails)
-- The unique constraint is now only on assignment_code

-- 6. Update RLS policies to support email-based queries before priest_id is set
```

### Change Set 2: RLS Policy Updates
```sql
-- For INSERT: Allow host priest to create assignments (already works)
-- No change needed - existing policy is correct

-- For SELECT: Allow lookup by assignment_code even when priest_id is NULL
ALTER TABLE priest_assignments 
  DROP POLICY IF EXISTS "priests_see_own_assignments";

CREATE POLICY "priests_see_own_assignments" ON priest_assignments FOR SELECT
  USING (
    auth.uid() = priest_id  -- If they're already assigned
    OR (priest_email = auth.jwt() ->> 'email' AND assignment_code IS NOT NULL)  -- If email matches
  );

-- Host priests already have policy to see all their project assignments
-- No change needed to that policy
```

### Change Set 3: Update Frontend INSERT (Optional)
If we want to support claiming immediately, update AssignPriestModal to optionally include priest_id:
```typescript
// Current (email-based, unclaimed)
.insert({
  project_id: projectId,
  priest_email: email.toLowerCase(),
  priest_mobile: mobile.replace(/\D/g, ''),
  assignment_code: assignmentCode,
  priest_id: null,  // Explicitly NULL for clarity
})
```

---

## Verification Checklist

### Schema Verification
- [ ] `priest_id` column is nullable (NOT NULL removed)
- [ ] UNIQUE(project_id, priest_id) constraint removed
- [ ] UNIQUE(assignment_code) constraint exists
- [ ] Index on assignment_code exists
- [ ] Index on priest_email exists
- [ ] Foreign key on priest_id allows NULL

### RLS Policy Verification
- [ ] INSERT policy allows host priest to create assignments
- [ ] INSERT policy doesn't fail when priest_id is NULL
- [ ] SELECT policy allows lookup by assignment_code
- [ ] SELECT policy allows lookup by email
- [ ] Host priest can still see all assignments for their projects

### Frontend-Database Integration
- [ ] AssignPriestModal.tsx inserts successfully (priest_id = NULL)
- [ ] assigned/page.tsx can query by assignment_code
- [ ] Email verification works correctly
- [ ] Assignment records are visible to correct users

### Data Integrity
- [ ] No duplicate assignment codes can exist
- [ ] Multiple assignments to same project with different emails can exist
- [ ] priest_id can be updated later when assignment is claimed

---

## Implementation Plan

1. **Create migration:** 20260603000002_fix_priest_assignments_for_email_based_claims.sql
2. **Update RLS policies** in the same migration
3. **Test INSERT** with email-based data (priest_id = NULL)
4. **Test SELECT** queries work with assignment_code lookup
5. **Test email verification** works correctly
6. **Deploy** to production

---

## Files to Update

### Database Migrations
- [ ] Create: `supabase/migrations/20260603000002_fix_priest_assignments_for_email_based_claims.sql`

### Frontend Code (No changes needed if DB is fixed)
- ✅ `AssignPriestModal.tsx` - Already correct
- ✅ `assigned/page.tsx` - Already correct
- ✅ `ProjectDashboard.tsx` - Already correct
- ✅ `projects/page.tsx` - Already correct

### Documentation
- [ ] Update CLAUDE.md with assignment workflow notes
- [ ] Add to schema docs about email-based assignment design

---

## Risk Assessment

### High Risk
- ⚠️ Changing NOT NULL to nullable on priest_id (data migration needed if existing records)
- ⚠️ Removing uniqueness constraint (need to verify data integrity)

### Medium Risk  
- ✅ Adding new UNIQUE(assignment_code) - safe, codes already unique
- ✅ Adding new RLS policies - backwards compatible

### Low Risk
- ✅ Adding indexes - safe, performance improvement only

---

## Summary

**Current Status:** ❌ Schema and RLS misaligned with frontend implementation

**Blockers:**
1. ❌ CRITICAL: priest_id UNIQUE constraint will reject valid inserts
2. ❌ CRITICAL: RLS SELECT policy won't allow code-based lookups
3. ⚠️ HIGH: No mechanism to persist priestId when assignment is claimed

**Required Actions:**
1. Create migration to fix schema (nullable priest_id, UNIQUE on code)
2. Update RLS policies to support email-based queries
3. Deploy and test complete workflow

**Estimated Impact:** 2-3 migration files, ~50 lines of SQL changes
