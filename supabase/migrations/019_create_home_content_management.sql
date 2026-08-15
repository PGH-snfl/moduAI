-- Replace hard-coded home sections with administrator-managed content.

create table if not exists public.featured_promotions (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid references public.tools(id) on delete set null,
  headline text not null,
  description text not null,
  eyebrow text not null default '추천 AI 서비스',
  media_url text,
  destination_url text not null,
  button_text text not null default '자세히 보기',
  is_sponsored boolean not null default false,
  starts_at timestamptz not null default timezone('utc'::text, now()),
  ends_at timestamptz,
  priority integer not null default 0,
  is_active boolean not null default true,
  click_count bigint not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  check (ends_at is null or ends_at > starts_at),
  check (destination_url ~ '^https?://'),
  check (media_url is null or media_url ~ '^https?://')
);

create table if not exists public.featured_works (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('YouTube', 'Instagram', 'TikTok', 'Other')),
  external_id text,
  title text not null,
  creator_name text not null,
  description text not null,
  thumbnail_url text not null check (thumbnail_url ~ '^https?://'),
  content_url text not null check (content_url ~ '^https?://'),
  view_count bigint,
  like_count bigint,
  comment_count bigint,
  published_at timestamptz,
  ai_relevance_score integer check (ai_relevance_score between 0 and 100),
  popularity_score numeric not null default 0,
  status text not null default 'draft' check (status in ('draft', 'approved', 'rejected')),
  featured_from date not null default current_date,
  featured_until date,
  display_order integer not null default 0,
  click_count bigint not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (platform, external_id),
  check (featured_until is null or featured_until >= featured_from)
);

