-- ============================================================
-- ChantTracker v2 schema (see docs/REBUILD_SPEC.md)
-- Roles live on project_members, not app modes.
-- One sessions table for personal + project chanting.
-- mantra_texts replaces per-language text columns on mantras.
-- Pre-v2 schema had drifted (applied live); this migration is
-- the v2 reset. mantras + grahas are kept (data is valuable).
-- ============================================================

-- ---------- 1. mantra_texts ----------
CREATE TABLE mantra_texts (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mantra_id   uuid NOT NULL REFERENCES mantras(id) ON DELETE CASCADE,
  lang        text NOT NULL,              -- 'te','sa','en','hi','kn','ta','ml'
  script      text NOT NULL,              -- 'telugu','devanagari','latin'
  text        text NOT NULL,
  has_swaras  boolean NOT NULL DEFAULT false,
  UNIQUE (mantra_id, lang, has_swaras)
);

-- Backfill from the old columns on mantras
INSERT INTO mantra_texts (mantra_id, lang, script, text, has_swaras)
SELECT id, 'te', 'telugu', mantra_telugu, true
FROM mantras WHERE mantra_telugu IS NOT NULL;

INSERT INTO mantra_texts (mantra_id, lang, script, text, has_swaras)
SELECT id, 'te', 'telugu', mantra_telugu_plain, false
FROM mantras WHERE mantra_telugu_plain IS NOT NULL
  AND mantra_telugu_plain IS DISTINCT FROM mantra_telugu;

INSERT INTO mantra_texts (mantra_id, lang, script, text, has_swaras)
SELECT id, 'sa', 'devanagari', devanagari,
       devanagari ~ ('[॒॑' || U&'\1CD0' || '-' || U&'\1CFF' || ']')
FROM mantras WHERE devanagari IS NOT NULL;

ALTER TABLE mantra_texts ENABLE ROW LEVEL SECURITY;
CREATE POLICY mantra_texts_read ON mantra_texts FOR SELECT USING (true);
-- writes: service role only for now (custom mantras are phase 2)

