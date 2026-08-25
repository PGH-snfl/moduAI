-- Eighth research batch: product launches and first confirmed AI-feature availability.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Framer AI', date '2023-06-01', 'official', 'https://www.framer.com/updates/june-update-2023'),
    ('Gong', date '2016-06-01', 'official', 'https://www.gong.io/press/gong-io-raises-6m-in-series-a-to-pioneer-sales-conversation-intelligence-software'),
    ('Granola', date '2024-05-01', 'official', 'https://www.granola.ai/blog/announcement'),
    ('Gorgias AI Agent', date '2024-07-01', 'estimated', 'https://www.gorgias.com/blog/our-ai-approach'),
    ('Hex', date '2021-03-01', 'official', 'https://hex.tech/blog/announcing-hex/'),
    ('HubSpot Breeze', date '2024-09-01', 'official', 'https://www.hubspot.com/company-news/spotlight-product-deep-dive-ai-made-easy-with-breeze-hubspots-new-ai-to-power-the-customer-platform')
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
