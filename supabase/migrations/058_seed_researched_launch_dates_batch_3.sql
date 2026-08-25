-- Second research batch for launch months.
-- The first day represents month precision; estimated rows have only year/quarter/earliest-public-record evidence.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Adobe Podcast', date '2023-03-01', 'official', 'https://www.adobe.com/cc-shared/assets/pdf/corporate/investor-relations/q1-fy2023-earnings-transcript.pdf'),
    ('Bolt.new', date '2024-10-01', 'official', 'https://blog.stackblitz.com/posts/bolt-100k-oss-fund/'),
    ('Brisk Teaching', date '2023-01-01', 'estimated', 'https://www.briskteaching.com/press'),
    ('Browse AI', date '2021-09-01', 'official', 'https://www.browse.ai/about-us'),
    ('CapCut AI', date '2020-04-01', 'official', 'https://www.capcut.com/resource/capcut-app'),
    ('Captions', date '2021-01-01', 'estimated', 'https://captions.ai/blog/captions-announces-a-usd25-million-series-b-for-our-ai-powered-creative'),
    ('Cartesia', date '2024-05-01', 'official', 'https://www.cartesia.ai/blog'),
    ('Character.AI', date '2022-09-01', 'official', 'https://blog.character.ai/introducing-character/'),
    ('ClickUp Brain', date '2024-01-01', 'official', 'https://clickup.com/blog/clickup-brain/'),
    ('Clipdrop', date '2020-01-01', 'estimated', 'https://stability.ai/news-updates/stability-ai-acquires-init-ml-makers-of-clipdrop-application'),
    ('CodeRabbit', date '2023-07-01', 'estimated', 'https://www.coderabbit.ai/blog/coderabbit-announces-16m-series-a-funding-led-by-crv'),
    ('Connected Papers', date '2020-01-01', 'reported', 'https://www.connectedpapers.com/about'),
    ('Consensus', date '2022-06-01', 'estimated', 'https://consensus.app/home/blog/introducing-consensus/'),
    ('Continue', date '2023-06-01', 'official', 'https://github.com/continuedev/continue')
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
