-- Fourth research batch. Product release dates are preferred over company incorporation dates.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Beautiful.ai', date '2018-01-01', 'official', 'https://www.beautiful.ai/blog/beautiful-ai-vs-powerpoint-a-battle-of-presentation-software'),
    ('Cline', date '2024-07-01', 'estimated', 'https://github.com/cline/cline'),
    ('Copy.ai', date '2020-10-01', 'estimated', 'https://www.copy.ai/blog/series-a'),
    ('Cursor', date '2023-03-01', 'official', 'https://cursor.com/changelog/0-2-0'),
    ('D-ID', date '2022-09-01', 'official', 'https://www.d-id.com/news/d-id-launches-creative-reality-studio-self-service-video-creation-platform-with-hyper-real-ai-presenters/'),
    ('Dust', date '2023-05-01', 'estimated', 'https://dust.tt/blog/2023-05-11-work-doesnt-work'),
    ('Exa', date '2022-11-01', 'official', 'https://exa.ai/blog/announcing-series-b')
)
update public.tools as t
set
  launched_at = d.launched_at,
  launch_date_status = d.status,
  launch_date_source = d.source,
  updated_at = now()
from researched_dates as d
where t.name = d.name
  and (
    t.launched_at is distinct from d.launched_at
    or t.launch_date_status is distinct from d.status
    or t.launch_date_source is distinct from d.source
  );

select public.refresh_tool_ranking_scores();
