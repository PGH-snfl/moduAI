-- Ninth research batch: product launches and first public availability.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Leonardo.Ai', date '2023-01-01', 'estimated', 'https://leonardo.ai/news/supercharging-leonardo-with-canva'),
    ('Lindy', date '2023-03-01', 'official', 'https://www.lindy.ai/blog/meet-lindy'),
    ('Lovable', date '2024-11-01', 'official', 'https://lovable.dev/blog/one-year-of-lovable'),
    ('MagicSchool', date '2023-06-01', 'official', 'https://www.magicschool.ai/blog-posts/magicschool-ai-pioneers-program'),
    ('Magnific', date '2023-11-01', 'official', 'https://magnific.ai/'),
    ('Manus', date '2025-03-01', 'estimated', 'https://manus.im/blog/what-we-saw-in-the-past-three-months-and-what-we-see-in-the-future'),
    ('Microsoft 365 Copilot', date '2023-11-01', 'official', 'https://www.microsoft.com/en-us/microsoft-365/blog/2023/09/21/announcing-microsoft-365-copilot-general-availability-and-microsoft-365-chat/'),
    ('Microsoft Copilot', date '2023-09-01', 'official', 'https://blogs.microsoft.com/blog/2023/09/21/announcing-microsoft-copilot-your-everyday-ai-companion/')
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
