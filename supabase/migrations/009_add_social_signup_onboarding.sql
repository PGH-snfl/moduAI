do $$
begin
  if not exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'user_profiles'
      and column_name = 'onboarding_completed'
  ) then
    alter table public.user_profiles
    add column onboarding_completed boolean not null default false;

    -- 마이그레이션 전에 존재한 회원은 다시 가입 절차를 요구하지 않는다.
    update public.user_profiles set onboarding_completed = true;
  end if;
end;
$$;

create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (id, display_name, avatar_url, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(coalesce(new.email, '사용자'), '@', 1)),
    new.raw_user_meta_data ->> 'avatar_url',
    coalesce((new.raw_user_meta_data ->> 'onboarding_completed')::boolean, false)
  ) on conflict (id) do nothing;
  return new;
end;
$$;
