-- Re-audit every catalog price against the linked official page.
-- Exact figures remain public only when the official page exposed the same figure
-- during the 2026-08-20 sweep. Dynamic, protected, or incomplete pages use a
-- non-numeric label so visitors are never sent to a page that contradicts a card.

alter table public.tools
  add column if not exists pricing_verification_status text not null default 'unverified'
    check (pricing_verification_status in (
      'official_exact', 'official_partial', 'access_limited',
      'custom_quote', 'unavailable', 'unverified'
    )),
  add column if not exists pricing_checked_at timestamp with time zone;

comment on column public.tools.pricing_verification_status is
  'Result of comparing the displayed price with the linked official page.';
comment on column public.tools.pricing_checked_at is
  'When the official price URL was last checked, including checks that could not confirm a figure.';

-- The whole catalog was checked in this sweep. Existing figures that matched are exact.
update public.tools
set pricing_checked_at = now(),
    pricing_verification_status = case
      when pricing_url is null then 'unavailable'
      when pricing_verified_at is not null then 'official_exact'
      else 'unverified'
    end;

-- Pages where only part of the stored figures was visible. Remove every number
-- rather than presenting an unconfirmed amount on the card or detail page.
update public.tools
set pricing_verification_status = 'official_partial',
    pricing_start_at = case when pricing_type in ('Free', 'Freemium') then '무료 플랜 제공' else null end,
    pricing_summary = case
      when pricing_type = 'Free' then '무료 이용 가능 · 제공 범위는 공식 안내 확인'
      when pricing_type = 'Freemium' then '무료 플랜 제공 · 유료 금액은 공식 가격표 확인'
      when pricing_type = 'Contact' then '공식 사이트에서 견적 문의'
      else '유료 플랜 제공 · 현재 금액은 공식 가격표 확인'
    end,
    pricing_details = array[
      '공식 페이지에서 플랜 제공 여부는 확인했지만 저장된 모든 금액을 동시에 확인하지 못했습니다.',
      '지역, 세금, 결제 주기와 로그인 상태에 따라 표시 금액이 달라질 수 있으므로 아래 공식 링크에서 최종 금액을 확인하세요.'
    ],
    pricing_verified_at = null
where name = any (array[
  'Adobe Firefly','Bardeen','BLACKBOX AI','Captions','Cleanvoice AI','Grammarly',
  'Humata','LALAL.AI','Leonardo.Ai','Lilys AI','Litmaps','Lovable','Luma AI',
  'Make AI Agents','Manus','Microsoft Copilot','Napkin AI','Notion AI','Otter.ai',
  'Pika','Playground','Poe','Recraft','ResearchRabbit','Riverside',
  'Salesforce Agentforce','Semrush AI','Speechify','Tidio Lyro','Viggle AI',
  'Wolfram|Alpha','드롭샷 AI'
]);

-- These official pages were blocked, client-rendered, unreachable, or did not
-- expose the stored figure. Keep the link but publish no price claim.
update public.tools
set pricing_verification_status = 'access_limited',
    pricing_start_at = case when pricing_type in ('Free', 'Freemium') then '무료 제공 여부 확인 필요' else null end,
    pricing_summary = '현재 금액은 공식 가격·결제 화면에서 확인',
    pricing_details = array[
      '공식 가격 페이지가 로그인, 지역 설정, 클라이언트 렌더링 또는 자동 접근 제한을 사용해 금액을 독립적으로 확인하지 못했습니다.',
      '확인되지 않은 기존 숫자는 노출하지 않습니다. 아래 공식 링크에서 결제 직전 금액과 조건을 확인하세요.'
    ],
    pricing_verified_at = null
where name = any (array[
  'Adobe Podcast','Connected Papers','Devin','Dust','Eduaide.AI','Kling AI','Krea',
  'LTX Studio','Webflow AI','Windsurf','Looka'
]);

-- Quote-only pages do not have a public list price.
update public.tools
set pricing_verification_status = 'custom_quote',
    pricing_start_at = null,
    pricing_summary = '공개 정가 없음 · 기업 맞춤 견적',
    pricing_details = array['공식 페이지에서 공개 정가를 제공하지 않습니다. 도입 조건과 사용량을 제출해 견적을 받아야 합니다.'],
    pricing_verified_at = now()
where name = any (array[
  'Ada','Augment Code','DataRobot','Gong','Gorgias AI Agent','Magnific',
  'Obviously AI','Relevance AI','Scite','Sierra','Sourcegraph'
]);

-- Filmora and Ocoya expose purchasable plans but the amount varies by storefront/region.
update public.tools
set pricing_verification_status = 'official_partial',
    pricing_start_at = null,
    pricing_summary = '유료 플랜 제공 · 지역별 공식 결제 화면 확인',
    pricing_details = array['공식 구매 페이지에서 플랜은 확인했지만 지역과 프로모션에 따라 금액이 달라 숫자를 고정하지 않았습니다.'],
    pricing_verified_at = null
where name = any (array['Filmora AI','Ocoya']);

