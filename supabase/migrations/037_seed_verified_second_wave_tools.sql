-- Publish the first verified batch from the second-wave research list.
-- Each row is keyed by its canonical URL so this migration can be rerun safely.

insert into public.tools (
  name, description, full_description, url, logo_url,
  pricing_type, pricing_start_at, pricing_summary, pricing_details, pricing_currency, pricing_url, pricing_verified_at,
  korean_support_level, is_verified, is_domestic, has_api, api_url, ai_type, tool_scope,
  primary_features, secondary_features, key_benefits, best_for, limitations,
  verification_sources, verified_at, updated_at
)
select * from (values
  (
    'Kimi AI',
    '긴 문맥의 대화·리서치·코딩과 파일 분석을 지원하는 범용 AI #AI채팅 #리서치 #코딩 #파일분석',
    'Kimi AI는 대화, 웹 리서치, 긴 문서와 파일 분석, 코딩 및 에이전트 작업을 제공하는 Moonshot AI의 범용 AI 서비스입니다. 무료 모델 이용과 사용량·에이전트 기능이 확대되는 멤버십, 별도 종량제 API를 운영합니다.',
    'https://www.kimi.com/', 'https://www.kimi.com/favicon.ico',
    'Freemium', '$0', '기본 모델 무료 · 멤버십 월 $19부터 · API 별도 종량제',
    array['K2.6 기반 기본 채팅은 무료로 안내됩니다.','멤버십은 월 $19·$39·$99·$199 등 사용량별 단계로 제공됩니다.','Kimi API는 소비자 멤버십과 별도이며 입력·출력 토큰 및 일부 도구 호출량에 따라 과금됩니다.'],
    'USD', 'https://www.kimi.com/help/membership/membership-pricing', now(),
    'None', true, false, true, 'https://platform.kimi.ai/docs/', 'Native', 'general',
    array['AI 대화','웹 리서치','긴 문서 분석','코딩·에이전트'], array['이미지·영상 이해','파일 처리','API 연동'],
    array['긴 문맥과 파일을 활용한 질의응답','리서치와 코딩을 포함한 에이전트 작업','OpenAI 형식과 호환되는 공식 API'],
    array['긴 자료를 분석하고 요약하려는 사용자','웹 조사와 코딩을 함께 처리하려는 사용자','Kimi 모델을 제품에 연동하려는 개발자'],
    array['한국어 입력·출력 품질은 작업별로 직접 확인해야 합니다.','멤버십과 개발자 API 요금은 별도입니다.','웹 검색을 포함한 결과는 원문 출처를 다시 확인해야 합니다.'],
    array['https://www.kimi.com/help/membership/membership-pricing','https://www.kimi.com/help/kimi-api/api-overview','https://www.kimi.com/help/kimi-api/api-pricing'], now(), now()
  ),
  (
    'MiniMax Agent',
    '리서치·웹앱·슬라이드·멀티미디어 제작을 수행하는 범용 AI 에이전트 #AI에이전트 #리서치 #앱제작 #슬라이드',
    'MiniMax Agent는 복합 요청을 계획하고 웹 리서치, 문서와 슬라이드, 풀스택 웹앱, 이미지·음성·영상 등 결과물을 만드는 MiniMax의 범용 AI 에이전트입니다. 가입 시 무료 크레딧과 유료 구독을 제공하며 MiniMax 개발자 API는 별도로 운영됩니다.',
    'https://agent.minimax.io/', 'https://agent.minimax.io/favicon.ico',
    'Freemium', '$0', '가입 시 무료 체험 크레딧 · 유료 구독 및 추가 크레딧',
    array['신규 가입자는 Agent 작업을 체험할 수 있는 무료 크레딧을 받습니다.','유료 사용자는 월간 또는 연간 구독과 추가 크레딧을 이용할 수 있습니다.','MiniMax 개발자 API와 Token Plan은 Agent 소비자 구독과 구분해 확인해야 합니다.'],
    'USD', 'https://agent.minimax.io/pricing', now(),
    'None', true, false, true, 'https://platform.minimax.io/docs/api-reference/api-overview', 'Native', 'general',
    array['복합 작업 에이전트','웹 리서치','웹앱 제작','슬라이드 생성'], array['이미지·영상·음성 제작','MCP 연동','코딩'],
    array['요청을 단계별로 수행하는 범용 에이전트','리서치부터 문서·앱 결과물까지 연결','텍스트·이미지·음성·영상 공식 API 제공'],
    array['조사 결과를 문서나 슬라이드로 만들려는 사용자','간단한 웹앱을 자연어로 제작하려는 사용자','여러 생성 모델을 API로 연동하려는 개발자'],
    array['무료 크레딧의 양과 유효기간은 계정·프로모션에 따라 달라질 수 있습니다.','Agent 구독과 개발자 API 상품은 과금 구조가 다릅니다.','생성된 앱과 조사 결과는 배포 전에 기능·보안·사실을 검토해야 합니다.'],
    array['https://agent.minimax.io/docs/user-guide','https://agent.minimax.io/doc/en/credit-rules.html','https://platform.minimax.io/docs/api-reference/api-overview'], now(), now()
  ),
  (
    'PopAi',
    '문서 기반 질의응답과 발표자료 생성에 특화된 AI 작업공간 #PDF #문서분석 #프레젠테이션 #요약',
    'PopAi는 PDF·Word·PPTX·웹페이지를 읽고 질문에 답하거나 요약하며, 자료와 프롬프트를 바탕으로 편집 가능한 발표자료를 만드는 AI 생산성 도구입니다. 무료 사용 범위와 기능·업로드 한도가 확대되는 유료 플랜을 제공합니다.',
    'https://www.popai.pro/', 'https://www.popai.pro/favicon.ico',
    'Freemium', '$0', '기본 무료 · 문서·발표자료 고급 기능은 유료 플랜에서 확대',
    array['무료 버전에서 기본 질의응답과 제한된 파일 업로드를 제공합니다.','유료 플랜은 문서 업로드, 고급 모델, 내보내기와 발표자료 생성 범위를 확대합니다.','가격과 제공량은 결제 국가 및 최신 가격 화면에서 다시 확인해야 합니다.'],
    'USD', 'https://www.popai.pro/', now(),
    'Full Support', true, false, false, null, 'Native', 'specialized',
    array['문서 질의응답','문서 요약','AI 발표자료 생성'], array['마인드맵','웹 검색','파일 내보내기'],
    array['PDF·문서 내용을 바탕으로 한 질의응답','자료에서 편집 가능한 발표자료 생성','한국어를 포함한 다국어 처리'],
    array['PDF와 논문을 빠르게 파악하려는 사용자','문서에서 발표자료 초안을 만들려는 사용자','여러 자료를 요약·정리하려는 사용자'],
    array['무료 플랜에는 질문·파일 업로드·고급 기능 제한이 있습니다.','문서 기반 답변도 원문과 인용 위치를 직접 확인해야 합니다.','일반 사용자를 위한 공식 공개 API는 확인되지 않았습니다.'],
    array['https://www.popai.pro/','https://gblog.popai.pro/faq/'], now(), now()
  ),
  (
    'Google Flow',
    'Veo·Gemini·Nano Banana로 영상과 이미지를 기획·생성·편집하는 AI 스튜디오 #AI영상 #이미지생성 #영상편집 #스토리보드',
    'Google Flow는 Google의 생성 모델을 이용해 아이디어 기획, 이미지와 영상 생성·편집, 장면 구성, 캐릭터 및 참조 요소의 일관성 관리를 지원하는 AI 크리에이티브 스튜디오입니다. 무료 일일 크레딧과 Google AI 구독별 확장 한도를 제공합니다.',
    'https://labs.google/fx/tools/flow', 'https://www.google.com/favicon.ico',
    'Freemium', '$0', '무료 일일 크레딧 · Google AI Plus 월 $4.99부터',
    array['Google 계정 사용자는 무료 일일 Flow 크레딧으로 시작할 수 있습니다.','Google AI Plus·Pro·Ultra에 따라 월간 크레딧, 생성 한도와 업스케일 기능이 확대됩니다.','표시 가격과 기능은 국가·플랫폼·구독 등급에 따라 달라질 수 있습니다.'],
    'USD', 'https://labs.google/fx/tools/flow', now(),
    'UI only', true, false, false, null, 'Native', 'specialized',
    array['AI 영상 생성','이미지 생성·편집','장면 구성','참조 일관성'], array['기획 에이전트','업스케일','캐릭터·아바타'],
    array['Veo 기반 영상과 네이티브 오디오 생성','이미지·영상 제작 과정을 한 프로젝트에서 관리','프레임·재료·장면 단위의 제작 제어'],
    array['스토리 영상과 콘셉트 영상을 만드는 사용자','일관된 캐릭터와 장면이 필요한 크리에이터','이미지 시안을 영상으로 발전시키려는 사용자'],
    array['만 18세 이상과 Google 계정이 필요합니다.','기능과 모델은 지역·플랜·플랫폼에 따라 다를 수 있습니다.','생성 비용은 모델·길이·해상도별 크레딧 사용량에 따라 달라집니다.','Flow 전용 일반 공개 API는 확인되지 않았습니다.'],
    array['https://labs.google/fx/tools/flow','https://labs.google/fx/tools/flow/faq'], now(), now()
  )
) as seed(
  name, description, full_description, url, logo_url,
  pricing_type, pricing_start_at, pricing_summary, pricing_details, pricing_currency, pricing_url, pricing_verified_at,
  korean_support_level, is_verified, is_domestic, has_api, api_url, ai_type, tool_scope,
  primary_features, secondary_features, key_benefits, best_for, limitations,
  verification_sources, verified_at, updated_at
)
where not exists (select 1 from public.tools where lower(tools.url) = lower(seed.url));

-- Attach stable discovery categories. Hashtag tags are normalized by the
-- existing tools_sync_description_tags trigger.
with assignments(tool_url, category_slug) as (values
  ('https://www.kimi.com/', 'productivity'),
  ('https://www.kimi.com/', 'search-data'),
  ('https://www.kimi.com/', 'development'),
  ('https://agent.minimax.io/', 'productivity'),
  ('https://agent.minimax.io/', 'development'),
  ('https://www.popai.pro/', 'productivity'),
  ('https://www.popai.pro/', 'education'),
  ('https://labs.google/fx/tools/flow', 'video-audio'),
  ('https://labs.google/fx/tools/flow', 'design-art')
)
insert into public.tool_categories (tool_id, category_id)
select tools.id, categories.id
from assignments
join public.tools on lower(tools.url) = lower(assignments.tool_url)
join public.categories on lower(categories.slug) = lower(assignments.category_slug)
on conflict (tool_id, category_id) do nothing;
