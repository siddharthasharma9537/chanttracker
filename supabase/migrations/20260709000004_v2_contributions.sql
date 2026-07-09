-- Per-chanter, per-graha contribution breakdown for a project. The raw
-- data has existed since sessions.project_id/graha_id — nothing
-- aggregated or surfaced it. profiles is locked to own-row RLS, so
-- this is a SECURITY DEFINER RPC scoped to project members/organizer,
-- same pattern as list_project_members.

CREATE FUNCTION list_project_contributions(p_project_id uuid)
RETURNS TABLE (
  graha_id integer, graha_name text, graha_color text, orbit_order integer,
  user_id uuid, display_name text, email text, total_count bigint
)
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT g.id, g.name, g.color, g.orbit_order,
         s.user_id, p.display_name, p.email, sum(s.count) AS total_count
  FROM sessions s
  JOIN grahas g ON g.id = s.graha_id
  JOIN profiles p ON p.id = s.user_id
  WHERE s.project_id = p_project_id
    AND s.status = 'completed'
    AND (is_project_member(p_project_id)
         OR EXISTS (SELECT 1 FROM projects pr
                    WHERE pr.id = p_project_id AND pr.organizer_id = auth.uid()))
  GROUP BY g.id, g.name, g.color, g.orbit_order, s.user_id, p.display_name, p.email
  ORDER BY g.orbit_order, total_count DESC;
$$;
