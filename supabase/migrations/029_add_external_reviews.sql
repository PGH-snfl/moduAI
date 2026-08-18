create table if not exists public.external_review_sources (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools(id) on delete cascade,
  provider text not null check (provider in ('trustpilot', 'g2', 'product_hunt', 'app_store', 'google_play', 'other')),
  source_name text not null,
  source_url text not null check (source_url ~ '^https?://'),
  external_product_id text,
  average_rating numeric(3,2) check (average_rating is null or average_rating between 0 and 5),
  review_count integer check (review_count is null or review_count >= 0),
  rating_scale integer not null default 5 check (rating_scale between 1 and 10),
  analysis_summary text,
  pros_summary text[] not null default '{}',
  cons_summary text[] not null default '{}',
  analysis_sample_size integer check (analysis_sample_size is null or analysis_sample_size >= 0),
  analyzed_at timestamptz,
  synced_at timestamptz,
  is_active boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (tool_id, provider)
);

create table if not exists public.external_reviews (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.external_review_sources(id) on delete cascade,
  external_review_id text not null,
  rating numeric(3,2) check (rating is null or rating between 0 and 10),
  title text,
  excerpt text check (excerpt is null or char_length(excerpt) <= 800),
  reviewer_name text,
  review_url text check (review_url is null or review_url ~ '^https?://'),
  published_at timestamptz,
  is_verified boolean not null default false,
  is_featured boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (source_id, external_review_id)
);

create index if not exists external_review_sources_tool_idx on public.external_review_sources(tool_id, is_active);
create index if not exists external_reviews_source_featured_idx on public.external_reviews(source_id, is_featured, published_at desc);

alter table public.external_review_sources enable row level security;
alter table public.external_reviews enable row level security;

create policy "Public reads active external review sources" on public.external_review_sources for select
using (is_active);
create policy "Admins manage external review sources" on public.external_review_sources for all
using (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin')
with check (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin');

create policy "Public reads reviews from active sources" on public.external_reviews for select
using (exists (select 1 from public.external_review_sources source where source.id = source_id and source.is_active));
create policy "Admins manage external reviews" on public.external_reviews for all
using (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin')
with check (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin');

comment on table public.external_review_sources is 'Licensed or officially accessible external review aggregates and analysis. Keep inactive until source and display rights are verified.';
comment on table public.external_reviews is 'Selected external review excerpts. Full reviews remain at the attributed source URL.';
