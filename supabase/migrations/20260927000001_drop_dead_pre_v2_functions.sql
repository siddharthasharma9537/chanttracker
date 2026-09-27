-- Reconciliation: these functions/overloads pre-date the v2 reset and were never
-- reflected in a committed migration file (supabase migration history had drifted
-- from git — applied migrations named 11_enhance_profiles..20_update_demo_rpcs_and_views
-- and 17b/17c/17d panchang fixes exist in the live project's migration history with
-- no matching files in this repo). All are confirmed unused by app code (grep) and
-- unreachable via any live trigger, verified directly against the live database
-- before dropping.

-- Broken duplicate overload: references anushthana_progress.progress_day / .is_completed,
-- neither of which exists on the current table (id, anushthana_id, for_date,
-- achieved_count, session_count, created_at). The correct overload,
-- mark_anushthana_day(p_user uuid, p_anushthana uuid, p_achieved integer), is kept.
drop function if exists public.mark_anushthana_day(uuid, integer);

-- Broken duplicate overload: references grahas.day_of_week and mantras.name, neither of
-- which exist on the current tables; hardcodes fake tithi/nakshatra output. The correct
-- overload, panchang(p_date date, p_lat float8, p_lon float8), is kept — it's a real
-- synodic-approximation tithi/nakshatra calculation, just never called by the app yet.
drop function if exists public.panchang(date);

-- Orphaned trigger functions referencing the dropped chant_sessions table
-- (supabase/migrations/20260708000001_v2_schema.sql); confirmed no live trigger binds
-- to either.
drop function if exists public.anti_fraud_check();
drop function if exists public.anti_fraud_rate_limit();

-- Orphaned RPC referencing the dropped chant_sessions table and a sankalpa_id column
-- that was never part of the current sessions table; confirmed unused by app code.
drop function if exists public.get_today_progress();
