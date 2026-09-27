-- The app now calls the real SoHum Jyotisha panchangam service
-- (apps/web/src/app/api/panchang/route.ts -> https://panchangam-eight.vercel.app)
-- instead of this local synodic-approximation RPC. Dropping it rather than
-- leaving it dormant -- that's exactly the kind of drift
-- 20260927000001_drop_dead_pre_v2_functions.sql already cleaned up once.
drop function if exists public.panchang(date, double precision, double precision);
