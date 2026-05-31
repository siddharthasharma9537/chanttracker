-- Fix demo_log RPC signature
-- The function was returning 9 columns but the type definition expected 5

-- Drop the broken function
DROP FUNCTION IF EXISTS demo_log(p_count integer, p_devanagari text);

-- Recreate with correct signature: should return progress summary like demo_progress
CREATE OR REPLACE FUNCTION demo_log(p_count integer, p_devanagari text)
RETURNS TABLE (
  done bigint,
  target integer,
  pct integer,
  streak integer,
  total bigint
) AS $$
DECLARE
  v_demo_user_id uuid;
  v_total_today bigint;
BEGIN
  -- Use a fixed demo user ID for testing
  v_demo_user_id := '00000000-0000-0000-0000-000000000001'::uuid;

  -- Get current progress before logging
  SELECT COALESCE(SUM(count), 0)
  INTO v_total_today
  FROM chant_sessions
  WHERE user_id = v_demo_user_id
    AND DATE(started_at) = CURRENT_DATE
    AND session_status = 'completed';

  -- Return updated progress
  RETURN QUERY
  SELECT
    (v_total_today + p_count)::bigint,  -- done
    500::integer,                        -- target (demo value)
    LEAST(100, ((v_total_today + p_count) * 100 / 500)::integer)::integer,  -- pct
    1::integer,                          -- streak (demo value)
    (v_total_today + p_count)::bigint    -- total
  ;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to anon (public)
GRANT EXECUTE ON FUNCTION demo_log(integer, text) TO anon;
GRANT EXECUTE ON FUNCTION demo_log(integer, text) TO authenticated;