-- Missing/discontinued sources must never retain an old amount.
update public.tools
set pricing_verification_status = 'unavailable',
    pricing_start_at = null,
    pricing_summary = case when name = 'Phind' then '서비스 종료 · 현재 구매 불가' else '운영 및 가격 확인 불가' end,
    pricing_details = case
      when name = 'Phind' then array['서비스 종료가 확인되어 과거 요금은 현재 가격으로 노출하지 않습니다.']
      else array['접속 가능한 공식 가격 출처를 찾지 못해 기존 가격을 삭제했습니다.']
    end,
    pricing_url = null,
    pricing_verified_at = null
where name = any (array['Gambo','Phind']);

-- Exact figures independently confirmed on current official pages/help documents.
update public.tools set
  pricing_verification_status='official_exact', pricing_type='Paid', pricing_start_at='$4.99',
  pricing_summary='AI Assistant 추가 월 $4.99부터',
  pricing_details=array['Acrobat AI Assistant 추가 기능은 월 $4.99부터 표시됩니다.','세금·기본 Acrobat 플랜 포함 여부는 공식 가격표에서 확인하세요.'],
  pricing_verified_at=now()
where name='Adobe Acrobat AI Assistant';

update public.tools set
  pricing_verification_status='official_exact', pricing_type='Freemium', pricing_start_at='$0',
  pricing_summary='Free $0 · Pro 연 $144/인 · Business 연 $250/인',
  pricing_details=array['Canva Free는 연 $0입니다.','Canva Pro는 연 $144/인입니다.','Canva Business는 연 $250/인입니다.'],
  pricing_currency='USD', pricing_verified_at=now()
where name='Canva AI';

update public.tools set
  pricing_verification_status='official_exact', pricing_type='Freemium', pricing_start_at='$0',
  pricing_summary='Free $0 · Pro 월 $20 · Deep 월 $65',
  pricing_details=array['Pro는 월 $20 또는 연 $144(월 환산 $12)입니다.','Deep는 월 $65 또는 연 $540(월 환산 $45)입니다.'],
  pricing_url='https://help.consensus.app/en/articles/10087865-subscription-plans', pricing_verified_at=now()
where name='Consensus';

update public.tools set
  pricing_verification_status='official_exact', pricing_type='Paid', pricing_start_at='$9',
  pricing_summary='Basic 월 $9부터',
  pricing_details=array['공식 Higgsfield 가격 안내에서 Basic 월 $9부터 시작합니다.','상위 플랜과 지역별 표시는 공식 가격표에서 확인하세요.'],
  pricing_verified_at=now()
where name='Higgsfield';

update public.tools set
  pricing_verification_status='official_exact', pricing_type='Paid', pricing_start_at='$19',
  pricing_summary='Pro AI 월 $19/좌석 · Business AI 월 $29/좌석',
  pricing_details=array['Pro AI는 좌석당 월 $19로 표시됩니다.','Business AI는 좌석당 월 $29로 표시됩니다.','월간·연간 결제 조건은 공식 가격표에서 선택하세요.'],
  pricing_verified_at=now()
where name='Motion';

update public.tools set
  pricing_verification_status='official_exact', pricing_type='Freemium', pricing_start_at='$0',
  pricing_summary='Free $0 · Creator 월 $19 · Business 월 $66',
  pricing_details=array['Free 플랜은 $0이며 음성 생성 10분을 제공합니다.','Creator는 월 $19, Business는 월 $66으로 표시됩니다.','연간 결제·프로모션 여부는 공식 가격표에서 확인하세요.'],
  pricing_verified_at=now()
where name='Murf AI';

update public.tools set
  pricing_verification_status='official_exact', pricing_type='Freemium', pricing_start_at='€0',
  pricing_summary='Community 자체 호스팅 · Starter 월 €20 · Pro 월 €50',
  pricing_details=array['Community Edition은 자체 호스팅으로 사용할 수 있습니다.','Starter는 연간 결제 기준 월 €20, Pro는 월 €50입니다.','Business는 연간 결제 기준 월 €667입니다.'],
  pricing_currency='EUR', pricing_verified_at=now()
where name='n8n';

update public.tools set
  pricing_verification_status='official_exact', pricing_type='Paid', pricing_start_at='$10',
  pricing_summary='Hobby & Student 연간 결제 월 $10부터',
  pricing_details=array['Hobby & Student는 연간 결제 월 $10 또는 월간 $19입니다.','Professional은 연간 결제 월 $22 또는 월간 $29입니다.','Max는 연간 결제 월 $44 또는 월간 $59입니다.'],
  pricing_url='https://docs.sudowrite.com/plans--account/wBnmhtSyMcWtk2BLzifGkz/what-plans-are-available/mwfVvj2rGcKYs1BQy4Pdcb', pricing_verified_at=now()
where name='Sudowrite';

update public.tools set
  pricing_verification_status='official_exact', pricing_type='Paid', pricing_start_at='$49',
  pricing_summary='Discovery 연간 결제 월 $49부터',
  pricing_details=array['Discovery는 연간 결제 기준 월 $49입니다.','Standard는 월 $99, Pro는 월 $182, Peace of Mind는 월 $299입니다.'],
  pricing_verified_at=now()
where name='Surfer';

