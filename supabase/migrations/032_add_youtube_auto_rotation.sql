alter table public.featured_works
  add column if not exists is_auto_managed boolean not null default false;

update public.featured_works
set is_auto_managed = true
where platform = 'YouTube' and external_id is not null;

create index if not exists featured_works_auto_rotation_idx
  on public.featured_works (platform, is_auto_managed, status, view_count desc);

comment on column public.featured_works.is_auto_managed is
  'When true, the daily collector may approve or demote this item. Any manual admin visibility change sets it to false.';
