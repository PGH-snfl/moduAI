-- Separate documentary verification from hands-on testing and classify the full catalog.

alter table public.tools
  add column if not exists source_verified boolean not null default false,
  add column if not exists hands_on_verified boolean not null default false,
  add column if not exists api_tested boolean not null default false,
  add column if not exists korean_tested boolean not null default false,
  add column if not exists verification_level text not null default 'unverified',
  add column if not exists last_tested_at timestamptz,
  add column if not exists verification_notes text;

alter table public.tools drop constraint if exists tools_verification_level_check;
alter table public.tools add constraint tools_verification_level_check
  check (verification_level in ('unverified', 'official_sources', 'partial_hands_on', 'full_hands_on'));

comment on column public.tools.source_verified is 'Official product, pricing, help, or developer sources were checked.';
comment on column public.tools.hands_on_verified is 'Core product behavior was checked through actual use.';
comment on column public.tools.api_tested is 'A real authenticated API request succeeded; documentation alone is false.';
comment on column public.tools.korean_tested is 'Korean input or output was checked through actual use.';
comment on column public.tools.verification_level is 'unverified, official_sources, partial_hands_on, or full_hands_on.';
comment on column public.tools.last_tested_at is 'Most recent hands-on test date, not documentary verification date.';
comment on column public.tools.verification_notes is 'Short public-safe note describing the evidence and remaining gaps.';

-- Documentary verification requires at least one recorded source. Keep is_verified as a
-- backwards-compatible alias for source verification until ranking consumers are migrated.
update public.tools
set
  source_verified = coalesce(array_length(verification_sources, 1), 0) > 0,
  hands_on_verified = false,
  api_tested = false,
  korean_tested = false,
  verification_level = case
    when coalesce(array_length(verification_sources, 1), 0) > 0 then 'official_sources'
    else 'unverified'
  end,
  last_tested_at = null,
  verification_notes = case
    when coalesce(array_length(verification_sources, 1), 0) > 0
      then '공식 제품·가격·도움말·개발자 문서를 확인했습니다. 실제 계정 생성과 기능 실행은 아직 검증하지 않았습니다.'
    else '공식 출처와 실제 기능을 아직 충분히 검증하지 않았습니다.'
  end,
  is_verified = coalesce(array_length(verification_sources, 1), 0) > 0;

-- Wrtn has previously received user-perspective review in this project, but the complete
-- sign-up/payment/API matrix has not been executed, so it remains partial rather than full.
update public.tools
set
  source_verified = true,
  hands_on_verified = true,
  korean_tested = true,
  api_tested = false,
  verification_level = 'partial_hands_on',
  last_tested_at = coalesce(verified_at, now()),
  verification_notes = '공식 자료 확인과 한국어 사용자 관점의 부분 기능 검증을 완료했습니다. 결제·환불·API 호출을 포함한 전체 시나리오는 아직 미검증입니다.',
  is_verified = true
where name = '뤼튼 (Wrtn)';

create index if not exists idx_tools_verification_level on public.tools(verification_level);
create index if not exists idx_tools_source_verified on public.tools(source_verified) where source_verified;
create index if not exists idx_tools_hands_on_verified on public.tools(hands_on_verified) where hands_on_verified;
