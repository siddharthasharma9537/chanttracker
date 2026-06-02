-- Host/Delegation System for ChantTracker
-- Enables Main Priests to create projects and delegate chanting work to other priests
-- Supports both ASSIGNED and VOLUNTEER work tracking
-- Created: 2026-06-01

-- ============================================================================
-- 1. USER ROLES TABLE: Distinguish priests from regular users
-- ============================================================================


-- ============================================================================
-- TABLES SECTION
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  role text NOT NULL CHECK (role IN ('regular_user', 'priest', 'main_priest')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;

-- Any user can view roles (needed for public displays like project priest lists)
CREATE TABLE IF NOT EXISTS projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  client_name text NOT NULL,
  client_contact text,  -- Email or phone
  host_priest_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'archived')),
  start_date date DEFAULT CURRENT_DATE,
  target_completion_date date,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

-- Host priest can see their own projects
CREATE TABLE IF NOT EXISTS project_grahas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  graha_id uuid NOT NULL REFERENCES grahas(id) ON DELETE CASCADE,
  target_count integer NOT NULL DEFAULT 6000,
  completed_count integer NOT NULL DEFAULT 0,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id, graha_id)
);

ALTER TABLE project_grahas ENABLE ROW LEVEL SECURITY;

-- Host priest and assigned priests can see project grahas
CREATE TABLE IF NOT EXISTS priest_assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  priest_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  assigned_grahas uuid[] DEFAULT ARRAY[]::uuid[],  -- Array of project_graha IDs
  assignment_notes text,
  assigned_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(project_id, priest_id)
);

ALTER TABLE priest_assignments ENABLE ROW LEVEL SECURITY;

-- Priests can see their own assignments
CREATE TABLE IF NOT EXISTS delegation_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  project_graha_id uuid NOT NULL REFERENCES project_grahas(id) ON DELETE CASCADE,
  graha_id uuid NOT NULL REFERENCES grahas(id) ON DELETE CASCADE,
  count integer NOT NULL DEFAULT 0,
  duration_seconds integer,
  assignment_type text NOT NULL CHECK (assignment_type IN ('ASSIGNED', 'VOLUNTEER')),
  session_status text NOT NULL DEFAULT 'active' CHECK (session_status IN ('active', 'completed', 'abandoned')),
  started_at timestamp with time zone DEFAULT now(),
  ended_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE delegation_sessions ENABLE ROW LEVEL SECURITY;

-- Priests can see their own sessions


-- ============================================================================
-- RLS POLICIES SECTION
-- ============================================================================
CREATE POLICY "anyone_can_view_roles" ON user_roles FOR SELECT USING (true);

-- Users can only update their own role (admin/main priest would update in app logic)
CREATE POLICY "users_can_view_own_role" ON user_roles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "host_priest_sees_own_projects" ON projects FOR SELECT
  USING (auth.uid() = host_priest_id);

-- NOTE: Policy "assigned_priests_see_project" is created in migration 20260602000001
-- after priest_assignments table is created

-- Host priest can insert, update, delete their own projects
CREATE POLICY "host_priest_manages_own_projects" ON projects FOR INSERT
  WITH CHECK (auth.uid() = host_priest_id);

CREATE POLICY "host_priest_updates_own_projects" ON projects FOR UPDATE
  USING (auth.uid() = host_priest_id);

CREATE POLICY "host_priest_deletes_own_projects" ON projects FOR DELETE
  USING (auth.uid() = host_priest_id);

CREATE POLICY "host_priest_sees_grahas" ON project_grahas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_grahas.project_id
        AND projects.host_priest_id = auth.uid()
    )
  );

CREATE POLICY "assigned_priests_see_grahas" ON project_grahas FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM priest_assignments
      WHERE priest_assignments.project_id = project_grahas.project_id
        AND priest_assignments.priest_id = auth.uid()
    )
  );

-- Only host priest can manage grahas
CREATE POLICY "host_priest_manages_grahas" ON project_grahas FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_grahas.project_id
        AND projects.host_priest_id = auth.uid()
    )
  );

