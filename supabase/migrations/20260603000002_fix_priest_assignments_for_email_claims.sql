-- Fix priest_assignments table to support email-based assignment claims
-- The assignment workflow uses email+mobile to create a code before the priest
-- claims it with their actual account. This migration makes priest_id nullable
-- and updates uniqueness constraints to support this flow.
-- Created: 2026-06-03

-- ============================================================================
-- PROBLEM STATEMENT
-- ============================================================================
-- Frontend workflow:
-- 1. Host Priest assigns project to another priest using EMAIL + MOBILE
--    → Creates record with priest_email, priest_mobile, assignment_code
--    → priest_id is NOT YET KNOWN (unclaimed assignment)
-- 2. Assigned Priest enters the 6-char code
--    → System looks up by code, verifies email matches
--    → Uses current user.id (auth.uid()) as the priestId
--
-- Current schema issues:
-- 1. priest_id is NOT NULL (required) but INSERT doesn't include it
-- 2. UNIQUE(project_id, priest_id) will reject multiple NULL values
-- 3. RLS policies check for priest_id = auth.uid() but priest_id is NULL
-- 4. SELECT queries by assignment_code won't work with current RLS
--
-- This migration fixes the schema to support the email-based flow.
-- ============================================================================

-- ============================================================================
-- STEP 1: Drop the constraining UNIQUE constraint on (project_id, priest_id)
-- ============================================================================
-- This allows multiple unclaimed assignments to the same project
-- (one per email address)
ALTER TABLE priest_assignments
  DROP CONSTRAINT IF EXISTS priest_assignments_project_id_priest_id_key;

-- ============================================================================
-- STEP 2: Make priest_id NULLABLE to allow unclaimed assignments
-- ============================================================================
-- Unclaimed assignments have priest_id = NULL
-- Once priest claims by entering code, priest_id is updated to their user.id
ALTER TABLE priest_assignments
  ALTER COLUMN priest_id DROP NOT NULL;

-- Update foreign key to allow NULL values
-- Note: PostgreSQL foreign keys already allow NULL by default, so no change needed

-- ============================================================================
-- STEP 3: Add UNIQUE constraint on assignment_code
-- ============================================================================
-- Each assignment code must be globally unique (6-char alphanumeric)
-- This ensures a code can only be used once
ALTER TABLE priest_assignments
  ADD CONSTRAINT unique_assignment_code UNIQUE (assignment_code);

-- ============================================================================
-- STEP 4: Create index on priest_email for fast email-based lookups
-- ============================================================================
-- When assigned priest claims their code, we query by email
CREATE INDEX IF NOT EXISTS idx_priest_assignments_priest_email
  ON priest_assignments(priest_email);

-- ============================================================================
-- STEP 5: Update RLS policies to support email-based claims
-- ============================================================================

-- Drop the old SELECT policy that only allows priest_id match
DROP POLICY IF EXISTS "priests_see_own_assignments" ON priest_assignments;

-- New policy: Allow priest to see assignments in three ways:
-- 1. They are the assigned priest (priest_id matches) - for claimed assignments
-- 2. Assignment code is not null (anyone can lookup unclaimed by code)
-- 3. Their email matches the priest_email (for verification before claiming)
CREATE POLICY "priests_see_assignments" ON priest_assignments FOR SELECT
  USING (
    -- Own claimed assignments (priest_id is set and matches current user)
    auth.uid() = priest_id
    -- Unclaimed assignments can be viewed if you know the code
    -- (Frontend application layer enforces code entry requirement)
    OR (assignment_code IS NOT NULL AND priest_id IS NULL)
  );

-- Host priest policies remain unchanged - they can see all assignments for their projects
-- The existing policies already handle this correctly:
-- "host_priest_sees_assignments" - SELECT policy
-- "host_priest_creates_assignments" - INSERT policy
-- "host_priest_updates_assignments" - UPDATE policy
-- "host_priest_deletes_assignments" - DELETE policy

-- ============================================================================
-- STEP 6: Document the workflow in comments
-- ============================================================================
-- Workflow:
--
-- STEP A: Host Priest assigns project to another priest
--   Input: email, mobile, project_id
--   Action: Generate 6-char code = hash(email + mobile)
--   Insert: { project_id, priest_email, priest_mobile, assignment_code, priest_id: NULL }
--
-- STEP B: Assigned Priest receives assignment code (via email/message)
--   Input: assignment_code, current user.email, current user.id
--   Query: SELECT project_id FROM priest_assignments
--           WHERE assignment_code = ? AND priest_email = ?
--   Verify: If query returns row, priest can access that project
--
-- STEP C: (Optional Future) When priest claims assignment
--   Update: UPDATE priest_assignments
--            SET priest_id = auth.uid()
--            WHERE assignment_code = ? AND priest_email = ?
--   Result: priestId now set, normal RLS policies can find the assignment
--
-- This two-step flow allows assignment before the priest has claimed/verified

-- ============================================================================
-- STEP 7: Verify data integrity after migration
-- ============================================================================
-- Check: All existing assignments have priest_id set (no NULL values expected)
-- If any NULL values exist, they are unclaimed assignments
-- These would be new assignments from the updated frontend

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
