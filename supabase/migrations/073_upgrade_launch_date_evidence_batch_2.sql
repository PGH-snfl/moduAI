-- Upgrade estimated launch dates using first-party product launch evidence.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Uizard', date '2021-02-10', 'official', 'https://uizard.io/blog/uizard-launches-worlds-first-ai-powered-design-assistant/'),
    ('Speechify', date '2017-01-01', 'official', 'https://speechify.com/blog/is-speechify-safe/'),
    ('Sudowrite', date '2020-01-01', 'official', 'https://sudowrite.com/blog/sudowrite-the-writers-paradise-that-actually-delivers/')
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