CREATE POLICY "host_priest_updates_grahas" ON project_grahas FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_grahas.project_id
        AND projects.host_priest_id = auth.uid()
    )
  );

CREATE POLICY "host_priest_deletes_grahas" ON project_grahas FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = project_grahas.project_id
        AND projects.host_priest_id = auth.uid()
    )
  );

CREATE POLICY "priests_see_own_assignments" ON priest_assignments FOR SELECT
  USING (auth.uid() = priest_id);

-- Host priests can see all assignments for their projects
CREATE POLICY "host_priest_sees_assignments" ON priest_assignments FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = priest_assignments.project_id
        AND projects.host_priest_id = auth.uid()
    )
  );

-- Only host priest can create and manage assignments
CREATE POLICY "host_priest_creates_assignments" ON priest_assignments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = priest_assignments.project_id
        AND projects.host_priest_id = auth.uid()
    )
  );

CREATE POLICY "host_priest_updates_assignments" ON priest_assignments FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = priest_assignments.project_id
        AND projects.host_priest_id = auth.uid()
    )
  );

CREATE POLICY "host_priest_deletes_assignments" ON priest_assignments FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = priest_assignments.project_id
        AND projects.host_priest_id = auth.uid()
    )
  );

CREATE POLICY "priests_see_own_sessions" ON delegation_sessions FOR SELECT
  USING (auth.uid() = user_id);

-- Host priest can see all sessions for their projects
CREATE POLICY "host_priest_sees_all_sessions" ON delegation_sessions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM projects
      WHERE projects.id = delegation_sessions.project_id
        AND projects.host_priest_id = auth.uid()
    )
  );

-- Priests can create sessions for assigned projects
CREATE POLICY "priests_create_own_sessions" ON delegation_sessions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      -- Either this is an ASSIGNED session and priest is assigned to the project
      (assignment_type = 'ASSIGNED' AND EXISTS (
        SELECT 1 FROM priest_assignments
        WHERE priest_assignments.project_id = delegation_sessions.project_id
          AND priest_assignments.priest_id = auth.uid()
      ))
      -- Or this is a VOLUNTEER session (anyone can volunteer)
      OR assignment_type = 'VOLUNTEER'
    )
  );

-- Priests can update their own ongoing sessions
CREATE POLICY "priests_update_own_sessions" ON delegation_sessions FOR UPDATE
  USING (auth.uid() = user_id AND session_status = 'active');



-- ============================================================================
-- INDEXES SECTION
-- ============================================================================
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role ON user_roles(role);

-- ============================================================================
-- 2. PROJECTS TABLE: Main Priest creates project for a client
-- ============================================================================
CREATE INDEX idx_projects_host_priest_id ON projects(host_priest_id);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_created_at ON projects(created_at);

-- ============================================================================
-- 3. PROJECT_GRAHAS TABLE: Maps grahas to projects with targets
-- ============================================================================
CREATE INDEX idx_project_grahas_project_id ON project_grahas(project_id);
CREATE INDEX idx_project_grahas_graha_id ON project_grahas(graha_id);

-- ============================================================================
-- 4. PRIEST_ASSIGNMENTS TABLE: Assign priests to projects and specific grahas
-- ============================================================================
CREATE INDEX idx_priest_assignments_project_id ON priest_assignments(project_id);
CREATE INDEX idx_priest_assignments_priest_id ON priest_assignments(priest_id);
CREATE INDEX idx_priest_assignments_unique ON priest_assignments(project_id, priest_id);

-- ============================================================================
-- 5. DELEGATION_SESSIONS TABLE: Extended chant sessions for delegation projects
-- ============================================================================
CREATE INDEX idx_delegation_sessions_user_id ON delegation_sessions(user_id);
CREATE INDEX idx_delegation_sessions_project_id ON delegation_sessions(project_id);
CREATE INDEX idx_delegation_sessions_graha_id ON delegation_sessions(graha_id);
CREATE INDEX idx_delegation_sessions_project_graha_id ON delegation_sessions(project_graha_id);
CREATE INDEX idx_delegation_sessions_status ON delegation_sessions(session_status);
CREATE INDEX idx_delegation_sessions_assignment_type ON delegation_sessions(assignment_type);
CREATE INDEX idx_delegation_sessions_user_project ON delegation_sessions(user_id, project_id);
CREATE INDEX idx_delegation_sessions_created_at ON delegation_sessions(created_at);

