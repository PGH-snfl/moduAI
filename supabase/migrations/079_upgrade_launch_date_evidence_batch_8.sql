-- Upgrade another large batch using first-party histories and reputable launch records.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Consensus', date '2022-06-01', 'reported', 'https://consensus.app/home/blog/introducing-consensus/'),
    ('Dust', date '2023-06-01', 'reported', 'https://dust.tt/blog/speculative-sampling-llms-writing-a-lot-faster-using-other-llms'),
    ('Flair AI', date '2022-01-01', 'reported', 'https://www.linkedin.com/company/tryflairai'),
    ('Gamma', date '2023-01-01', 'official', 'https://community.gamma.app/x/gamma-announcements'),
    ('Hailuo AI', date '2024-09-01', 'reported', 'https://chat.minimax.io/doc/terms-of-service.html'),
    ('Humata', date '2023-10-01', 'reported', 'https://www.humata.ai/blog/humata-secures-35m-in-funding'),
    ('ImagineArt', date '2022-01-01', 'official', 'https://www.imagine.art/about'),
    ('Krea', date '2022-01-01', 'reported', 'https://www.krea.ai/blog/new-krea'),
    ('Mem', date '2020-10-01', 'official', 'https://newsletter.mem.ai/p/new-in-mem-speed-and-reliability'),
    ('Morphic', date '2024-03-01', 'official', 'https://morphic.com/en/blog/announcing-morphic-welcome-to-the-future-of-storytelling'),
    ('OpenArt', date '2022-01-01', 'official', 'https://openart.ai/blog/the-openart-story/'),
    ('PixAI', date '2022-01-01', 'official', 'https://www.pix.ai/en/'),
    ('Playground', date '2022-01-01', 'reported', 'https://www.ycombinator.com/companies/playground'),
    ('PopAi', date '2023-06-01', 'official', 'https://gblog.popai.pro/welcome-2024-a-year-of-innovation-with-popai/'),
    ('QuestionWell', date '2023-02-01', 'official', 'https://questionwell.org/'),
    ('Rosebud AI', date '2023-04-01', 'official', 'https://lab.rosebud.ai/blog/ai-game-assets-generator-pixelvibe')
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
