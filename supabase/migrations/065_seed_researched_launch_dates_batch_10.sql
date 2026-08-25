-- Tenth research batch: official launches and earliest official product evidence.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Gamma', date '2023-01-01', 'estimated', 'https://gamma.app/insights/how-we-built-a-usd100m-business-differently'),
    ('Gladia', date '2023-06-01', 'official', 'https://www.gladia.io/blog/from-speech-to-knowledge-gladias-audio-intelligence-api'),
    ('Humata', date '2023-10-01', 'estimated', 'https://www.humata.ai/blog/humata-secures-35m-in-funding'),
    ('Krisp', date '2018-11-01', 'official', 'https://krisp.ai/blog/public-beta-launch-product-hunt-hacker-news/'),
    ('LALAL.AI', date '2020-01-01', 'estimated', 'https://www.lalal.ai/blog/lalal-ai-2021-year-in-review/'),
    ('LanguageTool', date '2003-01-01', 'official', 'https://languagetool.org/about'),
    ('Looka', date '2016-11-01', 'official', 'https://looka.com/blog/journey-to-rebrand-from-logojoy-to-looka/')
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
