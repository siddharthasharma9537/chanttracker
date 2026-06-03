-- Host/Delegation System - Additional schema elements
-- This migration adds views and functions that extend the delegation system
-- Tables are created in migration 20260601000007_create_delegation_system.sql

/* ═══════════════════════════════════════════════════════════════
   NOTE: Table definitions moved to 20260601000007
   All tables (projects, project_grahas, priest_assignments, delegation_sessions)
   are already created in 20260601000007. This migration now only adds
   additional views and functions.
   ═══════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════
   VIEWS: Analytics and aggregations
   ═══════════════════════════════════════════════════════════════ */

-- Views would go here, but they need to be rewritten to match the actual schema
-- from migration 20260601000007, which uses different column structures.

/* ═══════════════════════════════════════════════════════════════
   TRIGGERS: Automatic updates when sessions are logged
   ═══════════════════════════════════════════════════════════════ */

-- Update project_grahas.completed_count and projects.overall_completion_pct when sessions are logged
CREATE OR REPLACE FUNCTION fn_update_project_graha_completion()
RETURNS TRIGGER AS $$
DECLARE
  v_total_target INT;
  v_total_completed INT;
BEGIN
  -- Update project_grahas.completed_count
  UPDATE project_grahas
  SET completed_count = (
    SELECT COALESCE(SUM(count), 0) FROM delegation_sessions
    WHERE project_id = NEW.project_id AND graha_id = NEW.graha_id
  )
  WHERE project_id = NEW.project_id AND graha_id = NEW.graha_id;

  -- Update priest_assignments.completed_count
  UPDATE priest_assignments
  SET completed_count = (
    SELECT COALESCE(SUM(count), 0) FROM delegation_sessions
    WHERE project_id = NEW.project_id
      AND priest_id = NEW.priest_id
      AND graha_id = NEW.graha_id
  )
  WHERE project_id = NEW.project_id
    AND priest_id = NEW.priest_id
    AND graha_id = NEW.graha_id;

  -- Update projects.overall_completion_pct and total_target_count
  SELECT
    COALESCE(SUM(target_count), 0),
    COALESCE(SUM(completed_count), 0)
  INTO v_total_target, v_total_completed
  FROM project_grahas
  WHERE project_id = NEW.project_id;

  UPDATE projects
  SET
    total_target_count = v_total_target,
    overall_completion_pct = CASE WHEN v_total_target > 0 THEN
      ROUND(100.0 * v_total_completed / v_total_target)::INT
    ELSE 0 END,
    updated_at = now()
  WHERE id = NEW.project_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trig_update_project_graha_completion ON delegation_sessions;
CREATE TRIGGER trig_update_project_graha_completion
AFTER INSERT ON delegation_sessions
FOR EACH ROW EXECUTE FUNCTION fn_update_project_graha_completion();

/* ═══════════════════════════════════════════════════════════════
   RPCS: Core business logic
   ═══════════════════════════════════════════════════════════════ */

