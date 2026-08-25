-- Track operational status separately from research depth, repair moved official links,
-- and retain each distinct first-party product, pricing, and API source.

alter table public.tools
  add column if not exists service_status text not null default 'unknown'
    check (service_status in ('active', 'beta', 'waitlist', 'discontinued', 'unknown')),
  add column if not exists service_status_source text,
  add column if not exists service_status_verified_at timestamptz;

update public.tools
set service_status = case
      when name = 'Phind' then 'discontinued'
      when name = 'Gambo' then 'unknown'
      else 'active'
    end,
    service_status_source = case
      when name = 'Phind' then 'https://www.ycombinator.com/companies/phind'
      else url
    end,
    service_status_verified_at = now();

with repaired(name, api_url) as (
  values
    ('Apollo', 'https://docs.apollo.io/reference/apollo-api'),
    ('Auphonic', 'https://auphonic.com/help/api/index.html'),
    ('BLACKBOX AI', 'https://docs.blackbox.ai/api-reference/v1/introduction'),
    ('Browse AI', 'https://help.browse.ai/en/articles/12683249-api-guide-getting-started'),
    ('Gumloop', 'https://docs.gumloop.com/'),
    ('Mubert', 'https://mubert.com/api'),
    ('Poe', 'https://creator.poe.com/api-reference/overview'),
    ('Rytr', 'https://rytr.me/products/api'),
    ('Salesforce Agentforce', 'https://developer.salesforce.com/docs/ai/agentforce/guide/get-started-agents.html'),
    ('Writesonic', 'https://docs.writesonic.com/reference/introduction')
)
update public.tools t
set api_url = r.api_url,
    updated_at = now()
from repaired r
where t.name = r.name;

update public.tools
set url = 'https://www.semrush.com/ai-seo/',
    pricing_url = 'https://www.semrush.com/pricing/',
    updated_at = now()
where name = 'Semrush AI';

update public.tools
set pricing_url = 'https://www.beatoven.ai/',
    updated_at = now()
where name = 'Beatoven.ai';

update public.tools
set pricing_url = null,
    pricing_verified_at = null,
    verification_notes = '공식 주소 연결 실패로 현재 서비스 운영과 가격을 확인할 수 없습니다. 운영 상태를 재확인해야 합니다.',
    updated_at = now()
where name = 'Gambo';

update public.tools t
set verification_sources = array(
      select distinct source
      from unnest(
        coalesce(t.verification_sources, '{}'::text[])
        || array[t.url, t.pricing_url, case when t.has_api then t.api_url end]
      ) source
      where source is not null and btrim(source) <> ''
    ),
    updated_at = now();

select public.refresh_tool_ranking_scores();
