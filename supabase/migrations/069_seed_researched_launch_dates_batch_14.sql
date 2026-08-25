-- Fourteenth research batch: collaboration, developer, knowledge, and music tools.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Slack AI', date '2024-02-14', 'official', 'https://slack.com/blog/news/slack-ai-has-arrived'),
    ('Udio', date '2024-04-01', 'estimated', 'https://www.udio.com/blog/tree-view'),
    ('v0', date '2023-09-01', 'estimated', 'https://vercel.com/blog/announcing-v0-generative-ui'),
    ('Wolfram|Alpha', date '2009-05-18', 'official', 'https://blog.wolframalpha.com/2009/05/18/wolframalpha-is-in-production/'),
    ('Zoom AI Companion', date '2023-09-05', 'official', 'https://news.zoom.com/zoom-ai-companion/')
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
