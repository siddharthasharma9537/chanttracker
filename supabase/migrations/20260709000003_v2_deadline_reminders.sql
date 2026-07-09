-- Priority 4: project deadlines (-> daily quota shown in the UI) and
-- daily practice reminders. profiles.reminder_time already existed
-- from v1 and was unused; no new column needed for that half.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS deadline date;

-- Certificate/beneficiary RPC gains deadline. Return shape changed,
-- so drop first (CREATE OR REPLACE can't alter columns).
DROP FUNCTION IF EXISTS project_progress_by_share_code(text);
CREATE FUNCTION project_progress_by_share_code(p_share_code text)
RETURNS TABLE (
  beneficiary_name text, beneficiary_gotra text, beneficiary_nakshatra text,
  intention text, description text, status text,
  created_at timestamptz, completed_at timestamptz, deadline date,
  graha_name text, graha_color text, target_count integer, completed_count integer
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT p.beneficiary_name, p.beneficiary_gotra, p.beneficiary_nakshatra,
         p.intention, p.description, p.status, p.created_at, p.completed_at,
         p.deadline, g.name, g.color, pg.target_count, pg.completed_count
  FROM projects p
  JOIN project_grahas pg ON pg.project_id = p.id
  JOIN grahas g ON g.id = pg.graha_id
  WHERE p.share_code = upper(p_share_code)
  ORDER BY g.orbit_order;
$$;

GRANT EXECUTE ON FUNCTION project_progress_by_share_code(text) TO anon;
