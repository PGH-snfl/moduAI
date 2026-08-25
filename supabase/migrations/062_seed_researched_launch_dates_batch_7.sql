-- Sixth research batch: first public previews/announcements of the registered products.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Figma AI', date '2024-06-01', 'official', 'https://www.figma.com/blog/introducing-figma-ai/'),
    ('Gemini Code Assist', date '2024-04-01', 'official', 'https://blog.google/innovation-and-ai/infrastructure-and-cloud/google-cloud/google-cloud-next-2024-generative-ai-gemini/'),
    ('GitHub Copilot', date '2021-06-01', 'official', 'https://github.blog/news-insights/product-news/introducing-github-copilot-ai-pair-programmer/'),
    ('Google Flow', date '2025-05-01', 'official', 'https://blog.google/innovation-and-ai/products/google-flow-veo-ai-filmmaking-tool/'),
    ('Google Opal', date '2025-08-01', 'estimated', 'https://blog.google/innovation-and-ai/models-and-research/google-labs/opal-expansion/'),
    ('Grok', date '2023-11-01', 'official', 'https://x.ai/news/grok'),
    ('HeyGen', date '2022-07-01', 'official', 'https://www.heygen.com/blog/0-1m-arr-in-7-months'),
    ('Ideogram', date '2023-08-01', 'official', 'https://ideogram.ai/launch'),
    ('Intercom Fin', date '2023-03-01', 'official', 'https://www.intercom.com/blog/announcing-intercoms-new-ai-chatbot/'),
    ('Jasper', date '2021-01-01', 'official', 'https://www.jasper.ai/blog/jasper-announces-125m-series-a-funding'),
    ('JetBrains AI', date '2023-06-01', 'official', 'https://blog.jetbrains.com/idea/2023/06/ai-assistant-in-jetbrains-ides/'),
    ('Khanmigo', date '2023-03-01', 'official', 'https://blog.khanacademy.org/khanmigo-top-ai-in-education-moments-of-2023-the-year-artificial-intelligence-dominated-education-news-kl/')
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
