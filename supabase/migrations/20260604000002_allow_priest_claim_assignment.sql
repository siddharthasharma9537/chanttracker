-- Allow an assigned priest to CLAIM their assignment.
--
-- Background:
--   The email-based assignment flow (20260603000002) made priest_id nullable so
--   a host can create an unclaimed assignment from just an email + mobile + code.
--   When the assigned priest later enters the code, the app runs:
--       UPDATE priest_assignments SET priest_id = auth.uid()
--       WHERE assignment_code = <code>
--   But the ONLY existing UPDATE policies on priest_assignments are host-only
--   ("Host priests can manage assignments" / "host_priest_updates_assignments").
--   So the claim updated 0 rows, priest_id stayed NULL, and the projects /
--   project_grahas RLS policies (which require the priest to be claimed on the
--   project) kept denying the priest — the chant page showed no grahas.
--
-- This policy lets an authenticated user claim an UNCLAIMED assignment that was
-- created for THEIR email, and only set priest_id to themselves. The host-only
-- management policies remain untouched.

CREATE POLICY "priests_claim_own_assignment" ON priest_assignments
  FOR UPDATE
  USING (
    priest_id IS NULL
    AND assignment_code IS NOT NULL
    AND lower(priest_email) = lower(auth.jwt() ->> 'email')
  )
  WITH CHECK (
    priest_id = auth.uid()
  );
