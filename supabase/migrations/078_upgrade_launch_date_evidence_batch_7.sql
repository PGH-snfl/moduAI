-- Upgrade a large batch using first-party launch histories and reputable contemporaneous reports.

with researched_dates(name, launched_at, status, source) as (
  values
    ('AssemblyAI', date '2017-01-01', 'reported', 'https://www.ycombinator.com/companies/assemblyai'),
    ('Brisk Teaching', date '2023-05-01', 'reported', 'https://www.linkedin.com/posts/armanjaffer_corey-layne-crouch-tom-whitnah-and-i-are-activity-7063904931195326466-kaDv'),
    ('Cline', date '2024-07-01', 'reported', 'https://github.com/cline/cline'),
    ('Inworld', date '2021-11-01', 'reported', 'https://www.globenewswire.com/news-release/2021/11/08/2329206/0/en/Inworld-AI-Announces-7-Million-in-Seed-Funding-from-Kleiner-Perkins-CRV-and-Meta-for-Metaverse-AI-Development-Platform.html'),
    ('LTX Studio', date '2024-02-01', 'reported', 'https://techcrunch.com/2024/02/28/lightricks-announces-ai-powered-filmmaking-studio-to-help-creators-visualize-stories/'),
    ('Pieces', date '2020-01-01', 'official', 'https://pieces.app/blog/top-23-achievements-of-2023'),
    ('ResearchRabbit', date '2021-08-01', 'reported', 'https://www.nature.com/articles/d41586-021-02346-4'),
    ('Runway', date '2019-06-01', 'official', 'https://runway.com/news/building-impossible-things'),
    ('Scite', date '2018-01-01', 'reported', 'https://www.sec.gov/Archives/edgar/data/1386301/000110465923121108/tm2331467d1_ex99-2.htm'),
    ('SOUNDRAW', date '2020-01-01', 'official', 'https://soundraw.io/press'),
    ('Surfer', date '2017-01-01', 'official', 'https://docs.surferseo.com/en/articles/7859434-what-is-surfer'),
    ('Tabnine', date '2018-01-01', 'official', 'https://www.tabnine.com/about/'),
    ('Wordtune', date '2020-10-01', 'official', 'https://www.wordtune.com/read/ai-summary-tool'),
    ('Writesonic', date '2021-01-01', 'official', 'https://writesonic.com/blog/fix-how-ai-describes-your-company')
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
