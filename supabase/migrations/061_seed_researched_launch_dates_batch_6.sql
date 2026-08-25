-- Fifth research batch. Year-only company/product beginnings are explicitly marked estimated.

with researched_dates(name, launched_at, status, source) as (
  values
    ('AssemblyAI', date '2017-01-01', 'estimated', 'https://www.assemblyai.com/blog/new-feature-paginate-through-historical-transcripts'),
    ('Dataiku', date '2013-01-01', 'estimated', 'https://www.dataiku.com/blog/the-dataiku-story'),
    ('DataRobot', date '2012-01-01', 'estimated', 'https://www.datarobot.com/about-us/'),
    ('Deepgram', date '2016-01-01', 'estimated', 'https://deepgram.com/company/history'),
    ('Duolingo', date '2012-01-01', 'estimated', 'https://blog.duolingo.com/duolingos-values-a-letter-from-the-ceo/')
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
