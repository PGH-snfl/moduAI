-- Twelfth research batch: long-running productivity, education, and media tools.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Motion', date '2020-03-01', 'estimated', 'https://www.usemotion.com/blog/we-raised-13-million-in-series-a-to-automate-team-project-management'),
    ('Mubert', date '2017-01-01', 'estimated', 'https://mubert.com/documents/mubert_render_privacy_policy.pdf'),
    ('Murf AI', date '2020-10-01', 'official', 'https://murf.ai/about'),
    ('ProWritingAid', date '2013-01-01', 'official', 'https://prowritingaid.com/founders-story'),
    ('QuillBot', date '2017-01-01', 'official', 'https://quillbot.com/about'),
    ('Quizlet', date '2007-01-01', 'official', 'https://quizlet.com/blog/celebrating-10-years-of-quizletcom'),
    ('Rows AI', date '2023-06-01', 'official', 'https://rows.com/blog/post/introducing-the-ai-analyst')
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
