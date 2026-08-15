-- Product launch month research. Dates use the first day because ranking only
-- needs year/month granularity. Sources are retained for audit and correction.

alter table public.tools
  add column if not exists launched_at date,
  add column if not exists launch_date_status text,
  add column if not exists launch_date_source text;

alter table public.tools drop constraint if exists tools_launch_date_status_check;
alter table public.tools add constraint tools_launch_date_status_check
  check (launch_date_status is null or launch_date_status in ('official', 'reported', 'estimated'));

update public.tools t set
  launched_at = v.launched_at,
  launch_date_status = v.status,
  launch_date_source = v.source
from (values
  ('ChatGPT', date '2022-11-01', 'official', 'https://openai.com/index/chatgpt/'),
  ('Claude', date '2023-03-01', 'official', 'https://www.anthropic.com/news/introducing-claude'),
  ('Google Gemini', date '2024-02-01', 'official', 'https://blog.google/intl/en-africa/products/explore-get-answers/bard-becomes-gemini-try-ultra-10-and-a-new-mobile-app-today/'),
  ('Perplexity', date '2022-12-01', 'reported', 'https://en.wikipedia.org/wiki/Perplexity_AI'),
  ('Canva AI', date '2023-10-01', 'official', 'https://public.canva.site/canva-press-hub-media-releases/'),
  ('DeepL', date '2017-08-01', 'official', 'https://www.deepl.com/en/blog/20180215'),
  ('Grammarly', date '2009-07-01', 'reported', 'https://www.grammarly.com/blog/institutions/back-to-school-in-the-generative-ai-era/'),
  ('NotebookLM', date '2023-07-01', 'official', 'https://blog.google/innovation-and-ai/products/notebooklm-new-features-availability/'),
  ('Genspark', date '2024-06-01', 'official', 'https://www.genspark.ai/blog/genspark-new-features-20240701'),
  ('Higgsfield', date '2024-04-01', 'reported', 'https://techcrunch.com/2024/04/03/former-snap-ai-chief-launches-higgsfield-to-take-on-openais-sora-video-generator/'),
  ('Kling AI', date '2024-06-01', 'official', 'https://kuaishou.gcs-web.com/news-releases/news-release-details/kuaishou-launches-full-beta-testing-kling-ai-global-users-0/'),
  ('Viggle AI', date '2023-12-01', 'estimated', 'https://discord.com/servers/1181076253172842537'),
  ('OpenArt', date '2022-08-01', 'estimated', 'https://news.ycombinator.com/item?id=32598151'),
  ('PixAI', date '2022-12-01', 'estimated', 'https://pix.ai/'),
  ('Tripo Studio', date '2023-12-01', 'reported', 'https://podcast.latepost.com/59'),
  ('Lilys AI', date '2023-09-01', 'estimated', 'https://v.daum.net/v/XzTXvtxpl6'),
  ('뤼튼 (Wrtn)', date '2022-10-01', 'reported', 'https://www.asiae.co.kr/article/2022122010100795537')
) as v(name, launched_at, status, source)
where t.name = v.name;

select public.refresh_tool_ranking_scores();

