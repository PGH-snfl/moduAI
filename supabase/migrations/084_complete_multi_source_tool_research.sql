-- Give the final single-source records independent product, pricing, policy, or release evidence.

with researched(name, pricing_url, pricing_start_at, pricing_summary, pricing_details, sources) as (
  values
    (
      'AI Dungeon',
      'https://help.aidungeon.com/memberships-benefits', '$0',
      '무료 플레이 · Journey 월 $14.99부터',
      array['무료 Wanderer는 4K 문맥과 기본 기능을 제공합니다.','Journey는 월 $14.99, Legend는 $29.99, Mythic은 $49.99입니다.','Ultimate는 월 $99.99이며 구독 기간에 따라 할인이 적용될 수 있습니다.'],
      array['https://aidungeon.com/','https://help.aidungeon.com/memberships-benefits','https://help.aidungeon.com/account-questions']
    ),
    (
      'Eduaide.AI',
      'https://www.eduaide.ai/pricing', '$0',
      '무료 시작 · 개인 유료 및 학교 라이선스',
      array['개인 교사는 무료로 시작할 수 있습니다.','고급 생성·내보내기 기능은 개인 유료 플랜에서 확대됩니다.','학교 도입은 데모와 별도 라이선스 상담이 필요합니다.'],
      array['https://www.eduaide.ai/','https://www.eduaide.ai/pricing','https://www.eduaide.ai/blog/a-more-planning-tools']
    ),
    (
      'Hailuo AI',
      'https://hailuoai.video/doc/payment-policy.html', '$0',
      '무료 워터마크 사용 · Standard 월 $14.99부터',
      array['무료 사용자는 순차 대기열과 워터마크가 포함된 다운로드를 이용합니다.','Standard는 월 $14.99에 1,000 크레딧, Pro는 월 $54.99에 4,500 크레딧입니다.','크레딧 추가 구매는 70크레딧당 $1이며 구독 크레딧은 이월되지 않습니다.'],
      array['https://hailuoai.video/','https://hailuoai.video/doc/payment-policy.html','https://hailuoai.video/doc/terms-of-service.html','https://hailuoai.video/doc/privacy-policy.html']
    ),
    (
      'Khroma',
      'https://www.khroma.co/', '$0', '무료 웹 도구',
      array['브라우저에서 무료로 색상 모델을 학습하고 조합을 생성합니다.','공개 유료 플랜이나 별도 API는 확인되지 않았습니다.'],
      array['https://www.khroma.co/','https://www.creativebloq.com/how-to/generate-endless-colour-palettes-with-khroma']
    ),
    (
      'Lavender',
      'https://lavender.ai/coach', '$0', '무료 월 5건 · Starter 연간 결제 시 월 $27',
      array['무료 플랜은 월 5건의 이메일 분석을 제공합니다.','Starter는 연간 결제 기준 월 $27로 안내됩니다.','팀 기능과 사용량 조건은 공식 결제 화면에서 다시 확인해야 합니다.'],
      array['https://lavender.ai/coach','https://www.producthunt.com/posts/lavender-2']
    ),
    (
      'Mem',
      'https://get.mem.ai/pricing', '$0', '무료 제한 사용 · Mem Pro 월 $12',
      array['무료 플랜은 월 25개 노트·25개 채팅·PDF 25페이지를 제공합니다.','Mem Pro는 월 $12에 노트·채팅·검색과 연결 이메일을 무제한 제공합니다.','Mem Proactive는 월 $99에 Slack 기반 Mem Agent를 포함합니다.'],
      array['https://get.mem.ai/','https://get.mem.ai/pricing','https://get.mem.ai/pages/privacy','https://get.mem.ai/pages/terms-of-service']
    ),
    (
      'Mutiny',
      'https://www.mutinyhq.com/pricing', '$0', '무료 플랜 · Business 월 $50부터',
      array['Free는 최대 5명과 좌석당 일일 5크레딧을 제공합니다.','Business는 월 $50부터이며 크레딧 용량에 따라 달라집니다.','Enterprise는 공식 가격 페이지 기준 연 $40,000부터입니다.'],
      array['https://www.mutinyhq.com/','https://www.mutinyhq.com/pricing','https://www.mutinyhq.com/terms','https://www.mutinyhq.com/dpa']
    ),
    (
      'Phind',
      null, null, '서비스 종료 · 과거 무료 및 Pro 요금제 운영',
      array['Y Combinator는 Phind를 Inactive 상태로 표시합니다.','현재 신규 사용을 위한 가격 검증 대상에서 제외합니다.'],
      array['https://www.phind.com/','https://www.ycombinator.com/companies/phind','https://news.ycombinator.com/item?id=34884338']
    ),
    (
      'QuestionWell',
      'https://app.questionwell.org/pricing', '$0', '무료 플랜 · Premium 연 $70',
      array['무료 플랜은 기본 문제 생성과 월별 내보내기 제한이 있습니다.','Premium은 연 $70이며 월 환산 $5.83로 표시됩니다.','학교·교육청 플랜은 별도 견적입니다.'],
      array['https://questionwell.org/','https://app.questionwell.org/pricing','https://questionwell.org/premium','https://questionwell.org/hubfs/Terms%20of%20Service%20Starting%20June%2010th%202024.docx.pdf?hsLang=en']
    ),
    (
      'Rosebud AI',
      'https://rosebud.ai/blog/pricing-subscription-faqs', '$0', '무료 시작 · 유료 Dev 및 Pro 플랜',
      array['무료 플랜에서 제한된 프롬프트로 시작할 수 있습니다.','Dev 또는 Pro 플랜은 게임 판매·게시를 위한 상업적 사용권을 포함합니다.','현재 정확한 결제 금액은 로그인 후 My Plan에서 확인해야 합니다.'],
      array['https://rosebud.ai/','https://rosebud.ai/blog/pricing-subscription-faqs']
    )
)
update public.tools t
set pricing_url = r.pricing_url,
    pricing_start_at = r.pricing_start_at,
    pricing_summary = r.pricing_summary,
    pricing_details = r.pricing_details,
    pricing_verified_at = case when r.pricing_url is null then null else now() end,
    verification_sources = r.sources,
    updated_at = now()
from researched r
where t.name = r.name;

select public.refresh_tool_ranking_scores();
