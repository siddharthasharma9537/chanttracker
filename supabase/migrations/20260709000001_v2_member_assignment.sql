-- Per-graha chanter assignment: project_members.assigned_graha_ids already
-- existed but was unused. Add a way for an organizer to see who's on their
-- project (profiles is locked to own-row RLS) and assign specific grahas.

CREATE FUNCTION list_project_members(p_project_id uuid)
RETURNS TABLE (
  user_id uuid, role text, assigned_graha_ids integer[],
  display_name text, email text, joined_at timestamptz
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT pm.user_id, pm.role, pm.assigned_graha_ids,
         p.display_name, p.email, pm.created_at
  FROM project_members pm
  JOIN profiles p ON p.id = pm.user_id
  WHERE pm.project_id = p_project_id
    AND (is_project_member(p_project_id)
         OR EXISTS (SELECT 1 FROM projects pr
                    WHERE pr.id = p_project_id AND pr.organizer_id = auth.uid()))
  ORDER BY pm.role, pm.created_at;
$$;
