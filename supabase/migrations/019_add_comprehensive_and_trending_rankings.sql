-- Unified tool ranking with optional external signals and a newcomer-safe trend score.

create table if not exists public.external_signals (
  tool_id uuid primary key references public.tools(id) on delete cascade,
  github_stars bigint,
  github_forks bigint,
  github_open_issues bigint,
  github_pushed_at timestamptz,
  wikipedia_views_30d bigint,
  website_monthly_visits bigint,
  website_traffic_rank bigint,
  website_traffic_provider text,
  website_traffic_period text,
  source_url text,
  collected_at timestamptz not null default timezone('utc', now()),
  constraint external_signals_nonnegative check (
    coalesce(github_stars, 0) >= 0 and
    coalesce(github_forks, 0) >= 0 and
    coalesce(github_open_issues, 0) >= 0 and
    coalesce(wikipedia_views_30d, 0) >= 0
  )
);

alter table public.external_signals
  add column if not exists github_stars bigint,
  add column if not exists github_forks bigint,
  add column if not exists github_open_issues bigint,
  add column if not exists github_pushed_at timestamptz,
  add column if not exists wikipedia_views_30d bigint,
  add column if not exists website_monthly_visits bigint,
  add column if not exists website_traffic_rank bigint,
  add column if not exists website_traffic_provider text,
  add column if not exists website_traffic_period text,
  add column if not exists source_url text,
  add column if not exists collected_at timestamptz not null default timezone('utc', now());

alter table public.external_signals enable row level security;
drop policy if exists "external signals are publicly readable" on public.external_signals;
create policy "external signals are publicly readable"
on public.external_signals for select using (true);

alter table public.tools
  add column if not exists github_url text,
  add column if not exists wikipedia_title text,
  add column if not exists launched_at date,
  add column if not exists launch_date_status text,
  add column if not exists launch_date_source text,
  add column if not exists ranking_score numeric not null default 0,
  add column if not exists trending_score numeric not null default 0,
  add column if not exists popularity_score numeric not null default 0,
  add column if not exists task_ranking_score numeric not null default 0,
  add column if not exists rank_updated_at timestamptz;

create index if not exists tools_ranking_score_idx on public.tools(ranking_score desc);
create index if not exists tools_trending_score_idx on public.tools(trending_score desc);
create index if not exists tools_popularity_score_idx on public.tools(popularity_score desc);
create index if not exists tools_task_ranking_score_idx on public.tools(task_ranking_score desc);

