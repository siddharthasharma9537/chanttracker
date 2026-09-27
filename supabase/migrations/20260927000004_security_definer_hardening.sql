-- Harden the RPCs introduced/newly-wired this pass: derive identity from
-- auth.uid() instead of trusting a client-supplied p_user, which a
-- SECURITY DEFINER function must never do (get_advisors correctly flagged
-- these as callable by any authenticated — or anon — caller, who could pass
-- someone else's user id).

drop function if exists public.log_sankalpa_progress(uuid, uuid, integer);
create or replace function public.log_sankalpa_progress(p_sankalpa uuid, p_delta integer)
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
   where id = p_sankalpa and user_id = auth.uid() and sankalpa_status = 'active'
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

drop function if exists public.mark_anushthana_day(uuid, uuid, integer);
create or replace function public.mark_anushthana_day(p_anushthana uuid, p_achieved integer)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_today date := (now() at time zone 'Asia/Kolkata')::date;
  v_a     anushthanas%rowtype;
  v_done  int;
begin
  select * into v_a from anushthanas
   where id = p_anushthana and user_id = auth.uid() and status = 'active';

  if not found then
    return jsonb_build_object('error','anushthana_not_found_or_not_active');
  end if;
  if p_achieved < v_a.daily_target_count then
    return jsonb_build_object('error','target_not_met','required', v_a.daily_target_count);
  end if;

  insert into anushthana_progress(anushthana_id, for_date, achieved_count)
  values (p_anushthana, v_today, p_achieved)
  on conflict (anushthana_id, for_date) do nothing;

  if not found then
    return jsonb_build_object('error','day_already_marked');
  end if;

  select count(*) into v_done from anushthana_progress where anushthana_id = p_anushthana;
  if v_done >= v_a.total_days then
    update anushthanas set status = 'completed', completed_at = now(), updated_at = now()
     where id = p_anushthana;
  end if;

  return jsonb_build_object('ok', true, 'days_done', v_done, 'total_days', v_a.total_days);
end;
$$;

-- Trigger-only functions: firing a trigger never requires the calling role to
-- have EXECUTE on the function, so revoking it here only closes the
-- direct-RPC-call attack surface without affecting session logging.
revoke execute on function public.roll_up_yajna_session() from public, anon, authenticated;
