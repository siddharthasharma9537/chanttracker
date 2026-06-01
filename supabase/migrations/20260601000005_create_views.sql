-- Create 3 views for analytics and history

-- 1. v_weekly_chart — Last 7 days daily totals
CREATE OR REPLACE VIEW v_weekly_chart AS
SELECT
  DATE(cs.started_at) as date,
  EXTRACT(DOW FROM cs.started_at)::INT - 1 as day_of_week,
  SUM(cs.count) as total_count
FROM chant_sessions cs
WHERE cs.user_id = auth.uid()
AND DATE(cs.started_at) >= CURRENT_DATE - INTERVAL '7 days'
GROUP BY DATE(cs.started_at), day_of_week;

ALTER VIEW v_weekly_chart OWNER TO postgres;

-- 2. v_user_stats — Lifetime stats
CREATE OR REPLACE VIEW v_user_stats AS
SELECT
  COALESCE(SUM(cs.count), 0) as lifetime_count,
  COUNT(DISTINCT DATE(cs.started_at)) as active_days,
  ROUND(COALESCE(SUM(cs.count)::DECIMAL / NULLIF(COUNT(DISTINCT DATE(cs.started_at)), 0), 0))::INT as avg_daily
FROM chant_sessions cs
WHERE cs.user_id = auth.uid();

ALTER VIEW v_user_stats OWNER TO postgres;

-- 3. v_top_mantra — Most-chanted mantra
CREATE OR REPLACE VIEW v_top_mantra AS
SELECT
  m.id,
  m.name,
  m.name_te,
  SUM(cs.count) as total_count
FROM chant_sessions cs
JOIN mantras m ON cs.mantra_id = m.id
WHERE cs.user_id = auth.uid()
GROUP BY m.id, m.name, m.name_te
ORDER BY total_count DESC
LIMIT 1;

ALTER VIEW v_top_mantra OWNER TO postgres;