create table if not exists public.ai_technology_trends (
  id uuid primary key default gen_random_uuid(),
  topic_name text not null,
  short_name text not null,
  summary text not null,
  source_label text not null,
  source_url text not null check (source_url ~ '^https?://'),
  image_url text check (image_url is null or image_url ~ '^https?://'),
  paper_count_7d integer not null default 0 check (paper_count_7d >= 0),
  previous_paper_count_7d integer not null default 0 check (previous_paper_count_7d >= 0),
  growth_rate numeric not null default 0,
  representative_papers jsonb not null default '[]'::jsonb,
  calculated_at timestamptz not null default timezone('utc'::text, now()),
  display_order integer not null default 0,
  is_active boolean not null default true,
  click_count bigint not null default 0,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

alter table public.featured_promotions enable row level security;
alter table public.featured_works enable row level security;
alter table public.ai_technology_trends enable row level security;

create policy "Public can read currently visible promotions" on public.featured_promotions
  for select using (is_active and starts_at <= now() and (ends_at is null or ends_at > now()));
create policy "Public can read approved featured works" on public.featured_works
  for select using (status = 'approved' and featured_from <= current_date and (featured_until is null or featured_until >= current_date));
create policy "Public can read active technology trends" on public.ai_technology_trends
  for select using (is_active);

create policy "Admins manage promotions" on public.featured_promotions for all
  using (auth.jwt()->'app_metadata'->>'role' = 'admin')
  with check (auth.jwt()->'app_metadata'->>'role' = 'admin');
create policy "Admins manage featured works" on public.featured_works for all
  using (auth.jwt()->'app_metadata'->>'role' = 'admin')
  with check (auth.jwt()->'app_metadata'->>'role' = 'admin');
create policy "Admins manage technology trends" on public.ai_technology_trends for all
  using (auth.jwt()->'app_metadata'->>'role' = 'admin')
  with check (auth.jwt()->'app_metadata'->>'role' = 'admin');

create or replace function public.record_home_content_click(p_content_type text, p_content_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  if p_content_type = 'promotion' then
    update public.featured_promotions set click_count = click_count + 1 where id = p_content_id and is_active;
  elsif p_content_type = 'work' then
    update public.featured_works set click_count = click_count + 1 where id = p_content_id and status = 'approved';
  elsif p_content_type = 'trend' then
    update public.ai_technology_trends set click_count = click_count + 1 where id = p_content_id and is_active;
  else
    raise exception 'Unknown home content type';
  end if;
end;
$$;
revoke all on function public.record_home_content_click(text, uuid) from public;
grant execute on function public.record_home_content_click(text, uuid) to anon, authenticated;

insert into public.featured_promotions (headline, description, eyebrow, media_url, destination_url, button_text, is_sponsored, priority)
select '상상을 현실로 만드는 Runway의 차세대 크리에이티브', '텍스트, 이미지, 비디오를 넘나드는 창작을 지원하는 크리에이티브 AI 서비스입니다.', 'Rising Startup', 'https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1974&auto=format&fit=crop', 'https://runwayml.com/', '무료로 시작하기', true, 100
where not exists (select 1 from public.featured_promotions);

insert into public.featured_works (platform, external_id, title, creator_name, description, thumbnail_url, content_url, view_count, popularity_score, status, featured_from, display_order)
select * from (values
  ('YouTube','seed-youtube','Sora 2.0 vs 실제 촬영: 도쿄 빗길 비교','Tech Visionary','생성형 영상의 현실감을 분석한 콘텐츠','https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?q=80&w=800&auto=format&fit=crop','https://www.youtube.com',5400000::bigint,90::numeric,'approved',current_date,1),
  ('Instagram','seed-instagram','AI가 디자인한 미래형 스니커즈','@nike_future','AI와 증강현실을 활용한 패션 콘텐츠','https://images.unsplash.com/photo-1552346154-21d32810aba3?q=80&w=800&auto=format&fit=crop','https://www.instagram.com',null::bigint,80::numeric,'approved',current_date,2),
  ('TikTok','seed-tiktok','실시간 AI 아바타 활용 사례','prank_god','AI 아바타를 활용한 숏폼 콘텐츠','https://images.unsplash.com/photo-1633332755192-727a05c4013d?q=80&w=800&auto=format&fit=crop','https://www.tiktok.com',24500000::bigint,70::numeric,'approved',current_date,3)
) as seed(platform,external_id,title,creator_name,description,thumbnail_url,content_url,view_count,popularity_score,status,featured_from,display_order)
where not exists (select 1 from public.featured_works);

insert into public.ai_technology_trends (topic_name, short_name, summary, source_label, source_url, image_url, display_order)
select * from (values
  ('Generative AI & Theory','NeurIPS','생성형 모델과 딥러닝 최적화 연구','NeurIPS','https://neurips.cc/','https://images.unsplash.com/photo-1675271591211-126ad94e495d?q=80&w=1000&auto=format&fit=crop',1),
  ('Vision-Language & 3D','CVPR','이미지와 텍스트를 결합한 VLM 및 3D 생성 연구','CVPR','https://cvpr.thecvf.com/','https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=1000&auto=format&fit=crop',2),
  ('Efficient ML','ICML','언어 모델 경량화와 학습 효율성 연구','ICML','https://icml.cc/','https://images.unsplash.com/photo-1721321528410-00e12ca006ef?q=80&w=1000&auto=format&fit=crop',3),
  ('Representation Learning','ICLR','자기주도 학습과 강화학습의 표현 연구','ICLR','https://iclr.cc/','https://images.unsplash.com/photo-1620641788421-7a1c342ea42e?q=80&w=1000&auto=format&fit=crop',4),
  ('Applied AI & Agents','AAAI','자율 에이전트와 산업별 AI 응용 연구','AAAI','https://aaai.org/','https://images.unsplash.com/photo-1485827404703-89b55fcc595e?q=80&w=1000&auto=format&fit=crop',5)
) as seed(topic_name,short_name,summary,source_label,source_url,image_url,display_order)
where not exists (select 1 from public.ai_technology_trends);
