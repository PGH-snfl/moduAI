-- Upgrade estimated launch dates using first-party launch histories and announcements.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Captions', date '2021-01-01', 'official', 'https://www.captions.ai/blog-post/captions-announces-a-25-million-series-b-for-our-ai-powered-creative-studio'),
    ('Copy.ai', date '2020-10-15', 'official', 'https://www.copy.ai/blog/series-a'),
    ('Duolingo', date '2012-01-01', 'official', 'https://blog.duolingo.com/duolingo-technology-innovations/'),
    ('Manus', date '2025-03-01', 'official', 'https://manus.im/blog/what-we-saw-in-the-past-three-months-and-what-we-see-in-the-future'),
    ('remove.bg', date '2018-01-01', 'official', 'https://www.remove.bg/about-us'),
    ('v0', date '2023-09-01', 'official', 'https://vercel.com/blog/announcing-v0-generative-ui'),
    ('Wix AI Website Builder', date '2024-03-04', 'official', 'https://www.wix.com/press-room/home/post/now-live-wix-delivers-the-next-generation-of-web-creation-with-the-release-of-the-ai-website-builde')
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
