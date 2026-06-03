-- Fix get_today_progress() RPC - correct GROUP BY clause issue
-- The original query had an invalid GROUP BY when joining with sankalpas
-- This version uses explicit variable assignment for clarity

CREATE OR REPLACE FUNCTION get_today_progress()
RETURNS TABLE (done INT, target INT, pct INT, streak INT, total INT) AS $$
DECLARE
  v_done INT;
  v_target INT;
BEGIN
  -- Get today's session counts
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