-- ---------- 2. Drop v1 delegation + session plumbing ----------
DROP FUNCTION IF EXISTS create_project(uuid, text, text, integer[]) CASCADE;
DROP FUNCTION IF EXISTS assign_priests(uuid, jsonb) CASCADE;
DROP FUNCTION IF EXISTS get_project_status(uuid) CASCADE;
DROP FUNCTION IF EXISTS log_delegation_session(uuid, uuid, integer, integer, integer, text) CASCADE;
DROP FUNCTION IF EXISTS get_project_history(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_priest_contributions(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_graha_contributions(uuid, integer) CASCADE;
DROP FUNCTION IF EXISTS get_priest_assignments(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_priest_dashboard(uuid) CASCADE;
DROP FUNCTION IF EXISTS complete_delegation_project(uuid) CASCADE;
DROP FUNCTION IF EXISTS complete_chant_session(uuid) CASCADE;
DROP FUNCTION IF EXISTS get_today_progress(uuid) CASCADE;  -- was broken (GROUP BY bug)

DROP VIEW IF EXISTS v_project_status CASCADE;
DROP VIEW IF EXISTS v_priest_contributions CASCADE;

DROP TABLE IF EXISTS delegation_sessions CASCADE;
DROP TABLE IF EXISTS priest_assignments CASCADE;
DROP TABLE IF EXISTS project_grahas CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS chant_sessions CASCADE;

-- ---------- 3. Projects ----------
CREATE TABLE projects (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  beneficiary_name text NOT NULL,
  description      text,
  status           text NOT NULL DEFAULT 'active'
                   CHECK (status IN ('active','completed','archived')),
  invite_code      text NOT NULL UNIQUE
                   DEFAULT upper(substr(md5(random()::text), 1, 6)),
  share_code       text NOT NULL UNIQUE
                   DEFAULT upper(substr(md5(random()::text), 1, 8)),
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE project_grahas (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  graha_id        integer NOT NULL REFERENCES grahas(id),
  target_count    integer NOT NULL CHECK (target_count > 0),
  completed_count integer NOT NULL DEFAULT 0,
  UNIQUE (project_id, graha_id)
);

CREATE TABLE project_members (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id         uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  user_id            uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role               text NOT NULL CHECK (role IN ('organizer','chanter')),
  assigned_graha_ids integer[] NOT NULL DEFAULT '{}',
  created_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, user_id)
);

-- ---------- 4. Unified sessions ----------
CREATE TABLE sessions (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mantra_id     uuid REFERENCES mantras(id),
  count         integer NOT NULL DEFAULT 0 CHECK (count >= 0),
  duration_secs integer,
  status        text NOT NULL DEFAULT 'active'
                CHECK (status IN ('active','completed','abandoned')),
  project_id    uuid REFERENCES projects(id) ON DELETE SET NULL,
  graha_id      integer REFERENCES grahas(id),
  started_at    timestamptz NOT NULL DEFAULT now(),
  completed_at  timestamptz
);
CREATE INDEX sessions_user_started ON sessions (user_id, started_at DESC);
CREATE INDEX sessions_project ON sessions (project_id) WHERE project_id IS NOT NULL;

-- Rollup: completed project sessions increment project_grahas.completed_count
CREATE OR REPLACE FUNCTION roll_up_project_session() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status IS DISTINCT FROM 'completed'
     AND NEW.project_id IS NOT NULL AND NEW.graha_id IS NOT NULL THEN
    UPDATE project_grahas
    SET completed_count = completed_count + NEW.count
    WHERE project_id = NEW.project_id AND graha_id = NEW.graha_id;
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER trg_roll_up_project_session
AFTER UPDATE ON sessions
FOR EACH ROW EXECUTE FUNCTION roll_up_project_session();

-- ---------- 5. RLS ----------
ALTER TABLE projects        ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_grahas  ENABLE ROW LEVEL SECURITY;
ALTER TABLE project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions        ENABLE ROW LEVEL SECURITY;

CREATE FUNCTION is_project_member(p_project uuid) RETURNS boolean
LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (SELECT 1 FROM project_members
                 WHERE project_id = p_project AND user_id = auth.uid());
$$;

CREATE POLICY projects_select ON projects FOR SELECT
  USING (organizer_id = auth.uid() OR is_project_member(id));
CREATE POLICY projects_insert ON projects FOR INSERT
  WITH CHECK (organizer_id = auth.uid());
CREATE POLICY projects_update ON projects FOR UPDATE
  USING (organizer_id = auth.uid());
CREATE POLICY projects_delete ON projects FOR DELETE
  USING (organizer_id = auth.uid());

CREATE POLICY pg_select ON project_grahas FOR SELECT
  USING (is_project_member(project_id)
         OR EXISTS (SELECT 1 FROM projects p
                    WHERE p.id = project_id AND p.organizer_id = auth.uid()));
CREATE POLICY pg_write ON project_grahas FOR ALL
  USING (EXISTS (SELECT 1 FROM projects p
                 WHERE p.id = project_id AND p.organizer_id = auth.uid()));

CREATE POLICY pm_select ON project_members FOR SELECT
  USING (user_id = auth.uid() OR is_project_member(project_id)
         OR EXISTS (SELECT 1 FROM projects p
                    WHERE p.id = project_id AND p.organizer_id = auth.uid()));
CREATE POLICY pm_manage ON project_members FOR ALL
  USING (EXISTS (SELECT 1 FROM projects p
                 WHERE p.id = project_id AND p.organizer_id = auth.uid()));

CREATE POLICY sessions_own ON sessions FOR ALL
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ---------- 6. RPCs ----------
-- Chanter joins a project via invite code
CREATE FUNCTION join_project(p_invite_code text) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_project uuid;
BEGIN
  SELECT id INTO v_project FROM projects
  WHERE invite_code = upper(p_invite_code) AND status = 'active';
  IF v_project IS NULL THEN RAISE EXCEPTION 'Invalid or inactive invite code'; END IF;
  INSERT INTO project_members (project_id, user_id, role)
  VALUES (v_project, auth.uid(), 'chanter')
  ON CONFLICT (project_id, user_id) DO NOTHING;
  RETURN v_project;
END $$;

-- Beneficiary progress: no account needed, keyed by share_code
CREATE FUNCTION project_progress_by_share_code(p_share_code text)
RETURNS TABLE (
  beneficiary_name text, description text, status text, created_at timestamptz,
  graha_name text, graha_color text, target_count integer, completed_count integer
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT p.beneficiary_name, p.description, p.status, p.created_at,
         g.name, g.color, pg.target_count, pg.completed_count
  FROM projects p
  JOIN project_grahas pg ON pg.project_id = p.id
  JOIN grahas g ON g.id = pg.graha_id
  WHERE p.share_code = upper(p_share_code)
  ORDER BY g.orbit_order;
$$;

GRANT EXECUTE ON FUNCTION project_progress_by_share_code(text) TO anon;
