-- Upgrade launch dates from first-party announcements and correct Google Opal's public beta date.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Filmora AI', date '2023-10-01', 'official', 'https://filmora.wondershare.com/whats-new-in-filmora-video-editor-mac.html'),
    ('Google Opal', date '2025-07-24', 'official', 'https://developers.googleblog.com/en/introducing-opal/'),
    ('Gorgias AI Agent', date '2024-07-01', 'official', 'https://www.gorgias.com/blog/series-c2-ai-powered-cx'),
    ('ThoughtSpot Spotter', date '2024-11-13', 'official', 'https://www.thoughtspot.com/press-releases/thoughtspot-launches-spotter-the-autonomous-agent-for-analytics'),
    ('Zapier Agents', date '2025-01-22', 'official', 'https://zapier.com/blog/introducing-zapier-ai-agents/')
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