update public.tools set
  pricing_verification_status='official_exact', pricing_type='Paid', pricing_start_at='$39',
  pricing_summary='Code Assistant 연간 계약 월 $39/인',
  pricing_details=array['Code Assistant는 연간 계약 기준 사용자당 월 $39입니다.','Agentic Platform은 연간 계약 기준 사용자당 월 $59입니다.','Tabnine 제공 LLM 사용에는 공급자 가격과 5% 처리 수수료가 추가될 수 있습니다.'],
  pricing_verified_at=now()
where name='Tabnine';

update public.tools set
  pricing_verification_status='official_exact', pricing_type='Freemium', pricing_start_at='$0',
  pricing_summary='Free $0 · Standard 월 $20 · Pro 월 $35 · Max 월 $95',
  pricing_details=array['Free는 월 $0이며 7,000크레딧을 제공합니다.','Standard는 월 $20, Pro는 월 $35, Max는 월 $95입니다.'],
  pricing_verified_at=now()
where name='Marble by World Labs';

update public.tools set
  pricing_verification_status='official_exact', pricing_type='Freemium', pricing_start_at='$0',
  pricing_summary='Free · Standard 월 $10 · Pro 월 $30',
  pricing_details=array['무료 플랜을 제공합니다.','Standard는 월 $10, Pro는 월 $30입니다.'],
  pricing_url='https://help.udio.com/en/articles/10739199-changing-or-canceling-your-subscription', pricing_verified_at=now()
where name='Udio';

-- Officially free tools whose pages do not contain a conventional price table.
update public.tools
set pricing_verification_status='official_exact', pricing_type='Free', pricing_start_at='무료',
    pricing_summary='무료 이용 가능',
    pricing_details=array['공식 서비스 안내에서 무료 이용을 확인했습니다. 별도 모델 API를 연결하면 해당 공급자 비용이 발생할 수 있습니다.'],
    pricing_verified_at=now()
where name = any (array['Aider','Google Opal','Khroma','뤼튼 (Wrtn)']);

-- Partial pages where the public primary amount was directly present are rewritten
-- to contain only that confirmed amount; unmatched secondary figures are removed.
update public.tools set pricing_verification_status='official_exact', pricing_start_at='$0', pricing_summary='무료 제한 사용 · Premium 월 $9.99 · API Pro 월 $19.99', pricing_details=array['공식 가격 안내에서 Premium 월 $9.99와 API Pro 월 $19.99를 확인했습니다.'], pricing_verified_at=now() where name='AskYourPDF';
update public.tools set pricing_verification_status='official_exact', pricing_start_at='$0', pricing_summary='무료 크레딧 제공 · 비동기 전사 시간당 $0.61부터', pricing_details=array['공식 가격표에서 비동기 전사는 시간당 $0.61부터 표시됩니다.'], pricing_verified_at=now() where name='Gladia';
update public.tools set pricing_verification_status='official_exact', pricing_start_at='$29.99', pricing_summary='Plus 월 $29.99/사용자부터', pricing_details=array['공식 가격표에서 Plus는 사용자당 월 $29.99로 표시됩니다. 상위 플랜은 공식 링크에서 확인하세요.'], pricing_verified_at=now() where name='Lindy';
update public.tools set pricing_verification_status='official_exact', pricing_start_at='$0', pricing_summary='Free $0 · Starter 월 $15 · Pro 월 $29', pricing_details=array['공식 가격표에서 Free $0, Starter 월 $15, Pro 월 $29를 확인했습니다.'], pricing_verified_at=now() where name='OpusClip';
update public.tools set pricing_verification_status='official_exact', pricing_start_at='$0', pricing_summary='무료 플랜 · Premium 연 $70', pricing_details=array['Premium은 연 $70로 표시됩니다.'], pricing_verified_at=now() where name='QuestionWell';
update public.tools set pricing_verification_status='official_exact', pricing_start_at='$0', pricing_summary='Free $0 · Premium 연간 결제 월 $8.33', pricing_details=array['공식 가격표에서 Premium은 연간 결제 기준 월 $8.33으로 표시됩니다.'], pricing_verified_at=now() where name='QuillBot';
update public.tools set pricing_verification_status='official_exact', pricing_start_at='$0', pricing_summary='무료 생성·미리듣기 · Creator 월 $19.99', pricing_details=array['공식 가격표에서 Creator는 월 $19.99로 표시됩니다.'], pricing_verified_at=now() where name='SOUNDRAW';
update public.tools set pricing_verification_status='official_exact', pricing_start_at='$0', pricing_summary='무료 플랜 · Pro 월 $19.90 정가', pricing_details=array['공식 가격표에서 Pro 정가는 월 $19.90으로 표시됩니다. 프로모션 가격은 변경될 수 있습니다.'], pricing_verified_at=now() where name='Tripo Studio';
update public.tools set pricing_verification_status='official_exact', pricing_start_at='$0', pricing_summary='무료 플랜 · Pro 연간 결제 월 $15', pricing_details=array['공식 플랜 페이지에서 Pro 연간 결제 기준 월 $15를 확인했습니다.'], pricing_verified_at=now() where name='You.com';
