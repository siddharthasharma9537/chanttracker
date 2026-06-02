-- Add assignment code support for priest assignments
-- Allows Host Priests to generate codes and share with Assigned Priests
-- Created: 2026-06-03

-- ============================================================================
-- 1. UPDATE PRIEST_ASSIGNMENTS: Add assignment_code, email, and mobile fields
-- ============================================================================

ALTER TABLE priest_assignments
ADD COLUMN IF NOT EXISTS assignment_code text UNIQUE,
ADD COLUMN IF NOT EXISTS priest_email text,
ADD COLUMN IF NOT EXISTS priest_mobile text;

-- Create index on assignment code for quick lookups
CREATE INDEX IF NOT EXISTS idx_priest_assignments_code ON priest_assignments(assignment_code);
CREATE INDEX IF NOT EXISTS idx_priest_assignments_email ON priest_assignments(priest_email);

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