create or replace function public.refresh_tool_ranking_scores()
returns void
language sql
security definer
set search_path = public
as $$
  with raw as (
    select
      t.id,
      t.created_at,
      t.launched_at,
      t.is_verified,
      t.tool_scope,
      coalesce(t.average_rating, 0)::numeric as average_rating,
      coalesce(t.review_count, 0)::numeric as review_count,
      coalesce(sum(ts.visitors) filter (where ts.date >= current_date - 29), 0)::numeric as views_30d,
      coalesce(sum(ts.visitors) filter (where ts.date >= current_date - 6), 0)::numeric as views_7d,
      coalesce(sum(ts.visitors) filter (
        where ts.date >= current_date - 13 and ts.date < current_date - 6
      ), 0)::numeric as previous_views_7d,
      (select count(*)::numeric from public.user_favorites uf where uf.tool_id = t.id) as favorites,
      es.github_stars,
      es.github_forks,
      es.wikipedia_views_30d
      ,es.website_monthly_visits
      ,es.website_traffic_rank
    from public.tools t
    left join public.traffic_stats ts on ts.tool_id = t.id
    left join public.external_signals es on es.tool_id = t.id
    group by t.id, t.created_at, t.launched_at, t.is_verified, t.tool_scope, t.average_rating, t.review_count,
             es.github_stars, es.github_forks, es.wikipedia_views_30d,
             es.website_monthly_visits, es.website_traffic_rank
  ), maxima as (
    select
      greatest(max(ln(1 + views_30d)), 1) as max_views,
      greatest(max(ln(1 + favorites)), 1) as max_favorites,
      greatest(max(ln(1 + views_7d)), 1) as max_recent,
      greatest(max(ln(1 + coalesce(github_stars, 0) + coalesce(github_forks, 0) * 2)), 1) as max_github
      ,greatest(max(ln(1 + coalesce(wikipedia_views_30d, 0))), 1) as max_wikipedia
      ,greatest(max(ln(1 + coalesce(website_monthly_visits, 0))), 1) as max_site_visits
    from raw
  ), scored as (
    select
      r.*,
      100 * ln(1 + views_30d) / m.max_views as traffic_score,
      100 * ln(1 + favorites) / m.max_favorites as favorite_score,
      100 * ln(1 + views_7d) / m.max_recent as recent_score,
      case when github_stars is not null or wikipedia_views_30d is not null then
        case
          when github_stars is not null and wikipedia_views_30d is not null then
            50 * ln(1 + github_stars + coalesce(github_forks, 0) * 2) / m.max_github
            + 50 * ln(1 + wikipedia_views_30d) / m.max_wikipedia
          when github_stars is not null then
            100 * ln(1 + github_stars + coalesce(github_forks, 0) * 2) / m.max_github
          else 100 * ln(1 + wikipedia_views_30d) / m.max_wikipedia
        end
      end as external_score,
      case
        when website_monthly_visits is not null then
          100 * ln(1 + website_monthly_visits) / m.max_site_visits
        when website_traffic_rank is not null then
          greatest(0, 100 * (1 - ln(greatest(website_traffic_rank, 1)) / ln(1000000)))
      end as website_traffic_score,
      least(100, greatest(0,
        50 + 25 * least(2, greatest(-2,
          ((views_7d + 3) / (previous_views_7d + 3)) - 1
        ))
      )) as growth_score,
      case
        when launched_at is null then 0
        when launched_at >= current_date - 89 then 100
        when launched_at >= current_date - 179 then 65
        when launched_at >= current_date - 364 then 30
        else 0
      end as newcomer_score,
      least(100,
        (((average_rating * review_count) + (3.5 * 5)) / (review_count + 5)) / 5 * 75
        + case when is_verified then 25 else 0 end
      ) as quality_score
    from raw r cross join maxima m
  ), final as (
    select
      id,
      tool_scope,
      case when external_score is null then
        case when website_traffic_score is null
          then traffic_score * .45 + favorite_score * .20 + quality_score * .25 + newcomer_score * .10
        else traffic_score * .35 + website_traffic_score * .25 + favorite_score * .15
             + quality_score * .20 + newcomer_score * .05
        end
      else
        case when website_traffic_score is null
          then traffic_score * .40 + favorite_score * .15 + quality_score * .20
               + (case when tool_scope = 'general' then least(external_score, 65) else external_score end) * .15
               + newcomer_score * .10
          else traffic_score * .30 + website_traffic_score * .25 + favorite_score * .15
               + quality_score * .20
               + (case when tool_scope = 'general' then least(external_score, 65) else external_score end) * .05
               + newcomer_score * .05
        end
      end as ranking_score,
      recent_score * .40 + growth_score * .35 + newcomer_score * .25 as trend_core_score,
      quality_score
    from scored
  ), weighted as (
    select
      id,
      tool_scope,
      ranking_score,
      -- 급상승 신호를 최우선으로 두되 종합 인지도와 품질도 함께 반영한다.
      trend_core_score * .60 + ranking_score * .25 + quality_score * .15 as trending_score,
      -- 평점/검증 품질을 최우선으로 두되 인지도와 최근 상승세도 함께 반영한다.
      quality_score * .55 + ranking_score * .30 + trend_core_score * .15 as popularity_score,
      -- 작업 탐색에서는 범용 도구의 점수를 완만하게 낮춰 전문 도구의 발견성을 보장한다.
      case when tool_scope = 'general' then ranking_score * .70 else ranking_score end as task_ranking_score
    from final
  )
  update public.tools t set
    ranking_score = round(weighted.ranking_score::numeric, 2),
    trending_score = round(weighted.trending_score::numeric, 2),
    popularity_score = round(weighted.popularity_score::numeric, 2),
    task_ranking_score = round(weighted.task_ranking_score::numeric, 2),
    rank_updated_at = timezone('utc', now())
  from weighted where weighted.id = t.id;
$$;

revoke all on function public.refresh_tool_ranking_scores() from public;
grant execute on function public.refresh_tool_ranking_scores() to service_role;

select public.refresh_tool_ranking_scores();

comment on column public.tools.ranking_score is
  '통합 순위: 최근 트래픽, 즐겨찾기, 베이지안 평점/검증, 선택적 외부 신호, 신규성';
comment on column public.tools.trending_score is
  '급상승 우선 종합 순위: 상승 신호 60%, 통합 인지도 25%, 품질 15%';
comment on column public.tools.popularity_score is
  '평판 우선 종합 순위: 평점/검증 55%, 통합 인지도 30%, 상승 신호 15%';
comment on column public.tools.task_ranking_score is
  '카테고리 작업 탐색 순위: 범용 도구는 종합 점수의 70%, 전문 도구는 100%';
comment on column public.tools.launched_at is
  '도구가 최초 공개된 출시 연월. 일자를 모르면 해당 월 1일로 저장';
comment on column public.tools.launch_date_status is
  'official: 공식 발표, reported: 보도 확인, estimated: 최초 공개 흔적으로 추정';
comment on column public.tools.ranking_score is
  '종합 순위: 모두의AI 유입 30~35%, 공식 사이트 외부 트래픽 25%, 즐겨찾기 15%, 품질 20%, 기타 외부 신호/신규성 10%';
