-- Store tags as reusable entities and connect them to tools through a
-- many-to-many table. Existing hashtags in tool descriptions are migrated
-- without deleting them yet, so older clients remain compatible.

create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  tag_group text,
  aliases text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  constraint tags_name_not_blank check (btrim(name) <> ''),
  constraint tags_slug_not_blank check (btrim(slug) <> '')
);

create unique index if not exists tags_name_lower_unique_idx
  on public.tags (lower(name));
create unique index if not exists tags_slug_lower_unique_idx
  on public.tags (lower(slug));

create table if not exists public.tool_tags (
  tool_id uuid not null references public.tools(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  is_primary boolean not null default false,
  position smallint not null default 0 check (position >= 0),
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (tool_id, tag_id)
);

create index if not exists tool_tags_tag_id_idx on public.tool_tags(tag_id);
create index if not exists tool_tags_tool_position_idx on public.tool_tags(tool_id, position);

alter table public.tags enable row level security;
alter table public.tool_tags enable row level security;

drop policy if exists "Tags are publicly readable" on public.tags;
create policy "Tags are publicly readable"
  on public.tags for select using (is_active = true);

drop policy if exists "Tool tags are publicly readable" on public.tool_tags;
create policy "Tool tags are publicly readable"
  on public.tool_tags for select using (true);

drop policy if exists "Admins can manage tags" on public.tags;
create policy "Admins can manage tags"
  on public.tags for all
  using (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin')
  with check (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin');

drop policy if exists "Admins can manage tool tags" on public.tool_tags;
create policy "Admins can manage tool tags"
  on public.tool_tags for all
  using (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin')
  with check (auth.role() = 'authenticated' and auth.jwt()->'app_metadata'->>'role' = 'admin');

with extracted as (
  select distinct match[1] as name
  from public.tools t
  cross join lateral regexp_matches(t.description, '#([A-Za-z0-9_가-힣]+)', 'g') as match
)
insert into public.tags (name, slug)
select name, lower(name)
from extracted
where btrim(name) <> ''
on conflict do nothing;

with extracted as (
  select
    t.id as tool_id,
    match[1] as tag_name,
    match.ordinality - 1 as position
  from public.tools t
  cross join lateral regexp_matches(t.description, '#([A-Za-z0-9_가-힣]+)', 'g')
    with ordinality as match(match, ordinality)
)
insert into public.tool_tags (tool_id, tag_id, is_primary, position)
select e.tool_id, tags.id, e.position = 0, e.position
from extracted e
join public.tags tags on lower(tags.name) = lower(e.tag_name)
on conflict (tool_id, tag_id) do update set
  is_primary = excluded.is_primary,
  position = excluded.position;

comment on table public.tags is 'Reusable normalized tags for search, recommendations, analytics, and grouping';
comment on table public.tool_tags is 'Many-to-many relationship between AI tools and tags';

create or replace function public.sync_tool_description_tags()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_match text[];
  v_position integer := 0;
  v_tag_id uuid;
begin
  for v_match in
    select regexp_matches(new.description, '#([A-Za-z0-9_가-힣]+)', 'g')
  loop
    insert into public.tags (name, slug)
    values (v_match[1], lower(v_match[1]))
    on conflict do nothing;

    select id into v_tag_id
    from public.tags
    where lower(name) = lower(v_match[1]);

    insert into public.tool_tags (tool_id, tag_id, is_primary, position)
    values (new.id, v_tag_id, v_position = 0, v_position)
    on conflict (tool_id, tag_id) do nothing;

    v_position := v_position + 1;
  end loop;
  return new;
end;
$$;

drop trigger if exists tools_sync_description_tags on public.tools;
create trigger tools_sync_description_tags
after insert or update of description on public.tools
for each row execute function public.sync_tool_description_tags();
