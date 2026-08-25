-- Replace description keyword category filtering with reusable relational
-- categories. Tags remain the source for the initial classification, while
-- admins can adjust tool_categories independently afterwards.

alter table public.categories
  add column if not exists description text,
  add column if not exists display_order smallint not null default 0,
  add column if not exists is_active boolean not null default true;

create unique index if not exists categories_slug_lower_unique_idx
  on public.categories (lower(slug));

create table if not exists public.tool_categories (
  tool_id uuid not null references public.tools(id) on delete cascade,
  category_id uuid not null references public.categories(id) on delete cascade,
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (tool_id, category_id)
);

alter table public.tool_categories enable row level security;

drop policy if exists "Enable read access for all users" on public.tool_categories;
drop policy if exists "Tool categories are publicly readable" on public.tool_categories;
create policy "Tool categories are publicly readable"
  on public.tool_categories for select using (true);

drop policy if exists "Admins can manage tool categories" on public.tool_categories;
create policy "Admins can manage tool categories"
  on public.tool_categories for all
  using (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin')
  with check (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin');

drop policy if exists "Enable read access for all users" on public.categories;
drop policy if exists "Active categories are publicly readable" on public.categories;
create policy "Active categories are publicly readable"
  on public.categories for select using (is_active = true);

drop policy if exists "Admins can manage categories" on public.categories;
create policy "Admins can manage categories"
  on public.categories for all
  using (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin')
  with check (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin');

insert into public.categories (name, slug, description, display_order, is_active)
values
  ('글쓰기·콘텐츠', 'writing-content', '글쓰기, 번역, 요약과 콘텐츠 제작', 10, true),
  ('디자인·이미지', 'design-art', '이미지 생성, 편집과 디자인', 20, true),
  ('영상·오디오', 'video-audio', '영상, 아바타, 음성 및 음악 제작', 30, true),
  ('업무·생산성', 'productivity', '문서, 협업, 발표와 업무 자동화', 40, true),
  ('교육·연구', 'education', '학습, 논문, 지식 정리와 연구', 50, true),
  ('개발', 'development', '코딩, 앱 제작과 개발자 API', 60, true),
  ('비즈니스·마케팅', 'business-marketing', '마케팅, 광고와 비즈니스 운영', 70, true),
  ('검색·데이터', 'search-data', '검색, 리서치, 분석과 데이터 활용', 80, true),
  ('엔터테인먼트', 'entertainment', '게임, 캐릭터와 창작 놀이', 90, true),
  ('기타', 'others', '다른 분류에 속하지 않는 AI 도구', 100, true)
on conflict do nothing;

update public.categories as category
set
  name = seed.name,
  description = seed.description,
  display_order = seed.display_order,
  is_active = true
from (values
  ('writing-content', '글쓰기·콘텐츠', '글쓰기, 번역, 요약과 콘텐츠 제작', 10),
  ('design-art', '디자인·이미지', '이미지 생성, 편집과 디자인', 20),
  ('video-audio', '영상·오디오', '영상, 아바타, 음성 및 음악 제작', 30),
  ('productivity', '업무·생산성', '문서, 협업, 발표와 업무 자동화', 40),
  ('education', '교육·연구', '학습, 논문, 지식 정리와 연구', 50),
  ('development', '개발', '코딩, 앱 제작과 개발자 API', 60),
  ('business-marketing', '비즈니스·마케팅', '마케팅, 광고와 비즈니스 운영', 70),
  ('search-data', '검색·데이터', '검색, 리서치, 분석과 데이터 활용', 80),
  ('entertainment', '엔터테인먼트', '게임, 캐릭터와 창작 놀이', 90),
  ('others', '기타', '다른 분류에 속하지 않는 AI 도구', 100)
) as seed(slug, name, description, display_order)
where lower(category.slug) = seed.slug;

with category_rules(category_slug, tag_pattern) as (
  values
    ('writing-content', '(글쓰기|콘텐츠|컨텐츠|번역|요약|문서|카피라이팅)'),
    ('design-art', '(디자인|이미지|그림|아트|일러스트|그래픽)'),
    ('video-audio', '(영상|비디오|오디오|음성|음악|자막|아바타)'),
    ('productivity', '(생산성|협업|프레젠테이션|발표|자동화|업무|올인원)'),
    ('education', '(교육|학습|논문|연구|지식|노트)'),
    ('development', '(개발|코딩|프로그래밍|API|앱제작)'),
    ('business-marketing', '(비즈니스|비지니스|마케팅|광고|브랜딩)'),
    ('search-data', '(검색|리서치|데이터|분석|답변|브라우징)'),
    ('entertainment', '(게임|캐릭터|롤플레이|엔터테인먼트)')
), matched as (
  select distinct tool_tags.tool_id, categories.id as category_id
  from public.tool_tags
  join public.tags on tags.id = tool_tags.tag_id and tags.is_active = true
  join category_rules on (tags.name || ' ' || tags.slug || ' ' || array_to_string(tags.aliases, ' ')) ~* category_rules.tag_pattern
  join public.categories on lower(categories.slug) = category_rules.category_slug
)
insert into public.tool_categories (tool_id, category_id)
select tool_id, category_id from matched
on conflict (tool_id, category_id) do nothing;

-- Keep every public tool discoverable even when its current tags do not match
-- a category. Admins can replace this fallback assignment later.
insert into public.tool_categories (tool_id, category_id)
select tools.id, categories.id
from public.tools
cross join public.categories
where categories.slug = 'others'
  and not exists (
    select 1 from public.tool_categories where tool_categories.tool_id = tools.id
  )
on conflict (tool_id, category_id) do nothing;

create index if not exists tool_categories_category_tool_idx
  on public.tool_categories (category_id, tool_id);

comment on table public.categories is 'Stable task categories shown in tool discovery filters';
comment on table public.tool_categories is 'Admin-managed many-to-many classification of AI tools';
