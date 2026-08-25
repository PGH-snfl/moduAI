-- Complete the catalog's provisional launch-date review with the earliest traceable public evidence.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Gambo', date '2025-09-01', 'reported', 'https://www.linkedin.com/posts/thomascharlesosman_remember-that-game-idea-you-had-in-the-activity-7376382020332986368-s0HU'),
    ('GoEnhance AI', date '2024-02-01', 'reported', 'https://www.goenhance.ai/blog/domoai-free-alternative'),
    ('LumiYing', date '2026-03-01', 'reported', 'https://lumiying.com/tos')
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
