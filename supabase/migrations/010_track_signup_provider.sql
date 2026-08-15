alter table public.user_profiles
add column if not exists signup_provider text not null default 'email';

update public.user_profiles as profile
set signup_provider = coalesce((
  select identities.provider
  from auth.identities
  where identities.user_id = profile.id
  order by identities.created_at asc
  limit 1
), 'email');

create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.user_profiles (
    id,
    display_name,
    avatar_url,
    onboarding_completed,
    signup_provider
  )
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data ->> 'full_name',
      new.raw_user_meta_data ->> 'name',
      split_part(coalesce(new.email, '사용자'), '@', 1)
    ),
    coalesce(
      new.raw_user_meta_data ->> 'avatar_url',
      new.raw_user_meta_data ->> 'picture'
    ),
    coalesce((new.raw_user_meta_data ->> 'onboarding_completed')::boolean, false),
    coalesce(new.raw_app_meta_data ->> 'provider', 'email')
  ) on conflict (id) do nothing;
  return new;
end;
$$;
