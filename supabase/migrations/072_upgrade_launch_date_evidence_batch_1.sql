-- Replace company-age estimates with official AI product launch evidence.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Topaz Photo', date '2022-09-15', 'official', 'https://docs.topazlabs.com/photo-ai/release-summary'),
    ('Warp', date '2022-04-01', 'official', 'https://www.warp.dev/blog/story-behind-ai-command-search'),
    ('Zendesk AI', date '2023-05-10', 'official', 'https://www.zendesk.com/newsroom/press-releases/zendesk-ai/'),
    ('Taskade', date '2022-12-12', 'official', 'https://www.taskade.com/blog/introducing-taskade-ai'),
    ('Webflow AI', date '2024-10-15', 'official', 'https://webflow.com/updates/webflow-ai-assistant'),
    ('Sourcegraph', date '2023-03-23', 'official', 'https://sourcegraph.com/blog/release-5-0'),
    ('Synthesia', date '2017-01-01', 'official', 'https://www.synthesia.io/post/series-c'),
    ('Semrush AI', date '2024-05-17', 'official', 'https://www.semrush.com/news/319655-track-googles-ai-overviews-in-semrush-position-tracking-and-sensor/')
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
