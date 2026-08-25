-- Third research batch for launch months verified from first-party announcements.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Devin', date '2024-03-01', 'official', 'https://cognition.com/blog/introducing-devin'),
    ('Dify', date '2023-05-01', 'official', 'https://dify.ai/blog/dify-open-source'),
    ('ElevenLabs', date '2023-01-01', 'official', 'https://elevenlabs.io/blog/elevenlabs-raises-2m-pre-seed-and-announces-ai-speech-platform-promising-to-revolutionize-audio-storytelling'),
    ('Elicit', date '2021-08-01', 'official', 'https://elicit.com/blog/launching-a-feature-every-week'),
    ('Descript', date '2017-12-01', 'official', 'https://medium.com/descript/introducing-descript-fa37eb193819')
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