-- ============================================================================
-- 6. VIEWS: Aggregations and reporting
-- ============================================================================

-- View: Project status with graha completion percentages


-- ============================================================================
-- VIEWS SECTION
-- ============================================================================
CREATE OR REPLACE VIEW v_project_priests AS
SELECT
  p.id as project_id,
  p.name as project_name,
  pa.priest_id,
  pr.display_name as priest_name,
  pa.assignment_type,
  COUNT(DISTINCT ds.id) as total_sessions,
  COALESCE(SUM(CASE WHEN ds.assignment_type = pa.assignment_type THEN ds.count ELSE 0 END), 0) as total_count,
  MAX(ds.ended_at) as last_activity_at,
  array_agg(DISTINCT g.name) FILTER (WHERE g.name IS NOT NULL) as assigned_grahas
FROM projects p
LEFT JOIN priest_assignments pa ON p.id = pa.project_id
LEFT JOIN profiles pr ON pa.priest_id = pr.id
LEFT JOIN delegation_sessions ds ON p.id = ds.project_id AND pa.priest_id = ds.user_id
LEFT JOIN project_grahas pg ON p.id = pg.project_id
LEFT JOIN grahas g ON pg.graha_id = g.id
GROUP BY p.id, p.name, pa.id, pa.priest_id, pr.display_name, pa.assignment_type;

-- ============================================================================
-- 7. TRIGGERS: Keep project_grahas.completed_count in sync
-- ============================================================================

-- Function to update completed_count when delegation_sessions change
CREATE OR REPLACE FUNCTION update_project_graha_completed_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' AND NEW.session_status = 'completed' THEN
    UPDATE project_grahas
    SET completed_count = completed_count + NEW.count,
        updated_at = now()
    WHERE id = NEW.project_graha_id;
  ELSIF TG_OP = 'UPDATE' THEN
    IF OLD.session_status != 'completed' AND NEW.session_status = 'completed' THEN
      -- Transitioning to completed
      UPDATE project_grahas
      SET completed_count = completed_count + NEW.count,
          updated_at = now()
      WHERE id = NEW.project_graha_id;
    ELSIF OLD.session_status = 'completed' AND NEW.session_status != 'completed' THEN
      -- Reverting from completed
      UPDATE project_grahas
      SET completed_count = GREATEST(completed_count - OLD.count, 0),
          updated_at = now()
      WHERE id = NEW.project_graha_id;
    ELSIF OLD.session_status = 'completed' AND NEW.session_status = 'completed' AND OLD.count != NEW.count THEN
      -- Updating count while completed
      UPDATE project_grahas
      SET completed_count = completed_count + (NEW.count - OLD.count),
          updated_at = now()
      WHERE id = NEW.project_graha_id;
    END IF;
  ELSIF TG_OP = 'DELETE' AND OLD.session_status = 'completed' THEN
    UPDATE project_grahas
    SET completed_count = GREATEST(completed_count - OLD.count, 0),
        updated_at = now()
    WHERE id = OLD.project_graha_id;
  END IF;
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_project_graha_completed_count ON delegation_sessions;
CREATE TRIGGER tr_update_project_graha_completed_count
AFTER INSERT OR UPDATE OR DELETE ON delegation_sessions
FOR EACH ROW EXECUTE FUNCTION update_project_graha_completed_count();

-- ============================================================================
-- 8. MIGRATION: Optional helper to backfill user_roles from existing users
-- ============================================================================

-- All existing users start as regular_users (can be promoted via app logic)
INSERT INTO user_roles (user_id, role)
SELECT id, 'regular_user' FROM profiles
ON CONFLICT (user_id) DO NOTHING;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
