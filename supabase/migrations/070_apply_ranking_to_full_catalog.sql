-- Give every catalog entry the same ranking treatment, even when a free
-- external provider cannot measure its domain. Missing traffic remains zero;
-- it is never replaced with fabricated visits.

alter table public.tools
  add column if not exists data_quality_score numeric not null default 0,
  add column if not exists ranking_breakdown jsonb not null default '{}'::jsonb;

-- A collection row records that every tool is eligible for the same external
-- collection pipeline. Signal columns stay null when the provider has no data.
insert into public.external_signals (tool_id, collected_at)
select id, timezone('utc', now()) from public.tools
on conflict (tool_id) do nothing;

do $$
begin
  if to_regprocedure('public.refresh_tool_ranking_scores_core()') is null then
    alter function public.refresh_tool_ranking_scores() rename to refresh_tool_ranking_scores_core;
  end if;
end $$;

create or replace function public.refresh_tool_ranking_scores()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.refresh_tool_ranking_scores_core();

  with quality as (
    select
      t.id,
      least(100, greatest(0,
        case when t.source_verified then 20 else 0 end
        + case when t.hands_on_verified then 15 else 0 end
        + case when coalesce(array_length(t.verification_sources, 1), 0) > 0 then 10 else 0 end
        + case when length(coalesce(t.full_description, '')) >= 80 then 10 else 0 end
        + case when coalesce(array_length(t.primary_features, 1), 0) >= 2 then 10 else 0 end
        + case when coalesce(array_length(t.key_benefits, 1), 0) > 0 then 5 else 0 end
        + case when coalesce(array_length(t.best_for, 1), 0) > 0 then 5 else 0 end
        + case when coalesce(array_length(t.limitations, 1), 0) > 0 then 5 else 0 end
        + case when t.pricing_url is not null and coalesce(array_length(t.pricing_details, 1), 0) > 0 then 10 else 0 end
        + case when t.launch_date_source is not null then 5 else 0 end
        + case when t.korean_tested then 5 else 0 end
      ))::numeric as profile_score,
      es.website_monthly_visits,
      es.website_traffic_rank,
      es.website_traffic_provider,
      es.github_stars,
      es.wikipedia_views_30d
    from public.tools t
    left join public.external_signals es on es.tool_id = t.id
  )
  update public.tools t
  set
    data_quality_score = q.profile_score,
    -- The existing evidence score keeps 90%; a uniformly calculated catalog
    -- quality component contributes 10% and removes the all-or-nothing tie.
    ranking_score = round((t.ranking_score * .90 + q.profile_score * .10)::numeric, 2),
    task_ranking_score = round((
      case when t.tool_scope = 'general'
        then (t.ranking_score * .90 + q.profile_score * .10) * .70
        else (t.ranking_score * .90 + q.profile_score * .10)
      end
    )::numeric, 2),
    ranking_breakdown = jsonb_build_object(
      'catalog_quality', q.profile_score,
      'internal_traffic_available', exists (
        select 1 from public.traffic_stats ts where ts.tool_id = t.id and ts.visitors > 0
      ),
      'reviews_available', t.review_count > 0,
      'favorites_available', exists (
        select 1 from public.user_favorites uf where uf.tool_id = t.id
      ),
      'website_traffic_available', q.website_monthly_visits is not null or q.website_traffic_rank is not null,
      'website_traffic_provider', q.website_traffic_provider,
      'github_available', q.github_stars is not null,
      'wikipedia_available', q.wikipedia_views_30d is not null,
      'launch_date_available', t.launched_at is not null
    ),
    rank_updated_at = timezone('utc', now())
  from quality q
  where q.id = t.id;
end;
$$;

revoke all on function public.refresh_tool_ranking_scores() from public;
grant execute on function public.refresh_tool_ranking_scores() to service_role;

comment on column public.tools.data_quality_score is
  'Every tool receives the same 0-100 catalog evidence and completeness score.';
comment on column public.tools.ranking_breakdown is
  'Availability audit for every signal used by the comprehensive ranking.';

select public.refresh_tool_ranking_scores();
