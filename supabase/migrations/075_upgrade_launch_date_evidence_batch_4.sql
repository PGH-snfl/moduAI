-- Upgrade estimated dates from first-party product histories and correct two launch months.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Bardeen', date '2022-02-16', 'official', 'https://www.bardeen.ai/release-notes'),
    ('Dataiku', date '2013-01-01', 'official', 'https://pages.dataiku.com/enterprise-ai-exponential-growth'),
    ('Deepgram', date '2016-01-01', 'official', 'https://deepgram.com/company/history'),
    ('LALAL.AI', date '2020-01-01', 'official', 'https://www.lalal.ai/media-kit/'),
    ('Photoroom', date '2019-01-01', 'official', 'https://www.photoroom.com/about'),
    ('Riverside', date '2020-01-01', 'official', 'https://riverside.fm/blog/introducing-riverside-2-0'),
    ('Tidio Lyro', date '2023-07-01', 'official', 'https://careers.tidio.com/blog-post/how-we-created-lyro-in-only-3-months')
)
update public.tools t
set launched_at=d.launched_at,
    launch_date_status=d.status,
    launch_date_source=d.source,
    updated_at=now()
from researched_dates d
where t.name=d.name
  and (t.launched_at is distinct from d.launched_at
    or t.launch_date_status is distinct from d.status
    or t.launch_date_source is distinct from d.source);

select public.refresh_tool_ranking_scores();
