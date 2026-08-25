create or replace function public.get_ranking_data_status()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with signals as (
    select
      coalesce((select sum(visitors) from public.traffic_stats where date >= current_date - 13), 0)::integer as visits_14d,
      coalesce((select sum(visitors) from public.traffic_stats where date >= current_date - 13 and date < current_date - 6), 0)::integer as previous_visits_7d,
      (select count(distinct tool_id) from public.traffic_stats where date >= current_date - 13 and visitors > 0)::integer as active_tools_14d,
      (select count(*) from public.reviews)::integer as review_count,
      (select count(distinct tool_id) from public.reviews)::integer as reviewed_tools
  )
  select jsonb_build_object(
    'trending_ready', visits_14d >= 50 and previous_visits_7d > 0 and active_tools_14d >= 3,
    'reputation_ready', review_count >= 10 and reviewed_tools >= 3,
    'visits_14d', visits_14d,
    'previous_visits_7d', previous_visits_7d,
    'active_tools_14d', active_tools_14d,
    'review_count', review_count,
    'reviewed_tools', reviewed_tools,
    'trending_minimum', jsonb_build_object('visits_14d', 50, 'active_tools', 3, 'requires_previous_period', true),
    'reputation_minimum', jsonb_build_object('reviews', 10, 'reviewed_tools', 3)
  )
  from signals;
$$;

revoke all on function public.get_ranking_data_status() from public;
grant execute on function public.get_ranking_data_status() to anon, authenticated;

comment on function public.get_ranking_data_status() is
  'Public aggregate readiness only; never exposes individual user activity';
