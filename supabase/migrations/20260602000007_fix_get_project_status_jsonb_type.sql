-- Fix get_project_status RPC: Cast json_agg() result to JSONB
-- Issue: Function signature expects JSONB but json_agg() returns JSON
-- This causes "structure of query does not match function result type" error

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
    COALESCE(
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
      ) FILTER (WHERE pg.graha_id IS NOT NULL),
      '[]'::JSON
    )::JSONB
  FROM projects p
  LEFT JOIN project_grahas pg ON p.id = pg.project_id
  LEFT JOIN grahas g ON pg.graha_id = g.id
  WHERE p.id = p_project_id
  GROUP BY p.id, p.client_name, p.status;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
