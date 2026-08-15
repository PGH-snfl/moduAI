create table if not exists public.analytics_events (
  id bigint generated always as identity primary key,
  session_id uuid not null,
  user_id uuid references auth.users(id) on delete set null,
  event_type text not null check (event_type in ('page_view', 'tool_click', 'search', 'filter', 'favorite_add', 'favorite_remove', 'content_click')),
  path text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  check (path is null or char_length(path) <= 300),
  check (pg_column_size(metadata) <= 2048)
);

create index if not exists analytics_events_created_idx on public.analytics_events (created_at desc);
create index if not exists analytics_events_session_created_idx on public.analytics_events (session_id, created_at desc);
create index if not exists analytics_events_type_created_idx on public.analytics_events (event_type, created_at desc);

alter table public.analytics_events enable row level security;

drop policy if exists "Admins can read analytics events" on public.analytics_events;
create policy "Admins can read analytics events" on public.analytics_events for select
using (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin');

create or replace function public.record_analytics_event(
  p_session_id uuid,
  p_event_type text,
  p_path text default null,
  p_metadata jsonb default '{}'::jsonb
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  if p_event_type not in ('page_view', 'tool_click', 'search', 'filter', 'favorite_add', 'favorite_remove', 'content_click') then
    raise exception 'Unsupported analytics event';
  end if;
  if p_session_id is null or char_length(coalesce(p_path, '')) > 300 or pg_column_size(coalesce(p_metadata, '{}'::jsonb)) > 2048 then
    raise exception 'Invalid analytics event';
  end if;
  if (select count(*) from public.analytics_events where session_id = p_session_id and created_at > now() - interval '1 minute') >= 120 then
    return;
  end if;
  if p_event_type = 'page_view' and exists (
    select 1 from public.analytics_events
    where session_id = p_session_id and event_type = 'page_view' and path is not distinct from nullif(p_path, '')
      and created_at > now() - interval '3 seconds'
  ) then
    return;
  end if;
  insert into public.analytics_events (session_id, user_id, event_type, path, metadata)
  values (p_session_id, auth.uid(), p_event_type, nullif(p_path, ''), coalesce(p_metadata, '{}'::jsonb));
end;
$$;

revoke all on function public.record_analytics_event(uuid, text, text, jsonb) from public;
grant execute on function public.record_analytics_event(uuid, text, text, jsonb) to anon, authenticated;

create or replace function public.get_admin_analytics_summary(p_days integer default 7)
returns jsonb
language plpgsql security definer set search_path = public
as $$
declare
  v_days integer := greatest(1, least(coalesce(p_days, 7), 30));
  v_since timestamptz;
  v_result jsonb;
begin
  if auth.role() <> 'authenticated' or auth.jwt()->'app_metadata'->>'role' <> 'admin' then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  v_since := date_trunc('day', timezone('Asia/Seoul', now())) at time zone 'Asia/Seoul' - (v_days - 1) * interval '1 day';

  select jsonb_build_object(
    'visitors_today', (select count(distinct session_id) from analytics_events where created_at >= date_trunc('day', timezone('Asia/Seoul', now())) at time zone 'Asia/Seoul'),
    'visitors_period', (select count(distinct session_id) from analytics_events where created_at >= v_since),
    'page_views_period', (select count(*) from analytics_events where event_type = 'page_view' and created_at >= v_since),
    'actions_period', (select count(*) from analytics_events where event_type <> 'page_view' and created_at >= v_since),
    'reviews_period', (select count(*) from reviews where created_at >= v_since),
    'submissions_period', (select count(*) from pending_tools where created_at >= v_since),
    'daily', (select coalesce(jsonb_agg(jsonb_build_object('date', d::date, 'visitors', visitors, 'page_views', page_views) order by d), '[]'::jsonb)
      from (select day.d, count(distinct e.session_id) as visitors, count(e.id) filter (where e.event_type = 'page_view') as page_views
        from generate_series(v_since, date_trunc('day', timezone('Asia/Seoul', now())) at time zone 'Asia/Seoul', interval '1 day') day(d)
        left join analytics_events e on e.created_at >= day.d and e.created_at < day.d + interval '1 day'
        group by day.d) daily_rows),
    'actions', (select coalesce(jsonb_object_agg(event_type, amount), '{}'::jsonb) from
      (select event_type, count(*) amount from analytics_events where event_type <> 'page_view' and created_at >= v_since group by event_type) action_rows),
    'top_pages', (select coalesce(jsonb_agg(jsonb_build_object('path', path, 'views', views) order by views desc), '[]'::jsonb) from
      (select coalesce(path, '/') path, count(*) views from analytics_events where event_type = 'page_view' and created_at >= v_since group by path order by views desc limit 5) page_rows)
  ) into v_result;
  return v_result;
end;
$$;

revoke all on function public.get_admin_analytics_summary(integer) from public;
grant execute on function public.get_admin_analytics_summary(integer) to authenticated;

comment on table public.analytics_events is 'Privacy-minimized first-party analytics. Anonymous session IDs expire client-side after 30 days; no IP or raw search terms are stored.';
