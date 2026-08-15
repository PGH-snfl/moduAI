create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  interests text[],
  preferred_categories text[],
  usage_stats jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_activities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  activity_type text not null check (activity_type in ('view', 'click', 'favorite', 'search')),
  tool_id uuid references public.tools(id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.user_profiles enable row level security;
alter table public.user_activities enable row level security;

drop policy if exists "Enable read own profile" on public.user_profiles;
drop policy if exists "Enable insert own profile" on public.user_profiles;
drop policy if exists "Enable update own profile" on public.user_profiles;
drop policy if exists "Enable read own activities" on public.user_activities;
drop policy if exists "Enable insert own activities" on public.user_activities;

create policy "Enable read own profile" on public.user_profiles for select to authenticated using (auth.uid() = id);
create policy "Enable insert own profile" on public.user_profiles for insert to authenticated with check (auth.uid() = id);
create policy "Enable update own profile" on public.user_profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);
create policy "Enable read own activities" on public.user_activities for select to authenticated using (auth.uid() = user_id);
create policy "Enable insert own activities" on public.user_activities for insert to authenticated with check (auth.uid() = user_id);

create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, display_name, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, '사용자'), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url'
  ) on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists auth_user_created_profile on auth.users;
create trigger auth_user_created_profile after insert on auth.users
for each row execute function public.handle_new_user_profile();

insert into public.user_profiles (id, display_name, avatar_url)
select id, coalesce(raw_user_meta_data ->> 'full_name', split_part(coalesce(email, '사용자'), '@', 1)), raw_user_meta_data ->> 'avatar_url'
from auth.users on conflict (id) do nothing;

create index if not exists user_activities_user_created_idx on public.user_activities(user_id, created_at desc);
