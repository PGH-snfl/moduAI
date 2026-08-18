-- Keep the profile provider aligned with the OAuth identity and ensure the
-- first OAuth callback is represented in the authentication audit trail.
create or replace function public.complete_social_onboarding(
  p_display_name text,
  p_avatar_url text,
  p_terms_version text,
  p_privacy_version text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_user_id uuid := auth.uid();
  v_provider text;
begin
  if v_user_id is null then raise exception 'Authentication required'; end if;
  if not exists (select 1 from auth.users where id = v_user_id and email is not null) then
    raise exception 'A verified provider email is required';
  end if;
  if length(trim(coalesce(p_display_name, ''))) < 1 or length(trim(p_display_name)) > 40 then
    raise exception 'Display name must be between 1 and 40 characters';
  end if;
  if length(trim(coalesce(p_terms_version, ''))) < 1 or length(trim(coalesce(p_privacy_version, ''))) < 1 then
    raise exception 'Consent versions are required';
  end if;

  v_provider := lower(coalesce(auth.jwt()->'app_metadata'->>'provider', 'other'));
  if v_provider not in ('google', 'kakao', 'email') then v_provider := 'other'; end if;

  insert into public.user_profiles (
    id, display_name, avatar_url, onboarding_completed, signup_provider, updated_at
  ) values (
    v_user_id, trim(p_display_name), nullif(trim(coalesce(p_avatar_url, '')), ''), true, v_provider, timezone('utc'::text, now())
  ) on conflict (id) do update set
    display_name = excluded.display_name,
    avatar_url = coalesce(excluded.avatar_url, public.user_profiles.avatar_url),
    onboarding_completed = true,
    signup_provider = excluded.signup_provider,
    updated_at = excluded.updated_at;

  insert into public.user_consents (user_id, document_type, document_version, acceptance_method, provider)
  values
    (v_user_id, 'terms', trim(p_terms_version), 'social_onboarding', v_provider),
    (v_user_id, 'privacy', trim(p_privacy_version), 'social_onboarding', v_provider)
  on conflict (user_id, document_type, document_version) do nothing;

  perform public.record_auth_audit_event('sign_in', v_provider, jsonb_build_object('source', 'social_onboarding'));
  perform public.record_auth_audit_event('signup_completed', v_provider, jsonb_build_object('method', 'social_onboarding'));
end;
$$;

revoke all on function public.complete_social_onboarding(text, text, text, text) from public, anon;
grant execute on function public.complete_social_onboarding(text, text, text, text) to authenticated;
