create table if not exists public.social_content_candidates (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('youtube', 'instagram', 'threads')),
  external_id text not null,
  title text not null,
  body text,
  creator_name text,
  content_url text not null check (content_url ~ '^https?://'),
  media_url text check (media_url is null or media_url ~ '^https?://'),
  published_at timestamptz,
  view_count bigint,
  like_count bigint,
  comment_count bigint,
  ai_relevance_score integer not null default 0 check (ai_relevance_score between 0 and 100),
  matched_keywords text[] not null default '{}',
  language text not null default 'ko',
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  raw_data jsonb not null default '{}'::jsonb,
  collected_at timestamptz not null default timezone('utc'::text, now()),
  reviewed_at timestamptz,
  reviewed_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (platform, external_id)
);

create table if not exists public.social_collection_runs (
  id uuid primary key default gen_random_uuid(),
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  items_found integer not null default 0,
  items_saved integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  message text,
  started_at timestamptz not null default timezone('utc'::text, now()),
  completed_at timestamptz
);

alter table public.social_content_candidates enable row level security;
alter table public.social_collection_runs enable row level security;

create policy "Admins manage social candidates" on public.social_content_candidates for all
  using (auth.jwt()->'app_metadata'->>'role' = 'admin')
  with check (auth.jwt()->'app_metadata'->>'role' = 'admin');
create policy "Admins read social collection runs" on public.social_collection_runs for select
  using (auth.jwt()->'app_metadata'->>'role' = 'admin');

create index if not exists social_candidates_review_idx on public.social_content_candidates (status, collected_at desc);
create index if not exists social_candidates_platform_idx on public.social_content_candidates (platform, published_at desc);
create index if not exists social_collection_runs_started_idx on public.social_collection_runs (started_at desc);

create or replace function public.invoke_scheduled_social_content_collection()
returns bigint language plpgsql security definer set search_path = public, vault, extensions as $$
declare request_id bigint;
begin
  select net.http_post(
    url := 'https://prkmvgwwjjseoxafckyq.supabase.co/functions/v1/collect-social-content',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'home_content_service_role'),
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'home_content_cron_secret')
    ), body := '{}'::jsonb
  ) into request_id;
  return request_id;
end;
$$;

revoke all on function public.invoke_scheduled_social_content_collection() from public, anon, authenticated;
grant execute on function public.invoke_scheduled_social_content_collection() to service_role;

do $$ declare existing_job bigint;
begin
  select jobid into existing_job from cron.job where jobname = 'collect-social-content-6-hourly' limit 1;
  if existing_job is not null then perform cron.unschedule(existing_job); end if;
end $$;

select cron.schedule('collect-social-content-6-hourly', '25 */6 * * *', 'select public.invoke_scheduled_social_content_collection();');
