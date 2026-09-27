-- Global Yajnas: open, joinable collective japa campaigns with a leaderboard.
-- Distinct from `projects` (organizer/chanter/beneficiary, invite-code based) —
-- a yajna is public, anyone can join, and ranks participants by contribution.
-- Pure Postgres (no ClickHouse dependency, unlike chanttracker-app's version).

create table public.global_yajnas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  mantra_id uuid references public.mantras(id),
  target_count integer not null check (target_count > 0),
  completed_count integer not null default 0,
  start_date date not null default current_date,
  end_date date,
  status text not null default 'active' check (status in ('active','completed','archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.yajna_participants (
  id uuid primary key default gen_random_uuid(),
  yajna_id uuid not null references public.global_yajnas(id) on delete cascade,
  user_id uuid not null references auth.users(id),
  contributed_count integer not null default 0,
  joined_at timestamptz not null default now(),
  unique (yajna_id, user_id)
);

alter table public.sessions add column yajna_id uuid references public.global_yajnas(id);

alter table public.global_yajnas enable row level security;
alter table public.yajna_participants enable row level security;

-- Global yajnas are public campaigns: any authenticated user can see and join.
create policy "yajnas are publicly readable" on public.global_yajnas
  for select using (auth.role() = 'authenticated');
create policy "users can create yajnas" on public.global_yajnas
  for insert with check (auth.uid() = created_by);
create policy "creator can update own yajna" on public.global_yajnas
  for update using (auth.uid() = created_by);

-- Leaderboard rows are public to any authenticated user; only the trigger
-- (SECURITY DEFINER) writes contributed_count, so a direct client update
-- can't inflate it.
create policy "participant rows are publicly readable" on public.yajna_participants
  for select using (auth.role() = 'authenticated');
create policy "users can join a yajna" on public.yajna_participants
  for insert with check (auth.uid() = user_id);

create or replace function public.roll_up_yajna_session()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status = 'completed' and NEW.yajna_id is not null
     and (TG_OP = 'INSERT' or OLD.status is distinct from 'completed') then
    insert into yajna_participants (yajna_id, user_id, contributed_count)
    values (NEW.yajna_id, NEW.user_id, NEW.count)
    on conflict (yajna_id, user_id)
    do update set contributed_count = yajna_participants.contributed_count + NEW.count;

    update global_yajnas
       set completed_count = completed_count + NEW.count,
           status = case when completed_count + NEW.count >= target_count then 'completed' else status end
     where id = NEW.yajna_id;
  end if;
  return NEW;
end;
$$;

create trigger trg_roll_up_yajna_session
  after insert or update on public.sessions
  for each row execute function public.roll_up_yajna_session();
