create or replace function public.handle_new_user_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  -- 직접 가입은 입력 폼 제출 시 이미 가입이 완료됐으므로 프로필을 즉시 생성한다.
  -- 소셜 인증만 마친 사용자는 가입 완료 화면을 제출할 때 애플리케이션에서 생성한다.
  if coalesce((new.raw_user_meta_data ->> 'onboarding_completed')::boolean, false) then
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
      true,
      coalesce(new.raw_app_meta_data ->> 'provider', 'email')
    ) on conflict (id) do nothing;
  end if;
  return new;
end;
$$;
