-- Eleventh research batch: launches, public betas, and earliest official product evidence.

with researched_dates(name, launched_at, status, source) as (
  values
    ('n8n', date '2019-06-01', 'official', 'https://blog.n8n.io/celebrating-n8n-second-anniversary/'),
    ('Notion AI', date '2023-02-01', 'official', 'https://www.notion.com/blog/notion-ai-is-here-for-everyone'),
    ('Otter.ai', date '2018-02-01', 'official', 'https://otter.ai/press'),
    ('Photoroom', date '2019-01-01', 'estimated', 'https://help.photoroom.com/en/articles/9626719-what-is-photoroom'),
    ('Pika', date '2023-06-01', 'estimated', 'https://pika.art/blog'),
    ('Poe', date '2022-12-01', 'official', 'https://techcrunch.com/2022/12/21/quora-launches-poe-a-way-to-talk-to-ai-chatbots-like-chatgpt/'),
    ('remove.bg', date '2018-01-01', 'estimated', 'https://www.remove.bg/about-us'),
    ('Replit Agent', date '2024-12-01', 'official', 'https://blog.replit.com/new-ai-assistant-announcement'),
    ('Salesforce Agentforce', date '2024-09-01', 'official', 'https://www.salesforce.com/news/press-releases/2024/09/12/agentforce-announcement/')
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
