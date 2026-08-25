-- Separate product release dates from company founding dates for another researched batch.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Fireflies.ai', date '2018-10-01', 'reported', 'https://venturebeat.com/technology/fireflies-raises-5-million-for-its-ai-assistant-for-meetings'),
    ('Gumloop', date '2023-04-01', 'official', 'https://www.gumloop.com/blog/handbook/'),
    ('InVideo AI', date '2023-08-01', 'reported', 'https://www.moneycontrol.com/news/business/startup/inside-invideo-s-70-million-arr-growth-story-a-hacker-mindset-entrepreneurial-surge-and-product-market-fit-challenge-12980201.html'),
    ('Julius AI', date '2023-06-01', 'reported', 'https://cerebralvalley.beehiiv.com/p/julius-transforming-computation-ai'),
    ('Litmaps', date '2021-01-01', 'official', 'https://blog.litmaps.com/p/litmaps-2023-refocus'),
    ('Luma AI', date '2021-10-01', 'reported', 'https://techcrunch.com/2021/10/29/luma-seed-round/'),
    ('Ocoya', date '2021-08-01', 'reported', 'https://www.producthunt.com/products/ocoya-2-0?launch=ocoya-2-0-1'),
    ('Recraft', date '2023-05-01', 'reported', 'https://www.maddyness.com/uk/2024/01/31/recraft-solving-the-need-to-create-graphic-visuals-for-professional-needs/'),
    ('Relevance AI', date '2021-12-01', 'reported', 'https://www.prnewswire.com/news-releases/relevance-ai-raises-3m-from-insight-partners-to-build-a-developer-first-vector-platform-301444632.html'),
    ('Scenario', date '2023-01-01', 'reported', 'https://www.businesswire.com/news/home/20230119005133/en/Introducing-the-Scenario-GenAI-Engine-Style-Consistent-Game-Art-Defined-by-Developers-and-Artists-Enabled-by-AI'),
    ('Superhuman', date '2017-08-01', 'reported', 'https://techcrunch.com/2017/08/18/rapportive-founders-new-startup-superhuman-is-what-gmail-would-be-if-built-today/'),
    ('Tavily', date '2023-01-01', 'reported', 'https://techcrunch.com/2025/08/06/tavily-raises-25m-to-connect-ai-agents-to-the-web/'),
    ('VEED AI', date '2023-11-01', 'reported', 'https://www.youtube.com/live/d3Jo9N-5J6c'),
    ('Voicemod', date '2009-01-01', 'official', 'https://www.voicemod.com/our-story')
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
