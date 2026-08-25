-- Upgrade a larger batch using first-party histories, release notes, and retrospective evidence.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Clipdrop', date '2020-07-01', 'official', 'https://stability.ai/news-updates/stability-ai-acquires-init-ml-makers-of-clipdrop-application'),
    ('CodeRabbit', date '2023-08-01', 'reported', 'https://www.coderabbit.ai/blog/squeezing-water-from-stone'),
    ('DataRobot', date '2012-01-01', 'official', 'https://www.datarobot.com/about-us/'),
    ('Leonardo.Ai', date '2023-01-01', 'reported', 'https://leonardo.ai/news/supercharging-leonardo-with-canva'),
    ('Motion', date '2020-03-01', 'official', 'https://www.usemotion.com/blog/we-raised-13-million-in-series-a-to-automate-team-project-management'),
    ('Mubert', date '2017-01-01', 'official', 'https://mubert.com/blog/can-chatgpt-write-music-the-complete-guide-to-ai-music-creation'),
    ('Mutiny', date '2018-01-01', 'official', 'https://www.mutinyhq.com/llm-info'),
    ('Pika', date '2023-06-01', 'reported', 'https://pika.art/blog'),
    ('SchoolAI', date '2023-08-01', 'official', 'https://schoolai.com/blog/helping-teachers-and-schools-reach-every-student-every-day/'),
    ('Suno', date '2023-01-01', 'official', 'https://help.suno.com/en/articles/5782721'),
    ('Udio', date '2024-04-01', 'official', 'https://www.udio.com/blog/introducing-subscriptions-and-inpainting')
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
