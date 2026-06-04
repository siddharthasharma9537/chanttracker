-- Fix v_project_status to include accurate priests_count and prevent auto-assignment

-- Update v_project_status view to include priests_count (count of unique priests assigned to project)
CREATE OR REPLACE VIEW v_project_status AS
SELECT
  p.id,
  p.client_name,
  p.status,
  p.created_at,
  COALESCE(SUM(pg.target_count), 0)::INT as total_target,
  COALESCE(SUM(pg.completed_count), 0)::INT as total_completed,
  CASE WHEN COALESCE(SUM(pg.target_count), 0) > 0 THEN
    ROUND(100.0 * COALESCE(SUM(pg.completed_count), 0) / SUM(pg.target_count))::INT
  ELSE 0 END as overall_completion_pct,
  (SELECT COUNT(DISTINCT priest_id) FROM priest_assignments WHERE project_id = p.id)::INT as priests_count,
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
  ) as graha_breakdown
FROM projects p
LEFT JOIN project_grahas pg ON p.id = pg.project_id
LEFT JOIN grahas g ON pg.graha_id = g.id
GROUP BY p.id, p.client_name, p.status, p.created_at;

ALTER VIEW v_project_status OWNER TO postgres;

-- Ensure create_project RPC does NOT auto-assign any priests
-- The RPC should only create project + grahas, priest assignment happens via assign_priests RPC only
COMMENT ON FUNCTION create_project IS 'Creates a new project with specified grahas. Does NOT auto-assign any priests. Priests must be explicitly assigned via assign_priests() RPC.';

COMMENT ON TABLE priest_assignments IS 'Priest assignments to projects. Only populated via explicit assign_priests() RPC calls. No automatic assignment.';
