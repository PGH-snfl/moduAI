insert into public.tools (
  name, description, full_description, url, logo_url,
  pricing_type, pricing_start_at, pricing_summary, pricing_details, pricing_currency, pricing_url, pricing_verified_at,
  korean_support_level, is_verified, is_domestic, has_api, api_url, ai_type,
  key_benefits, best_for, limitations, verification_sources, verified_at, updated_at
) values (
  'Claude',
  '자연스러운 글쓰기·긴 문서 분석·코딩·파일 생성을 지원하는 범용 AI #AI채팅 #문서분석 #글쓰기 #코딩',
  'Claude는 대화, 글쓰기와 편집, 긴 문서·파일 분석, 코딩, 웹 검색, 데이터 시각화와 파일 생성을 지원하는 Anthropic의 범용 AI 서비스입니다. 무료 플랜으로 시작할 수 있고 Pro·Max·Team·Enterprise 플랜과 별도의 개발자 API를 제공합니다.',
  'https://claude.ai/', 'https://claude.ai/favicon.ico',
  'Freemium', '$0', '무료 사용 가능 · Pro 월 $20 또는 연간 결제 시 월 환산 $17',
  array['Free 플랜은 웹·모바일·데스크톱 채팅, 글쓰기, 코딩, 웹 검색, 파일 생성과 확장 사고를 제공합니다.','Pro는 월간 결제 시 $20이며 연간 $200 선결제 시 월 환산 $17입니다.','Max는 월 $100부터이며 Team과 Enterprise는 좌석·사용량 기준으로 별도 과금됩니다.','Claude 구독과 Anthropic API 사용료는 별도입니다.'],
  'USD', 'https://claude.com/pricing', now(),
  'Full Support', true, false, true, 'https://platform.claude.com/docs/', 'Native',
  array['자연스러운 글쓰기·편집과 긴 문서 분석','코딩·데이터 시각화·파일 생성','웹 검색과 확장 사고','Projects·Artifacts·Connectors를 활용한 작업 구성'],
  array['보고서·기획서·콘텐츠를 자연스럽게 작성하려는 사용자','긴 문서와 여러 파일을 읽고 비교하려는 사용자','코딩과 복잡한 추론 작업을 함께 수행하려는 사용자'],
  array['무료·유료 플랜 모두 사용량 제한이 있으며 트래픽과 작업 길이에 따라 체감 한도가 달라질 수 있습니다.','중요한 사실·인용·계산 결과는 원문으로 다시 확인해야 합니다.','개인용 Free·Pro·Max 콘텐츠는 모델 학습 선택을 해제할 수 있으며 조직용 플랜은 기본적으로 학습에 사용되지 않습니다.','Claude 앱 구독과 Anthropic API 비용은 서로 포함되지 않습니다.'],
  array['https://claude.com/pricing','https://platform.claude.com/docs/en/about-claude/pricing','https://privacy.claude.com/en/articles/10023548-how-do-you-use-personal-data-in-model-training'], now(), now()
)
on conflict do nothing;
