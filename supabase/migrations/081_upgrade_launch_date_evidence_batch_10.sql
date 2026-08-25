-- Replace provisional launch dates with traceable public release evidence.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Cleanvoice AI', date '2021-11-01', 'reported', 'https://news.ycombinator.com/item?id=29288618'),
    ('Diffit', date '2023-02-01', 'reported', 'https://www.newschools.org/venture/diffit/'),
    ('Khroma', date '2018-04-01', 'reported', 'https://www.creativebloq.com/how-to/generate-endless-colour-palettes-with-khroma'),
    ('Lavender', date '2020-01-01', 'reported', 'https://www.producthunt.com/posts/lavender-2'),
    ('Lilys AI', date '2023-10-01', 'reported', 'https://www.nextunicorn.kr/company/323d2fb220e84657'),
    ('Phind', date '2023-02-01', 'reported', 'https://news.ycombinator.com/item?id=34884338'),
    ('Viggle AI', date '2024-04-01', 'reported', 'https://www.reddit.com/r/StableDiffusion/comments/1c39oqz/is_there_any_alternative_to_this_newly_launched_ai/')
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
