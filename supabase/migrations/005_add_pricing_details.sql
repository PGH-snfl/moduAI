alter table public.tools
  add column if not exists pricing_summary text,
  add column if not exists pricing_details text[],
  add column if not exists pricing_currency text,
  add column if not exists billing_period text,
  add column if not exists pricing_url text,
  add column if not exists pricing_verified_at timestamp with time zone;

comment on column public.tools.pricing_summary is
  '목록과 빠른 보기에 표시할 짧은 가격 설명';
comment on column public.tools.pricing_details is
  '무료 범위, 추가 과금, 결제 유의사항 등 검증된 가격 정보';
comment on column public.tools.pricing_verified_at is
  '가격 정보를 마지막으로 확인한 시각';
