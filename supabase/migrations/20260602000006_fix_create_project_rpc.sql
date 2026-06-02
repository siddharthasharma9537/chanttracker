-- Fix ambiguous column reference in create_project RPC

CREATE OR REPLACE FUNCTION create_project(
  p_host_priest_id uuid,
  p_client_name text,
  p_description text DEFAULT NULL,
  p_graha_ids integer[] DEFAULT ARRAY[]::integer[]
)
RETURNS TABLE (project_id uuid, status text, total_target_count integer) AS $$
DECLARE
  v_project_id UUID;
  v_graha_id INTEGER;
  v_default_target INT := 108000;
BEGIN
  INSERT INTO projects (host_priest_id, client_name, description, status)
  VALUES (p_host_priest_id, p_client_name, p_description, 'active')
  RETURNING projects.id INTO v_project_id;

  IF p_graha_ids IS NOT NULL AND array_length(p_graha_ids, 1) > 0 THEN
    FOREACH v_graha_id IN ARRAY p_graha_ids LOOP
      INSERT INTO project_grahas (project_id, graha_id, target_count)
      VALUES (v_project_id, v_graha_id, v_default_target);
    END LOOP;

    UPDATE projects
    SET total_target_count = (
      SELECT COALESCE(SUM(target_count), 0) FROM project_grahas
      WHERE project_grahas.project_id = v_project_id
    )
    WHERE projects.id = v_project_id;
  END IF;

  RETURN QUERY
  SELECT v_project_id, 'active'::TEXT, COALESCE(
    (SELECT total_target_count FROM projects WHERE id = v_project_id), 0
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