-- 1. create_project(host_priest_id, client_name, selected_graha_ids)
CREATE OR REPLACE FUNCTION create_project(
  p_host_priest_id UUID,
  p_client_name TEXT,
  p_description TEXT DEFAULT NULL,
  p_graha_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (project_id UUID, status TEXT, total_target_count INT) AS $$
DECLARE
  v_project_id UUID;
  v_graha_id UUID;
  v_default_target INT := 108000;
BEGIN
  -- Create project
  INSERT INTO projects (host_priest_id, client_name, description, status)
  VALUES (p_host_priest_id, p_client_name, p_description, 'active')
  RETURNING projects.id INTO v_project_id;

  -- If grahas provided, create project_grahas for each
  IF p_graha_ids IS NOT NULL AND array_length(p_graha_ids, 1) > 0 THEN
    FOREACH v_graha_id IN ARRAY p_graha_ids LOOP
      INSERT INTO project_grahas (project_id, graha_id, target_count)
      VALUES (v_project_id, v_graha_id, v_default_target);
    END LOOP;

    -- Update total_target_count
    UPDATE projects
    SET total_target_count = (
      SELECT COALESCE(SUM(target_count), 0) FROM project_grahas
      WHERE project_id = v_project_id
    )
    WHERE id = v_project_id;
  END IF;

  RETURN QUERY
  SELECT v_project_id, 'active'::TEXT, COALESCE(
    (SELECT total_target_count FROM projects WHERE id = v_project_id), 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. assign_priests(project_id, priest_assignments JSONB)
-- priest_assignments format: [{"priest_id": UUID, "priest_name": TEXT, "assigned_graha_ids": UUID[]}, ...]
CREATE OR REPLACE FUNCTION assign_priests(
  p_project_id UUID,
  p_priest_assignments JSONB
)
RETURNS TABLE (success BOOLEAN, assigned_count INT) AS $$
DECLARE
  v_assignment JSONB;
  v_priest_id UUID;
  v_graha_ids UUID[];
  v_graha_id UUID;
  v_target_count INT;
  v_count INT := 0;
BEGIN
  -- Iterate through assignments
  FOR v_assignment IN SELECT jsonb_array_elements(p_priest_assignments)
  LOOP
    v_priest_id := (v_assignment->>'priest_id')::UUID;
    v_graha_ids := (SELECT array_agg(x::UUID) FROM jsonb_array_elements_text(v_assignment->'assigned_graha_ids') x);

    -- Insert assignments for each graha
    FOREACH v_graha_id IN ARRAY v_graha_ids
    LOOP
      -- Get target count from project_grahas
      SELECT target_count INTO v_target_count
      FROM project_grahas
      WHERE project_id = p_project_id AND graha_id = v_graha_id;

      INSERT INTO priest_assignments (project_id, priest_id, graha_id, assignment_type, target_count)
      VALUES (p_project_id, v_priest_id, v_graha_id, 'assigned', v_target_count)
      ON CONFLICT (project_id, priest_id, graha_id) DO UPDATE
      SET assignment_type = 'assigned', updated_at = now();

      v_count := v_count + 1;
    END LOOP;
  END LOOP;

  RETURN QUERY SELECT TRUE, v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. get_project_status(project_id)
CREATE OR REPLACE FUNCTION get_project_status(p_project_id UUID)
RETURNS TABLE (
  client_name TEXT,
  status TEXT,
  overall_completion_pct INT,
  total_target INT,
  total_completed INT,
  graha_breakdown JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT
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
        ELSE 0 END,
        'assigned_priests', (
          SELECT json_agg(
            json_build_object('priest_id', pr.id, 'priest_name', pr.display_name, 'assignment_type', pa.assignment_type)
          )
          FROM priest_assignments pa
          JOIN profiles pr ON pa.priest_id = pr.id
          WHERE pa.project_id = p.id AND pa.graha_id = pg.graha_id
        )
      )
    )
  FROM projects p
  LEFT JOIN project_grahas pg ON p.id = pg.project_id
  LEFT JOIN grahas g ON pg.graha_id = g.id
  WHERE p.id = p_project_id
  GROUP BY p.id, p.client_name, p.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. get_priest_assignments(project_id, priest_id)
CREATE OR REPLACE FUNCTION get_priest_assignments(p_project_id UUID, p_priest_id UUID)
RETURNS TABLE (
  graha_id UUID,
  graha_name TEXT,
  target INT,
  completed INT,
  completion_pct INT,
  assignment_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    pa.graha_id,
    g.name,
    COALESCE(pa.target_count, pg.target_count, 0)::INT,
    COALESCE(pa.completed_count, 0)::INT,
    CASE WHEN COALESCE(pa.target_count, pg.target_count, 0) > 0 THEN
      ROUND(100.0 * COALESCE(pa.completed_count, 0) / COALESCE(pa.target_count, pg.target_count, 1))::INT
    ELSE 0 END,
    pa.assignment_type
  FROM priest_assignments pa
  JOIN grahas g ON pa.graha_id = g.id
  LEFT JOIN project_grahas pg ON pa.project_id = pg.project_id AND pa.graha_id = pg.graha_id
  WHERE pa.project_id = p_project_id AND pa.priest_id = p_priest_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. log_delegation_session(project_id, priest_id, graha_id, count, duration_secs, assignment_type)
CREATE OR REPLACE FUNCTION log_delegation_session(
  p_project_id UUID,
  p_priest_id UUID,
  p_graha_id UUID,
  p_count INT,
  p_duration_secs INT DEFAULT NULL,
  p_assignment_type TEXT DEFAULT 'assigned'
)
RETURNS TABLE (session_id UUID, session_date DATE) AS $$
DECLARE
  v_session_id UUID;
BEGIN
  -- Insert delegation session
  INSERT INTO delegation_sessions (
    project_id, priest_id, graha_id, count, duration_seconds, assignment_type, session_date
  )
  VALUES (p_project_id, p_priest_id, p_graha_id, p_count, p_duration_secs, p_assignment_type, CURRENT_DATE)
  RETURNING delegation_sessions.id INTO v_session_id;

  -- Trigger will update project_grahas and projects totals
  RETURN QUERY SELECT v_session_id, CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. get_priest_dashboard(project_id, priest_id)
CREATE OR REPLACE FUNCTION get_priest_dashboard(p_project_id UUID, p_priest_id UUID)
RETURNS TABLE (
  graha_id UUID,
  graha_name TEXT,
  target INT,
  completed INT,
  completion_pct INT,
  assignment_type TEXT,
  can_volunteer BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  -- Assigned grahas
  SELECT
    pa.graha_id,
    g.name,
    COALESCE(pa.target_count, pg.target_count, 0)::INT,
    COALESCE(pa.completed_count, 0)::INT,
    CASE WHEN COALESCE(pa.target_count, pg.target_count, 0) > 0 THEN
      ROUND(100.0 * COALESCE(pa.completed_count, 0) / COALESCE(pa.target_count, pg.target_count, 1))::INT
    ELSE 0 END,
    pa.assignment_type,
    FALSE
  FROM priest_assignments pa
  JOIN grahas g ON pa.graha_id = g.id
  LEFT JOIN project_grahas pg ON pa.project_id = pg.project_id AND pa.graha_id = pg.graha_id
  WHERE pa.project_id = p_project_id AND pa.priest_id = p_priest_id

  UNION ALL

  -- Incomplete grahas not yet assigned to this priest (can volunteer)
  SELECT
    pg.graha_id,
    g.name,
    pg.target_count,
    pg.completed_count,
    CASE WHEN pg.target_count > 0 THEN
      ROUND(100.0 * pg.completed_count / pg.target_count)::INT
    ELSE 0 END,
    'unassigned'::TEXT,
    TRUE
  FROM project_grahas pg
  JOIN grahas g ON pg.graha_id = g.id
  WHERE pg.project_id = p_project_id
    AND pg.completed_count < pg.target_count
    AND NOT EXISTS (
      SELECT 1 FROM priest_assignments pa
      WHERE pa.project_id = p_project_id
        AND pa.priest_id = p_priest_id
        AND pa.graha_id = pg.graha_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. get_graha_contributions(project_id, graha_id)
CREATE OR REPLACE FUNCTION get_graha_contributions(p_project_id UUID, p_graha_id UUID)
RETURNS TABLE (
  priest_id UUID,
  priest_name TEXT,
  completed_count INT,
  assignment_type TEXT,
  sessions_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    gc.priest_id,
    gc.priest_name,
    gc.completed_count,
    gc.assignment_type,
    gc.sessions_count
  FROM v_graha_contributions gc
  WHERE gc.project_id = p_project_id AND gc.graha_id = p_graha_id
  ORDER BY gc.completed_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. get_priest_contributions(project_id, priest_id)
CREATE OR REPLACE FUNCTION get_priest_contributions(p_project_id UUID, p_priest_id UUID)
RETURNS TABLE (
  graha_id UUID,
  graha_name TEXT,
  target INT,
  completed INT,
  completion_pct INT,
  assignment_type TEXT,
  sessions_count INT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    vpc.graha_id,
    vpc.graha_name,
    vpc.target,
    vpc.completed,
    CASE WHEN vpc.target > 0 THEN
      ROUND(100.0 * vpc.completed / vpc.target)::INT
    ELSE 0 END,
    vpc.assignment_type,
    vpc.sessions_count
  FROM v_priest_contributions vpc
  WHERE vpc.priest_id = p_priest_id AND vpc.project_id = p_project_id
  ORDER BY vpc.graha_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. get_project_history(project_id, start_date, end_date, priest_id, graha_id)
CREATE OR REPLACE FUNCTION get_project_history(
  p_project_id UUID,
  p_start_date DATE DEFAULT NULL,
  p_end_date DATE DEFAULT NULL,
  p_priest_id UUID DEFAULT NULL,
  p_graha_id UUID DEFAULT NULL
)
RETURNS TABLE (
  session_date DATE,
  priest_name TEXT,
  priest_id UUID,
  graha_name TEXT,
  graha_id UUID,
  count INT,
  duration_secs INT,
  assignment_type TEXT,
  session_id UUID
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ds.session_date,
    pr.display_name,
    ds.priest_id,
    g.name,
    ds.graha_id,
    ds.count,
    ds.duration_seconds,
    ds.assignment_type,
    ds.id
  FROM delegation_sessions ds
  JOIN profiles pr ON ds.priest_id = pr.id
  JOIN grahas g ON ds.graha_id = g.id
  WHERE ds.project_id = p_project_id
    AND (p_start_date IS NULL OR ds.session_date >= p_start_date)
    AND (p_end_date IS NULL OR ds.session_date <= p_end_date)
    AND (p_priest_id IS NULL OR ds.priest_id = p_priest_id)
    AND (p_graha_id IS NULL OR ds.graha_id = p_graha_id)
  ORDER BY ds.session_date DESC, ds.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. complete_delegation_project(project_id)
CREATE OR REPLACE FUNCTION complete_delegation_project(p_project_id UUID)
RETURNS TABLE (success BOOLEAN, completion_timestamp TIMESTAMP WITH TIME ZONE) AS $$
DECLARE
  v_now TIMESTAMP WITH TIME ZONE := now();
BEGIN
  UPDATE projects
  SET status = 'completed', completed_at = v_now, updated_at = v_now
  WHERE id = p_project_id;

  RETURN QUERY SELECT TRUE, v_now;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
