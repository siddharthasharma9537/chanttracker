-- Sessions are inserted directly as 'completed' (one write per chant
-- session), so the rollup trigger must fire on INSERT too.
CREATE OR REPLACE FUNCTION roll_up_project_session() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.project_id IS NOT NULL AND NEW.graha_id IS NOT NULL
     AND (TG_OP = 'INSERT' OR OLD.status IS DISTINCT FROM 'completed') THEN
    UPDATE project_grahas
    SET completed_count = completed_count + NEW.count
    WHERE project_id = NEW.project_id AND graha_id = NEW.graha_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_roll_up_project_session ON sessions;
CREATE TRIGGER trg_roll_up_project_session
AFTER INSERT OR UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION roll_up_project_session();
