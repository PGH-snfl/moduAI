create table if not exists public.reviews (
  id uuid primary key default gen_random_uuid(),
  tool_id uuid not null references public.tools(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  display_name text not null default '사용자',
  rating integer not null check (rating between 1 and 5),
  content text check (char_length(content) <= 2000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (tool_id, user_id)
);

alter table public.reviews enable row level security;

drop policy if exists "reviews are publicly readable" on public.reviews;
drop policy if exists "users can create own reviews" on public.reviews;
drop policy if exists "users can update own reviews" on public.reviews;
drop policy if exists "users can delete own reviews" on public.reviews;

create policy "reviews are publicly readable" on public.reviews for select using (true);
create policy "users can create own reviews" on public.reviews for insert to authenticated with check (auth.uid() = user_id);
create policy "users can update own reviews" on public.reviews for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "users can delete own reviews" on public.reviews for delete to authenticated using (auth.uid() = user_id);

create or replace function public.refresh_tool_review_summary()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.tools
  set review_count = (select count(*) from public.reviews where tool_id = coalesce(new.tool_id, old.tool_id)),
      average_rating = coalesce((select round(avg(rating)::numeric, 1) from public.reviews where tool_id = coalesce(new.tool_id, old.tool_id)), 0),
      updated_at = now()
  where id = coalesce(new.tool_id, old.tool_id);
  return coalesce(new, old);
end;
$$;

drop trigger if exists reviews_refresh_tool_summary on public.reviews;
create trigger reviews_refresh_tool_summary after insert or update or delete on public.reviews
for each row execute function public.refresh_tool_review_summary();

create index if not exists reviews_tool_created_idx on public.reviews(tool_id, created_at desc);
