-- Expand the catalog with independently verified user-facing products.

insert into public.tools (
  name, description, full_description, url, logo_url,
  pricing_type, pricing_start_at, pricing_summary, pricing_details, pricing_currency, pricing_url, pricing_verified_at,
  korean_support_level, is_verified, is_domestic, has_api, api_url, ai_type, tool_scope,
  primary_features, secondary_features, key_benefits, best_for, limitations,
  verification_sources, verified_at, updated_at
)
select * from (values
  (
    'Grok',
    '실시간 웹·X 검색과 대화·코딩·이미지·영상 생성을 제공하는 범용 AI #AI채팅 #실시간검색 #이미지생성 #AI영상',
    'Grok은 실시간 웹과 X 검색, 대화, 추론, 코딩, 음성, 이미지와 영상 생성을 제공하는 xAI의 범용 AI 서비스입니다. 무료 플랜과 사용량이 확대되는 SuperGrok 플랜을 제공하며 공식 개발자 API는 별도로 과금됩니다.',
    'https://grok.com/', 'https://grok.com/favicon.ico',
    'Freemium', '$0', '기본 무료 · SuperGrok 월 $30 · API 별도 종량제',
    array['Free 플랜은 제한된 사용량으로 실시간 웹·X 검색, 음성 및 커넥터를 제공합니다.','SuperGrok은 월 $30에 고급 모델과 이미지·영상 생성 등 더 높은 사용 한도를 제공합니다.','xAI API는 소비자 구독과 별도로 모델·토큰·도구 호출량에 따라 과금됩니다.'],
    'USD', 'https://x.ai/pricing', now(),
    'UI only', true, false, true, 'https://docs.x.ai/', 'Native', 'general',
    array['AI 대화·추론','실시간 웹·X 검색','이미지·영상 생성'], array['코딩','음성 모드','커넥터·API'],
    array['웹과 X의 최신 정보를 반영한 검색','대화·코딩·이미지·영상의 통합 이용','이미지와 영상 생성을 포함한 공식 API'],
    array['실시간 이슈와 X 게시물을 조사하는 사용자','대화와 미디어 생성을 한 서비스에서 쓰려는 사용자','xAI 모델을 제품에 연동하려는 개발자'],
    array['실시간 검색 결과도 출처와 작성 시점을 직접 확인해야 합니다.','이미지·영상 생성 기능과 한도는 플랜별로 다릅니다.','실제 인물 이미지의 편집·생성에는 동의와 안전 정책 확인이 필요합니다.','소비자 구독과 API 과금은 별도입니다.'],
    array['https://x.ai/pricing','https://docs.x.ai/developers/model-capabilities/imagine','https://docs.x.ai/developers/pricing'], now(), now()
  ),
  (
    'Google Opal',
    '자연어와 시각적 워크플로로 AI 미니 앱을 만드는 노코드 도구 #노코드 #앱제작 #AI워크플로 #자동화',
    'Google Opal은 자연어로 원하는 작업을 설명하면 프롬프트, 모델과 도구를 연결한 워크플로와 공유 가능한 AI 미니 앱을 만드는 Google Labs의 실험적 노코드 제작 도구입니다.',
    'https://opal.google/', 'https://www.google.com/favicon.ico',
    'Free', '$0', 'Google 계정으로 무료 이용 · 실험 서비스',
    array['Google 계정으로 Opal 제작 화면과 공개 갤러리를 이용할 수 있습니다.','작성한 앱은 Google Drive에 파일로 저장되며 별도 서버 없이 공유할 수 있습니다.','실험 서비스이므로 기능·가용 지역·한도가 예고 없이 변경될 수 있습니다.'],
    'USD', 'https://opal.google/', now(),
    'UI only', true, false, false, null, 'Native', 'specialized',
    array['자연어 미니 앱 제작','시각적 워크플로 편집','앱 공유·배포'], array['에이전트 작업','Google 도구 연결','갤러리 리믹스'],
    array['코드 없이 다단계 AI 워크플로 제작','생성된 흐름을 노드 단위로 수정','별도 호스팅 없이 미니 앱 공유'],
    array['반복 업무용 AI 도구를 직접 만들려는 사용자','AI 앱 아이디어를 빠르게 검증하려는 사용자','프롬프트와 도구 호출 흐름을 시각적으로 편집하려는 사용자'],
    array['Google Labs의 실험 서비스로 운영 안정성과 기능 지속이 보장되지 않습니다.','Google 로그인과 추가 접근 권한 동의가 필요할 수 있습니다.','생성된 워크플로의 결과와 외부 작업은 사용자가 직접 검증해야 합니다.','독립적인 공개 API 상품은 확인되지 않았습니다.'],
    array['https://opal.google/','https://developers.google.com/opal','https://developers.google.com/opal/overview'], now(), now()
  ),
  (
    'LumiYing',
    '여러 최신 모델로 텍스트·이미지·오디오 기반 영상과 이미지를 생성하는 도구 #AI영상 #이미지생성 #멀티모달 #크리에이티브',
    'LumiYing은 Seedance, Kling, Midjourney, GPT Image와 Nano Banana 등 여러 모델을 한 작업공간에서 사용해 텍스트·이미지·오디오·참조 영상으로 이미지와 영상을 제작하는 AI 생성 플랫폼입니다.',
    'https://lumiying.com/', 'https://lumiying.com/favicon.ico',
    'Paid', '$19.90', 'Starter $19.90/1,000크레딧 · 일회성 구매·미사용 크레딧 무기한',
    array['Starter는 $19.90에 1,000크레딧을 제공하는 일회성 구매 상품입니다.','Pro는 $39.90에 2,250크레딧, Max는 $69.90에 4,500크레딧을 제공합니다.','크레딧은 만료되지 않으며 모델·해상도·길이·음성 여부에 따라 차감량이 다릅니다.'],
    'USD', 'https://lumiying.com/pricing', now(),
    'None', true, false, false, null, 'Native', 'specialized',
    array['AI 영상 생성','AI 이미지 생성','참조 기반 멀티모달 생성'], array['네이티브 오디오','영상 편집','다중 모델 비교'],
    array['여러 최신 이미지·영상 모델을 동일 크레딧으로 이용','구독 없이 필요한 만큼 크레딧 구매','구매 크레딧의 만료 기간 없음'],
    array['여러 영상 모델을 비교해 제작하려는 사용자','참조 이미지·영상·오디오를 활용하는 크리에이터','월 구독 없이 생성량만큼 결제하려는 사용자'],
    array['구매한 크레딧은 원칙적으로 환불되지 않습니다.','모델과 출력 설정에 따라 같은 길이의 영상도 비용 차이가 큽니다.','제3자 모델별 상업 이용과 콘텐츠 정책을 함께 확인해야 합니다.','LumiYing 자체의 공식 공개 API는 확인되지 않았습니다.'],
    array['https://lumiying.com/','https://lumiying.com/pricing','https://lumiying.com/tos'], now(), now()
  )
) as seed(
  name, description, full_description, url, logo_url,
  pricing_type, pricing_start_at, pricing_summary, pricing_details, pricing_currency, pricing_url, pricing_verified_at,
  korean_support_level, is_verified, is_domestic, has_api, api_url, ai_type, tool_scope,
  primary_features, secondary_features, key_benefits, best_for, limitations,
  verification_sources, verified_at, updated_at
)
where not exists (select 1 from public.tools where lower(tools.url) = lower(seed.url));

with assignments(tool_url, category_slug) as (values
  ('https://grok.com/', 'productivity'), ('https://grok.com/', 'search-data'),
  ('https://grok.com/', 'design-art'),
  ('https://opal.google/', 'development'), ('https://opal.google/', 'productivity'),
  ('https://lumiying.com/', 'video-audio'), ('https://lumiying.com/', 'design-art')
)
insert into public.tool_categories (tool_id, category_id)
select tools.id, categories.id
from assignments
join public.tools on lower(tools.url) = lower(assignments.tool_url)
join public.categories on lower(categories.slug) = lower(assignments.category_slug)
on conflict (tool_id, category_id) do nothing;
