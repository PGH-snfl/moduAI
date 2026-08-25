-- Research-backed launch months for tools that were previously missing them.
-- Dates use the first day of the verified month because ranking only needs month precision.
-- "official" means the product owner published the launch/unveiling/release evidence.

with researched_dates(name, launched_at, status, source) as (
  values
    ('Ada', date '2016-01-01', 'official', 'https://www.ada.cx/about/'),
    ('Adobe Acrobat AI Assistant', date '2024-02-01', 'official', 'https://news.adobe.com/news/news-details/2024/adobe-brings-conversational-ai-to-trillions-of-pdfs-with-the-new-ai-assistant-in-reader-and-acrobat'),
    ('Adobe Firefly', date '2023-03-01', 'official', 'https://news.adobe.com/news/news-details/2023/adobe-unveils-firefly-a-family-of-new-creative-generative-ai'),
    ('AI Dungeon', date '2019-05-01', 'reported', 'https://en.wikipedia.org/wiki/AI_Dungeon'),
    ('Aider', date '2023-05-01', 'official', 'https://aider.chat/blog/'),
    ('Airtable AI', date '2023-05-01', 'official', 'https://www.airtable.com/newsroom/airtable-ai-announcement'),
    ('Amazon Q Developer', date '2023-11-01', 'official', 'https://aws.amazon.com/about-aws/whats-new/2023/11/aws-amazon-q-preview/'),
    ('Anyword', date '2021-03-01', 'official', 'https://www.anyword.com/blog/series-b-funding-round'),
    ('Apollo', date '2016-01-01', 'official', 'https://www.apollo.io/our-story'),
    ('AskYourPDF', date '2023-01-01', 'official', 'https://askyourpdf.com/blog/features'),
    ('Augment Code', date '2024-10-01', 'official', 'https://www.augmentcode.com/blog/meet-augment-code-developer-ai-for-teams'),
    ('Auphonic', date '2012-03-01', 'official', 'https://auphonic.com/blog/2012/03/27/auphonic-audio-post-production-now-open-public-users/'),
    ('Bardeen', date '2021-05-01', 'estimated', 'https://www.bardeen.ai/release-notes'),
    ('Beatoven.ai', date '2021-11-01', 'official', 'https://www.beatoven.ai/blog/tag/content-creators/'),
    ('Bito', date '2022-12-01', 'official', 'https://docs.bito.ai/changelog/previous-releases')
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
