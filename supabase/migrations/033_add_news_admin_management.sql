alter table public.news
  add column if not exists summary text,
  add column if not exists is_published boolean not null default true,
  add column if not exists is_auto_collected boolean not null default false,
  add column if not exists is_manually_managed boolean not null default false,
  add column if not exists is_deleted boolean not null default false,
  add column if not exists updated_at timestamptz not null default timezone('utc'::text, now());

update public.news
set is_auto_collected = true
where source in ('Google News Korea', 'TechCrunch', 'Wired AI', 'The Verge AI');

create index if not exists news_admin_status_date_idx
  on public.news (is_published, category, published_date desc);

drop policy if exists "Enable read access for all users" on public.news;
drop policy if exists "Public reads published news" on public.news;
drop policy if exists "Admins manage news" on public.news;

create policy "Public reads published news" on public.news for select
using ((is_published and not is_deleted) or (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin'));

create policy "Admins manage news" on public.news for all
using (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin')
with check (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin');

comment on column public.news.is_published is 'Only published news is visible to non-admin users.';
comment on column public.news.is_auto_collected is 'True for RSS-collected records; administrators may still edit, hide, or delete them.';
comment on column public.news.is_manually_managed is 'Prevents the crawler from overwriting an administrator decision.';
comment on column public.news.is_deleted is 'Soft-delete tombstone that prevents an RSS item from reappearing.';
