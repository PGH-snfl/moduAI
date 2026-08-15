create table if not exists public.content_collection_runs (
  id uuid primary key default gen_random_uuid(),
  source text not null,
  status text not null default 'running' check (status in ('running', 'success', 'partial', 'failed')),
  items_found integer not null default 0,
  items_saved integer not null default 0,
  details jsonb not null default '{}'::jsonb,
  message text,
  started_at timestamptz not null default timezone('utc'::text, now()),
  completed_at timestamptz
);

create table if not exists public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  notification_type text not null,
  title text not null,
  message text not null,
  metadata jsonb not null default '{}'::jsonb,
  is_read boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.content_collection_runs enable row level security;
alter table public.admin_notifications enable row level security;

create policy "Admins read collection runs" on public.content_collection_runs for select
  using (auth.jwt()->'app_metadata'->>'role' = 'admin');
create policy "Admins manage notifications" on public.admin_notifications for all
  using (auth.jwt()->'app_metadata'->>'role' = 'admin')
  with check (auth.jwt()->'app_metadata'->>'role' = 'admin');

create unique index if not exists ai_technology_trends_source_label_unique_idx
  on public.ai_technology_trends (source_label);

create index if not exists admin_notifications_unread_idx
  on public.admin_notifications (is_read, created_at desc);
create index if not exists content_collection_runs_started_idx
  on public.content_collection_runs (started_at desc);
