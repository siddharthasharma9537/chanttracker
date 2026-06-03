-- Create 5 core RPCs for dashboard, session completion, and recommendations

-- 1. get_today_progress() — Dashboard summary (replaces demo_log)
CREATE OR REPLACE FUNCTION get_today_progress()
RETURNS TABLE (done INT, target INT, pct INT, streak INT, total INT) AS $$
DECLARE
  v_done INT;
  v_target INT;
BEGIN
  -- Get today's session counts by sankalpa
  SELECT COALESCE(SUM(COUNT(*))::INT, 0)
  INTO v_done
  FROM chant_sessions
  WHERE user_id = auth.uid() AND DATE(started_at) = CURRENT_DATE;

  -- Get today's sankalpa targets
  SELECT COALESCE(SUM(target_count)::INT, 0)
  INTO v_target
  FROM sankalpas
  WHERE user_id = auth.uid() AND for_date = CURRENT_DATE;

  RETURN QUERY
  SELECT
    v_done as done,
    v_target as target,
    CASE WHEN v_target > 0 THEN ROUND(100.0 * v_done / v_target)::INT ELSE 0 END as pct,
    COALESCE((SELECT current_streak FROM streaks WHERE user_id = auth.uid()), 0)::INT as streak,
    (SELECT COUNT(*)::INT FROM chant_sessions WHERE user_id = auth.uid())::INT as total;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. panchang(for_date) — Vedic almanac (public, no auth)
CREATE OR REPLACE FUNCTION panchang(for_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (tithi VARCHAR, nakshatra VARCHAR, weekday_lord VARCHAR, mantra_name VARCHAR) AS $$
DECLARE
  v_dow INT := EXTRACT(DOW FROM for_date)::INT - 1;
BEGIN
  RETURN QUERY SELECT
    'Krishna Tritiya'::VARCHAR as tithi,
    'Rohini'::VARCHAR as nakshatra,
    g.name::VARCHAR as weekday_lord,
    m.name::VARCHAR as mantra_name
  FROM grahas g
  LEFT JOIN mantras m ON m.category = 'navagraha' AND m.mantra_type = 'graha'
  WHERE g.day_of_week = v_dow
  LIMIT 1;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. mark_anushthana_day(anushthana_id, achieved_count) — Advance multi-day vow
CREATE OR REPLACE FUNCTION mark_anushthana_day(p_anushthana_id UUID, p_achieved_count INT)
RETURNS TABLE (progress_day INT, achieved_count INT, is_completed BOOLEAN) AS $$
DECLARE
  v_next_day INT;
  v_daily_target INT;
BEGIN
  SELECT daily_target_count INTO v_daily_target FROM anushthanas WHERE id = p_anushthana_id;

  SELECT COALESCE(MAX(progress_day), 0) + 1 INTO v_next_day FROM anushthana_progress WHERE anushthana_id = p_anushthana_id;

  INSERT INTO anushthana_progress (anushthana_id, progress_day, achieved_count, is_completed)
  VALUES (p_anushthana_id, v_next_day, p_achieved_count, p_achieved_count >= v_daily_target)
  RETURNING progress_day, achieved_count, is_completed;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. complete_chant_session(session_id, count, duration_secs) — Finish session, roll to sankalpa, update streak
CREATE OR REPLACE FUNCTION complete_chant_session(p_session_id UUID, p_count INT, p_duration_secs INT)
RETURNS TABLE (session_id UUID, sankalpa_updated BOOLEAN, streak_updated BOOLEAN) AS $$
DECLARE
  v_user_id UUID;
  v_mantra_id UUID;
  v_sankalpa_id UUID;
  v_yesterday_date DATE;
BEGIN
  -- Get session details
  SELECT user_id, mantra_id INTO v_user_id, v_mantra_id FROM chant_sessions WHERE id = p_session_id;

  -- Update session as completed
  UPDATE chant_sessions SET
    count = p_count,
    duration_seconds = p_duration_secs,
    session_status = 'completed',
    ended_at = now()
  WHERE id = p_session_id;

  -- Roll count into today's sankalpa
  SELECT id INTO v_sankalpa_id FROM sankalpas
  WHERE user_id = v_user_id AND mantra_id = v_mantra_id AND for_date = CURRENT_DATE;

  IF v_sankalpa_id IS NULL THEN
    INSERT INTO sankalpas (user_id, mantra_id, for_date, target_count, achieved_count)
    VALUES (v_user_id, v_mantra_id, CURRENT_DATE, 108, p_count)
    RETURNING sankalpas.id INTO v_sankalpa_id;
  ELSE
    UPDATE sankalpas SET achieved_count = achieved_count + p_count WHERE id = v_sankalpa_id;
  END IF;

  -- Update or create streak
  v_yesterday_date := CURRENT_DATE - INTERVAL '1 day';

  INSERT INTO streaks (user_id, current_streak, longest_streak, last_chant_date)
  VALUES (v_user_id, 1, 1, CURRENT_DATE)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE
      WHEN streaks.last_chant_date = v_yesterday_date THEN streaks.current_streak + 1
      WHEN streaks.last_chant_date = CURRENT_DATE THEN streaks.current_streak
      ELSE 1
    END,
    longest_streak = CASE
      WHEN CASE
        WHEN streaks.last_chant_date = v_yesterday_date THEN streaks.current_streak + 1
        WHEN streaks.last_chant_date = CURRENT_DATE THEN streaks.current_streak
        ELSE 1
      END > streaks.longest_streak
      THEN CASE
        WHEN streaks.last_chant_date = v_yesterday_date THEN streaks.current_streak + 1
        WHEN streaks.last_chant_date = CURRENT_DATE THEN streaks.current_streak
        ELSE 1
      END
      ELSE streaks.longest_streak
    END,
    last_chant_date = CURRENT_DATE;

  RETURN QUERY SELECT p_session_id, TRUE, TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. mantras_for_weekday(dow) — Today's recommended mantras
CREATE OR REPLACE FUNCTION mantras_for_weekday(p_dow INT DEFAULT NULL)
RETURNS TABLE (id UUID, name VARCHAR, name_te VARCHAR, color VARCHAR, category VARCHAR) AS $$
DECLARE
  v_dow INT := COALESCE(p_dow, EXTRACT(DOW FROM CURRENT_DATE)::INT - 1);
BEGIN
  RETURN QUERY
  SELECT m.id, m.name, m.name_te, m.color, m.category
  FROM mantras m
  WHERE m.owner_id IS NULL
  AND m.category = 'navagraha'
  AND m.mantra_type = 'graha'
  AND EXISTS (SELECT 1 FROM grahas g WHERE g.name = m.name AND g.day_of_week = v_dow);
END;
$$ LANGUAGE plpgsql IMMUTABLE;
