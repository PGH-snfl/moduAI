-- Review-first automatic refresh for mutable tool information.
-- The collector never changes public tool data directly. It creates a candidate
-- that an administrator must approve or reject.

alter table public.tools
  add column if not exists update_check_enabled boolean not null default true,
  add column if not exists update_last_checked_at timestamptz,
  add column if not exists update_check_error text;

create table if not exists public.tool_update_runs (
  id uuid primary key default gen_random_uuid(),
  trigger_type text not null default 'scheduled' check (trigger_type in ('scheduled', 'manual')),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  tools_checked integer not null default 0,
  candidates_created integer not null default 0,
  errors jsonb not null default '[]'::jsonb,
  started_at timestamptz not null default timezone('utc', now()),
  completed_at timestamptz
);

create table if not exists public.tool_update_candidates (
  id uuid primary key default gen_random_uuid(),
  run_id uuid references public.tool_update_runs(id) on delete set null,
  tool_id uuid not null references public.tools(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  source_url text not null,
  source_title text,
  current_values jsonb not null default '{}'::jsonb,
  proposed_updates jsonb not null default '{}'::jsonb,
  change_summary text not null,
  evidence jsonb not null default '[]'::jsonb,
  confidence numeric(4,3) not null default 0 check (confidence >= 0 and confidence <= 1),
  detected_at timestamptz not null default timezone('utc', now()),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  admin_notes text
);

create unique index if not exists tool_update_candidates_one_pending_per_tool
  on public.tool_update_candidates(tool_id) where status = 'pending';
create index if not exists tool_update_candidates_status_detected_idx
  on public.tool_update_candidates(status, detected_at desc);
create index if not exists tools_update_check_queue_idx
  on public.tools(update_check_enabled, update_last_checked_at nulls first);

alter table public.tool_update_runs enable row level security;
alter table public.tool_update_candidates enable row level security;

drop policy if exists "Admins read tool update runs" on public.tool_update_runs;
create policy "Admins read tool update runs" on public.tool_update_runs for select to authenticated
using (auth.jwt()->'app_metadata'->>'role' = 'admin');

drop policy if exists "Admins read tool update candidates" on public.tool_update_candidates;
create policy "Admins read tool update candidates" on public.tool_update_candidates for select to authenticated
using (auth.jwt()->'app_metadata'->>'role' = 'admin');

create or replace function public.review_tool_update_candidate(
  p_candidate_id uuid,
  p_decision text,
  p_admin_notes text default null
) returns public.tool_update_candidates
language plpgsql security definer set search_path = public
as $$
declare
  v_candidate public.tool_update_candidates%rowtype;
  v_updates jsonb;
begin
  if auth.role() <> 'authenticated' or coalesce(auth.jwt()->'app_metadata'->>'role', '') <> 'admin' then
    raise exception 'Administrator permission required' using errcode = '42501';
  end if;
  if p_decision not in ('approved', 'rejected') then
    raise exception 'Decision must be approved or rejected' using errcode = '22023';
  end if;

  select * into v_candidate from public.tool_update_candidates
  where id = p_candidate_id for update;
  if not found then raise exception 'Candidate not found' using errcode = 'P0002'; end if;
  if v_candidate.status <> 'pending' then raise exception 'Candidate already reviewed' using errcode = '23514'; end if;

  if p_decision = 'approved' then
    v_updates := v_candidate.proposed_updates;
    update public.tools set
      pricing_type = case when v_updates ? 'pricing_type' then v_updates->>'pricing_type' else pricing_type end,
      pricing_start_at = case when v_updates ? 'pricing_start_at' then v_updates->>'pricing_start_at' else pricing_start_at end,
      pricing_summary = case when v_updates ? 'pricing_summary' then v_updates->>'pricing_summary' else pricing_summary end,
      pricing_details = case when v_updates ? 'pricing_details' then array(select jsonb_array_elements_text(v_updates->'pricing_details')) else pricing_details end,
      pricing_currency = case when v_updates ? 'pricing_currency' then v_updates->>'pricing_currency' else pricing_currency end,
      pricing_url = case when v_updates ? 'pricing_url' then v_updates->>'pricing_url' else pricing_url end,
      has_api = case when v_updates ? 'has_api' then (v_updates->>'has_api')::boolean else has_api end,
      api_url = case when v_updates ? 'api_url' then v_updates->>'api_url' else api_url end,
      korean_support_level = case when v_updates ? 'korean_support_level' then v_updates->>'korean_support_level' else korean_support_level end,
      primary_features = case when v_updates ? 'primary_features' then array(select jsonb_array_elements_text(v_updates->'primary_features')) else primary_features end,
      secondary_features = case when v_updates ? 'secondary_features' then array(select jsonb_array_elements_text(v_updates->'secondary_features')) else secondary_features end,
      key_benefits = case when v_updates ? 'key_benefits' then array(select jsonb_array_elements_text(v_updates->'key_benefits')) else key_benefits end,
      limitations = case when v_updates ? 'limitations' then array(select jsonb_array_elements_text(v_updates->'limitations')) else limitations end,
      pricing_verified_at = case when v_updates ?| array['pricing_type','pricing_start_at','pricing_summary','pricing_details','pricing_currency','pricing_url'] then timezone('utc', now()) else pricing_verified_at end,
      updated_at = timezone('utc', now())
    where id = v_candidate.tool_id;
  end if;

  update public.tool_update_candidates set
    status = p_decision,
    reviewed_at = timezone('utc', now()),
    reviewed_by = auth.uid(),
    admin_notes = nullif(trim(p_admin_notes), '')
  where id = p_candidate_id
  returning * into v_candidate;

  return v_candidate;
end;
$$;

revoke all on function public.review_tool_update_candidate(uuid, text, text) from public;
grant execute on function public.review_tool_update_candidate(uuid, text, text) to authenticated;

create extension if not exists pg_cron with schema pg_catalog;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;
do $$
declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'refresh-tool-information-daily' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
end $$;

select cron.schedule(
  'refresh-tool-information-daily',
  '30 18 * * *',
  $schedule$
  select net.http_post(
    url := 'https://prkmvgwwjjseoxafckyq.supabase.co/functions/v1/refresh-tool-information',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'tool_refresh_cron_secret')
    ),
    body := '{"trigger_type":"scheduled","limit":20}'::jsonb
  );
  $schedule$
);
