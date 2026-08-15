create table if not exists public.user_favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  tool_id uuid not null references public.tools(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, tool_id)
);

alter table public.user_favorites enable row level security;

drop policy if exists "Enable read own favorites" on public.user_favorites;
drop policy if exists "Enable insert own favorites" on public.user_favorites;
drop policy if exists "Enable delete own favorites" on public.user_favorites;

create policy "Enable read own favorites" on public.user_favorites
for select to authenticated using (auth.uid() = user_id);
create policy "Enable insert own favorites" on public.user_favorites
for insert to authenticated with check (auth.uid() = user_id);
create policy "Enable delete own favorites" on public.user_favorites
for delete to authenticated using (auth.uid() = user_id);

create index if not exists user_favorites_tool_idx on public.user_favorites(tool_id);
