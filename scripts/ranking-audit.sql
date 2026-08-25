select jsonb_build_object(
  'summary', (
    select jsonb_build_object(
      'total', count(*),
      'zero_ranks', count(*) filter(where ranking_score = 0),
      'launch_dates', count(*) filter(where launched_at is not null),
      'ranked_at', max(rank_updated_at)
    ) from public.tools
  ),
  'overall', (
    select jsonb_agg(x) from (
      select name, ranking_score as score from public.tools
      order by ranking_score desc, name limit 10
    ) x
  ),
  'trending', (
    select jsonb_agg(x) from (
      select name, trending_score as score from public.tools
      order by trending_score desc, ranking_score desc, name limit 10
    ) x
  ),
  'reputation', (
    select jsonb_agg(x) from (
      select name, popularity_score as score from public.tools
      order by popularity_score desc, ranking_score desc, name limit 10
    ) x
  ),
  'readiness', public.get_ranking_data_status()
) as result;
