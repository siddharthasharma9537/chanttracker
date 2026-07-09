-- Priority 2: sankalpa capture + completion certificate.
-- Adds the traditional sankalpa fields (gotra, nakshatra, intention) and
-- auto-completes a project when every graha hits its target, so a
-- completion date actually means something on the certificate.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS beneficiary_gotra text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS beneficiary_nakshatra text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS intention text;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS completed_at timestamptz;

CREATE OR REPLACE FUNCTION check_project_completion() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM project_grahas
    WHERE project_id = NEW.project_id AND completed_count < target_count
  ) THEN
    UPDATE projects
    SET status = 'completed', completed_at = now()
    WHERE id = NEW.project_id AND status <> 'completed';
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_check_project_completion ON project_grahas;
CREATE TRIGGER trg_check_project_completion
AFTER UPDATE ON project_grahas
FOR EACH ROW EXECUTE FUNCTION check_project_completion();

-- Certificate data — sankalpa + per-graha breakdown, no account needed.
-- Return shape changed, so drop first (CREATE OR REPLACE can't alter columns).
DROP FUNCTION IF EXISTS project_progress_by_share_code(text);
CREATE FUNCTION project_progress_by_share_code(p_share_code text)
RETURNS TABLE (
  beneficiary_name text, beneficiary_gotra text, beneficiary_nakshatra text,
  intention text, description text, status text,
  created_at timestamptz, completed_at timestamptz,
  graha_name text, graha_color text, target_count integer, completed_count integer
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT p.beneficiary_name, p.beneficiary_gotra, p.beneficiary_nakshatra,
         p.intention, p.description, p.status, p.created_at, p.completed_at,
         g.name, g.color, pg.target_count, pg.completed_count
  FROM projects p
  JOIN project_grahas pg ON pg.project_id = p.id
  JOIN grahas g ON g.id = pg.graha_id
  WHERE p.share_code = upper(p_share_code)
  ORDER BY g.orbit_order;
$$;

GRANT EXECUTE ON FUNCTION project_progress_by_share_code(text) TO anon;
