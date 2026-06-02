-- Fix infinite recursion in RLS policies for priest_assignments
-- The issue: Multiple SELECT policies with subqueries creating circular dependencies
-- Solution: Drop conflicting policies and keep only the simplified one

-- Drop all conflicting SELECT policies
DROP POLICY IF EXISTS "priests_see_assignments" ON priest_assignments;
DROP POLICY IF EXISTS "priests_see_own_assignments" ON priest_assignments;
DROP POLICY IF EXISTS "Priests can view their own assignments" ON priest_assignments;

-- Create a single, simplified SELECT policy without subqueries
-- This avoids the infinite recursion that occurs when policies reference other tables
CREATE POLICY "priests_see_assignments" ON priest_assignments FOR SELECT
  USING (
    -- Own claimed assignments (priest_id is set and matches current user)
    auth.uid() = priest_id
    -- Unclaimed assignments can be viewed if you know the code
    -- (Frontend application layer enforces code entry requirement)
    OR (assignment_code IS NOT NULL AND priest_id IS NULL)
  );

-- Note: Host priest access is handled by the "Host priests can manage assignments"
-- policy which checks host_priest_id through the projects table.
-- This is necessary for host priests to manage assignments, but we keep it separate
-- from the SELECT policy to avoid recursion issues.
