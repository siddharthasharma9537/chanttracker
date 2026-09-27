-- Personal sankalpa (daily intention) progress tracking. The sankalpas table
-- already exists with a rich schema (purpose, target_count, achieved_count,
-- sankalpa_status, intention_text) from pre-v2 history, but nothing in the
-- current app updates it. This RPC gives it the same atomic,
-- ownership-checked, auto-completing update pattern as mark_anushthana_day,
-- rather than a client-side read-then-write on achieved_count.
create or replace function public.log_sankalpa_progress(p_user uuid, p_sankalpa uuid, p_delta integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_s sankalpas%rowtype;
  v_achieved int;
begin
  select * into v_s from sankalpas
   where id = p_sankalpa and user_id = p_user and sankalpa_status = 'active'
   for update;

  if not found then
    return jsonb_build_object('error', 'sankalpa_not_found_or_not_active');
  end if;

  v_achieved := greatest(0, v_s.achieved_count + p_delta);

  update sankalpas
     set achieved_count = v_achieved,
         sankalpa_status = case when v_achieved >= target_count then 'completed' else sankalpa_status end,
         completed_at = case when v_achieved >= target_count then now() else completed_at end
   where id = p_sankalpa;

  return jsonb_build_object(
    'ok', true,
    'achieved_count', v_achieved,
    'target_count', v_s.target_count,
    'completed', v_achieved >= v_s.target_count
  );
end;
$$;
