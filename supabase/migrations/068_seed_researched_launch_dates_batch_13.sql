-- Thirteenth research batch: meeting, content, analytics, and developer tools.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Napkin AI', date '2024-08-01', 'official', 'https://www.napkin.ai/blog/introducing-napkin/'),
    ('Obviously AI', date '2020-01-01', 'official', 'https://obviously.ai/post/new-site-launch'),
    ('OpusClip', date '2023-06-01', 'official', 'https://www.opus.pro/blog/introducing-opusclip-pro-plan-more-features-more-credits-same-price'),
    ('Pieces', date '2022-03-01', 'estimated', 'https://pieces.app/blog/flutter-getx-fetching-data-from-opensea-api'),
    ('Qodo', date '2024-09-01', 'official', 'https://www.qodo.ai/blog/introducing-qodo-a-new-name-the-same-commitment-to-quality/'),
    ('Read AI', date '2021-09-01', 'official', 'https://www.read.ai/blog'),
    ('Riverside', date '2020-01-01', 'estimated', 'https://riverside.fm/about'),
    ('Rytr', date '2021-04-01', 'official', 'https://rytr.me/press')
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
