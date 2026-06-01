-- Create 3 triggers for automation

-- 1. on_auth_user_signup — Initialize user with default streaks/achievements
CREATE OR REPLACE FUNCTION on_auth_user_signup()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.streaks (user_id, current_streak, longest_streak, last_chant_date)
  VALUES (NEW.id, 0, 0, NULL)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_signup ON auth.users;
CREATE TRIGGER on_auth_user_signup
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION on_auth_user_signup();

-- 2. anti_fraud_rate_limit — Prevent rapid session inserts (max 1 per 5 seconds per user-mantra combo)
CREATE OR REPLACE FUNCTION anti_fraud_rate_limit()
RETURNS TRIGGER AS $$
DECLARE
  v_recent_count INT;
BEGIN
  SELECT COUNT(*) INTO v_recent_count
  FROM chant_sessions
  WHERE user_id = NEW.user_id
    AND mantra_id = NEW.mantra_id
    AND started_at > NOW() - INTERVAL '5 seconds';

  IF v_recent_count > 0 THEN
    RAISE EXCEPTION 'Rate limit exceeded: max 1 session per 5 seconds';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS anti_fraud_rate_limit ON chant_sessions;
CREATE TRIGGER anti_fraud_rate_limit
  BEFORE INSERT ON chant_sessions
  FOR EACH ROW
  EXECUTE FUNCTION anti_fraud_rate_limit();

-- 3. on_session_complete — When session marked complete, unlock achievements
CREATE OR REPLACE FUNCTION on_session_complete()
RETURNS TRIGGER AS $$
DECLARE
  v_user_id UUID;
  v_total_sessions INT;
  v_lifetime_count INT;
  v_current_streak INT;
  v_unique_navagrahas INT;
  v_completed_anushthanas INT;
BEGIN
  -- Only process when status changes to 'completed'
  IF NEW.session_status != 'completed' OR (TG_OP = 'UPDATE' AND OLD.session_status = 'completed') THEN
    RETURN NEW;
  END IF;

  v_user_id := NEW.user_id;

  -- Get stats for achievement checks
  SELECT COUNT(*) INTO v_total_sessions FROM chant_sessions WHERE user_id = v_user_id AND session_status = 'completed';
  SELECT COALESCE(SUM(count), 0) INTO v_lifetime_count FROM chant_sessions WHERE user_id = v_user_id AND session_status = 'completed';
  SELECT COALESCE(current_streak, 0) INTO v_current_streak FROM streaks WHERE user_id = v_user_id;
  SELECT COUNT(DISTINCT m.id) INTO v_unique_navagrahas
    FROM chant_sessions cs
    JOIN mantras m ON cs.mantra_id = m.id
    WHERE cs.user_id = v_user_id
      AND m.category = 'navagraha'
      AND cs.session_status = 'completed';
  SELECT COUNT(*) INTO v_completed_anushthanas
    FROM anushthanas
    WHERE user_id = v_user_id
      AND (SELECT MAX(progress_day) FROM anushthana_progress WHERE anushthana_id = anushthanas.id) >= total_days;

  -- Award achievements (idempotent: only insert if not exists)

  -- first_chant: Complete any session
  IF v_total_sessions >= 1 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT v_user_id, a.id FROM achievements a WHERE a.slug = 'first_chant'
    ON CONFLICT DO NOTHING;
  END IF;

  -- seven_day_streak: 7+ day streak
  IF v_current_streak >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT v_user_id, a.id FROM achievements a WHERE a.slug = 'seven_day_streak'
    ON CONFLICT DO NOTHING;
  END IF;

  -- thirty_day_streak: 30+ day streak
  IF v_current_streak >= 30 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT v_user_id, a.id FROM achievements a WHERE a.slug = 'thirty_day_streak'
    ON CONFLICT DO NOTHING;
  END IF;

  -- hundred_day_streak: 100+ day streak
  IF v_current_streak >= 100 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT v_user_id, a.id FROM achievements a WHERE a.slug = 'hundred_day_streak'
    ON CONFLICT DO NOTHING;
  END IF;

  -- thousand_mantras: 1000+ total count
  IF v_lifetime_count >= 1000 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT v_user_id, a.id FROM achievements a WHERE a.slug = 'thousand_mantras'
    ON CONFLICT DO NOTHING;
  END IF;

  -- all_navagrahas: Chanted all 9 Navagrahas
  IF v_unique_navagrahas >= 9 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT v_user_id, a.id FROM achievements a WHERE a.slug = 'all_navagrahas'
    ON CONFLICT DO NOTHING;
  END IF;

  -- weekly_completionist: 7 consecutive days with target met
  -- (Simplified: check if last 7 days all have sessions)
  IF (SELECT COUNT(DISTINCT DATE(started_at)) FROM chant_sessions WHERE user_id = v_user_id AND DATE(started_at) >= CURRENT_DATE - INTERVAL '7 days') >= 7 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT v_user_id, a.id FROM achievements a WHERE a.slug = 'weekly_completionist'
    ON CONFLICT DO NOTHING;
  END IF;

  -- anushthana_master: Completed 3+ multi-day vows
  IF v_completed_anushthanas >= 3 THEN
    INSERT INTO user_achievements (user_id, achievement_id)
    SELECT v_user_id, a.id FROM achievements a WHERE a.slug = 'anushthana_master'
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_session_complete ON chant_sessions;
CREATE TRIGGER on_session_complete
  AFTER UPDATE ON chant_sessions
  FOR EACH ROW
  EXECUTE FUNCTION on_session_complete();
