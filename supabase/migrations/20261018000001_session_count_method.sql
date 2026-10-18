-- How a session's count was made (sohum-contracts CHANT_COUNTING_SHAPE.md section 5, decision 30).
-- voice_count: counted on the device from the person's chanting; tap: counted by taps;
-- manual: typed or spoken as a number. Existing rows and callers that omit it are 'manual'.
alter table public.sessions
  add column if not exists method text not null default 'manual'
  constraint sessions_method_check check (method in ('voice_count', 'tap', 'manual'));
