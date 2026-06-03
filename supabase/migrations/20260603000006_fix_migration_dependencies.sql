-- Fix migration dependencies and add missing schema elements
-- This migration fixes all forward-reference issues that prevented earlier migrations from running on fresh databases
-- Created after all other migrations have been properly sequenced

-- ============================================================================
-- 1. Add missing columns to existing tables (safe operations)
-- ============================================================================

-- Add project_code to projects table if it doesn't exist
ALTER TABLE projects ADD COLUMN IF NOT EXISTS project_code VARCHAR(8);

-- Add unique constraint on project_code (if not already present)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'unique_project_code'
    AND table_name = 'projects'
  ) THEN
    ALTER TABLE projects ADD CONSTRAINT unique_project_code UNIQUE (project_code);
  END IF;
END $$;

-- Create index for project_code if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_projects_project_code ON projects(project_code);

-- ============================================================================
-- 2. Create trigger for auto-generating project codes
-- ============================================================================

CREATE OR REPLACE FUNCTION generate_project_code()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.project_code IS NULL OR NEW.project_code = '' THEN
    NEW.project_code :=
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
      SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
             (FLOOR(RANDOM() * 36)::INT + 1), 1);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_generate_project_code ON projects;
CREATE TRIGGER trigger_generate_project_code
BEFORE INSERT ON projects
FOR EACH ROW
EXECUTE FUNCTION generate_project_code();

-- Generate codes for existing projects without codes
UPDATE projects
SET project_code =
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1) ||
  SUBSTR('0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ',
         (FLOOR(RANDOM() * 36)::INT + 1), 1)
WHERE project_code IS NULL OR project_code = '';

-- ============================================================================
-- 3. Update RPC functions to include project_code
-- ============================================================================

-- Drop existing function if it exists (signature change requires DROP)
DROP FUNCTION IF EXISTS get_project_status(UUID) CASCADE;

-- Create the updated function with project_code included
CREATE FUNCTION get_project_status(p_project_id UUID)
RETURNS TABLE (
  project_code TEXT,
  client_name TEXT,
  status TEXT,
  overall_completion_pct INT,
  total_target INT,
  total_completed INT,
  graha_breakdown JSON
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.project_code::TEXT,
    p.client_name,
    p.status,
    CASE WHEN COALESCE(SUM(pg.target_count), 0) > 0 THEN
      ROUND(100.0 * COALESCE(SUM(pg.completed_count), 0) / SUM(pg.target_count))::INT
    ELSE 0 END,
    COALESCE(SUM(pg.target_count), 0)::INT,
    COALESCE(SUM(pg.completed_count), 0)::INT,
    json_agg(
      json_build_object(
        'graha_id', pg.graha_id,
        'graha_name', g.name,
        'target', pg.target_count,
        'completed', pg.completed_count,
        'completion_pct', CASE WHEN pg.target_count > 0 THEN
          ROUND(100.0 * pg.completed_count / pg.target_count)::INT
        ELSE 0 END
      )
    )
  FROM projects p
  LEFT JOIN project_grahas pg ON p.id = pg.project_id
  LEFT JOIN grahas g ON pg.graha_id = g.id
  WHERE p.id = p_project_id
  GROUP BY p.id, p.project_code, p.client_name, p.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 4. Ensure all necessary indexes exist
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_host_priest_id ON projects(host_priest_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at);
CREATE INDEX IF NOT EXISTS idx_project_grahas_project_id ON project_grahas(project_id);
CREATE INDEX IF NOT EXISTS idx_project_grahas_graha_id ON project_grahas(graha_id);
CREATE INDEX IF NOT EXISTS idx_priest_assignments_project_id ON priest_assignments(project_id);
CREATE INDEX IF NOT EXISTS idx_priest_assignments_priest_id ON priest_assignments(priest_id);
CREATE INDEX IF NOT EXISTS idx_delegation_sessions_project_id ON delegation_sessions(project_id);
CREATE INDEX IF NOT EXISTS idx_delegation_sessions_user_id ON delegation_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_delegation_sessions_graha_id ON delegation_sessions(graha_id);

-- ============================================================================
-- End of comprehensive dependency fixes
-- ============================================================================
