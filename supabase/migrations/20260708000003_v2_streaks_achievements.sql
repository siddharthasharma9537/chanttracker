-- Phase 2 slice 1: streaks + achievements, wired to the v2 `sessions` table.
-- Both public.refresh_streak() and public.check_achievements() still
-- referenced the dropped v1 `chant_sessions` table; repoint at `sessions`.
-- refresh_streak also required a pre-existing streaks row — make it upsert.

CREATE OR REPLACE FUNCTION public.refresh_streak(p_user uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_today date := (now() at time zone 'Asia/Kolkata')::date;
        v_last  date;
        v_cur   int;
        v_long  int;
BEGIN
  SELECT last_chant_date, current_streak, longest_streak
    INTO v_last, v_cur, v_long FROM streaks WHERE user_id = p_user;

  IF v_last IS NULL OR v_last < v_today - 1 THEN
    v_cur := 1;
  ELSIF v_last = v_today - 1 THEN
    v_cur := coalesce(v_cur, 0) + 1;
  END IF; -- v_last = today => unchanged

  v_long := greatest(coalesce(v_long, 0), v_cur);

  INSERT INTO streaks (user_id, current_streak, longest_streak, last_chant_date, updated_at)
  VALUES (p_user, v_cur, v_long, v_today, now())
  ON CONFLICT (user_id) DO UPDATE
    SET current_streak = excluded.current_streak,
        longest_streak = excluded.longest_streak,
        last_chant_date = excluded.last_chant_date,
        updated_at = now();
END $$;

CREATE OR REPLACE FUNCTION public.check_achievements(p_user uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  INSERT INTO user_achievements (user_id, achievement_id)
  SELECT p_user, a.id
  FROM achievements a
  WHERE NOT EXISTS (
        SELECT 1 FROM user_achievements ua
        WHERE ua.user_id = p_user AND ua.achievement_id = a.id)
    AND CASE a.metric
      WHEN 'total_japas' THEN
        (SELECT coalesce(sum(count), 0) FROM sessions WHERE user_id = p_user AND status = 'completed') >= a.threshold
      WHEN 'single_mantra_japas' THEN
        (SELECT coalesce(max(s), 0) FROM (
            SELECT sum(count) s FROM sessions
            WHERE user_id = p_user AND status = 'completed' AND mantra_id IS NOT NULL
            GROUP BY mantra_id) t) >= a.threshold
      WHEN 'streak_days' THEN
        (SELECT coalesce(longest_streak, 0) FROM streaks WHERE user_id = p_user) >= a.threshold
      WHEN 'session_count' THEN
        (SELECT count(*) FROM sessions WHERE user_id = p_user AND status = 'completed') >= a.threshold
    END;
END $$;

-- Fire both after every completed session insert (sessions are written
-- directly as 'completed' — one insert per finished chant).
CREATE OR REPLACE FUNCTION public.on_session_completed() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 'completed' THEN
    PERFORM refresh_streak(NEW.user_id);
    PERFORM check_achievements(NEW.user_id);
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_on_session_completed ON sessions;
CREATE TRIGGER trg_on_session_completed
AFTER INSERT ON sessions
FOR EACH ROW EXECUTE FUNCTION on_session_completed();

-- streaks/achievements are per-user private data
ALTER TABLE streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_achievements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS streaks_own ON streaks;
CREATE POLICY streaks_own ON streaks FOR SELECT USING (user_id = auth.uid());

DROP POLICY IF EXISTS achievements_read ON achievements;
CREATE POLICY achievements_read ON achievements FOR SELECT USING (true);

DROP POLICY IF EXISTS user_achievements_own ON user_achievements;
CREATE POLICY user_achievements_own ON user_achievements FOR SELECT USING (user_id = auth.uid());
