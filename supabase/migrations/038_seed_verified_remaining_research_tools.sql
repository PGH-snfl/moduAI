-- Publish the remaining independently verifiable tools from the research list.
-- The labs.google/fx portal is intentionally excluded because it is a suite,
-- not a standalone tool, and Google Flow is already registered separately.

insert into public.tools (
  name, description, full_description, url, logo_url,
  pricing_type, pricing_start_at, pricing_summary, pricing_details, pricing_currency, pricing_url, pricing_verified_at,
  korean_support_level, is_verified, is_domestic, has_api, api_url, ai_type, tool_scope,
  primary_features, secondary_features, key_benefits, best_for, limitations,
  verification_sources, verified_at, updated_at
)
select * from (values
  (
    'ImagineArt',
    '여러 모델로 이미지·영상·음성 콘텐츠를 생성하고 편집하는 AI 스튜디오 #이미지생성 #AI영상 #편집 #워크플로',
    'ImagineArt는 이미지와 영상 생성·편집, 업스케일, 음성 및 여러 제작 워크플로를 한곳에서 제공하는 AI 크리에이티브 플랫폼입니다. 무료 일일 크레딧과 유료 구독을 제공하며 기업용 생성 API도 운영합니다.',
    'https://www.imagine.art/', 'https://www.imagine.art/favicon.ico',
    'Freemium', '$0', '무료 일일 100크레딧 · Basic 월 $9부터',
    array['Free 플랜은 매일 100크레딧과 표준 모델 체험을 제공합니다.','Basic은 월 $9에 2,000크레딧을 제공하며 상위 플랜에서 고급 모델·비공개 생성·고해상도 기능이 확대됩니다.','API 크레딧과 조건은 일반 구독과 별도로 확인해야 합니다.'],
    'USD', 'https://www.imagine.art/subscription', now(),
    'None', true, false, true, 'https://www.imagine.art/gen-api', 'Native', 'specialized',
    array['이미지 생성·편집','AI 영상 생성','크리에이티브 워크플로'], array['업스케일','음성 생성','생성 API'],
    array['여러 이미지·영상 모델을 한곳에서 활용','무료 일일 크레딧 제공','기업용 이미지·영상 생성 API 제공'],
    array['이미지와 영상을 함께 제작하는 크리에이터','여러 생성 모델을 비교하려는 사용자','생성 기능을 제품에 연동하려는 팀'],
    array['모델과 설정에 따라 크레딧 소모량이 다릅니다.','무료 생성은 모델·해상도·비공개 기능이 제한됩니다.','상업 이용 전 플랜과 사용 모델의 최신 라이선스를 확인해야 합니다.'],
    array['https://docs.imagine.art/account/subscription-plans','https://www.imagine.art/gen-api','https://www.imagine.art/about'], now(), now()
  ),
  (
    'GoEnhance AI',
    '영상 스타일 변환·업스케일·이미지 생성을 제공하는 AI 제작 도구 #AI영상 #영상변환 #업스케일 #이미지생성',
    'GoEnhance AI는 영상 스타일 변환, 이미지·영상 생성, 얼굴 교체, 영상 효과와 업스케일을 제공하는 AI 크리에이티브 도구입니다. 무료 토큰으로 체험할 수 있고 구독 및 별도 종량제 API를 운영합니다.',
    'https://www.goenhance.ai/', 'https://www.goenhance.ai/favicon.ico',
    'Freemium', '$0', '가입 시 무료 토큰 · 구독과 API 토큰 별도',
    array['무료 등급은 플랫폼 기능에 사용할 수 있는 일부 토큰을 제공합니다.','유료 구독은 토큰, 생성 속도, 동시 작업과 고급 기능을 확대합니다.','API는 토큰을 구매해 사용하는 종량제 방식입니다.'],
    'USD', 'https://www.goenhance.ai/faq', now(),
    'None', true, false, true, 'https://docs.goenhance.ai/', 'Native', 'specialized',
    array['영상 스타일 변환','영상 업스케일','이미지·영상 생성'], array['얼굴 교체','영상 효과','API 연동'],
    array['영상과 이미지 제작 기능을 한 작업공간에서 이용','가입 무료 토큰으로 기능 체험','영상·이미지 처리 공식 API 제공'],
    array['짧은 영상을 다른 스타일로 변환하려는 사용자','저화질 영상을 개선하려는 사용자','영상 생성 기능을 서비스에 연동하려는 개발자'],
    array['작업별 토큰 사용량과 지원 모델이 다릅니다.','Relax Mode는 지원 기능과 특정 유료 플랜에서만 제공됩니다.','얼굴이나 타인 영상을 처리할 때 필요한 동의와 권리를 확보해야 합니다.'],
    array['https://www.goenhance.ai/faq','https://docs.goenhance.ai/','https://docs.goenhance.ai/guides/quickstart'], now(), now()
  ),
  (
    'Dashtoon Studio',
    '스토리를 일관된 캐릭터와 패널의 웹툰·만화로 만드는 AI 도구 #웹툰 #만화 #캐릭터 #스토리텔링',
    'Dashtoon Studio는 입력한 이야기에서 인물과 장면을 분석해 패널별 각본과 이미지를 만들고, 캐릭터 일관성과 편집 기능을 제공하는 AI 만화 제작 도구입니다. 공식 웹사이트에서 무료 AI 만화 생성기로 제공됩니다.',
    'https://dashtoon.com/ai-comic-generator', 'https://dashtoon.com/favicon.ico',
    'Free', '$0', '무료 AI 만화 생성기 · 추가 상품 조건은 서비스 화면 확인',
    array['공식 페이지에서 무료 AI 만화 생성기로 안내합니다.','소비자용 만화 열람 코인과 Studio 제작 기능은 서로 다른 상품입니다.','추가 제작 한도나 프로그램 조건은 로그인 후 최신 화면에서 확인해야 합니다.'],
    'USD', 'https://dashtoon.com/ai-comic-generator', now(),
    'None', true, false, false, null, 'Native', 'specialized',
    array['AI 만화 생성','패널별 스토리 구성','캐릭터 일관성'], array['스타일 선택','이미지 편집','웹툰 게시'],
    array['글로 된 이야기를 만화 패널로 변환','반복 등장인물의 외형 일관성 지원','그림 기술 없이 만화 초안 제작'],
    array['웹툰·만화 아이디어를 시각화하려는 작가','스토리를 패널별로 구성하려는 사용자','일관된 캐릭터 이미지가 필요한 창작자'],
    array['세부 생성 한도와 가격은 공개 페이지에서 명확히 확인되지 않습니다.','AI 결과의 구도와 인물 일관성은 직접 수정이 필요할 수 있습니다.','사용한 이야기·캐릭터·참조 자료의 권리를 확인해야 합니다.','공식 공개 API는 확인되지 않았습니다.'],
    array['https://dashtoon.com/ai-comic-generator','https://insiders.dashtoon.com/dashtoon-studio-august-2024-release/'], now(), now()
  ),
  (
    'Marble by World Labs',
    '텍스트·이미지·영상에서 탐색 가능한 3D 세계를 생성하는 AI 도구 #3D생성 #월드모델 #공간디자인 #게임',
    'Marble은 텍스트, 이미지, 파노라마와 영상 입력으로 탐색 가능한 3D 세계를 만들고 편집·확장하며 메시와 파노라마로 내보내는 World Labs의 공간 지능 도구입니다. 무료 플랜과 전문가용 구독, 별도 개발자 API를 제공합니다.',
    'https://marble.worldlabs.ai/', 'https://www.worldlabs.ai/favicon.ico',
    'Freemium', '$0', '무료 7,000크레딧 · Standard 월 $20부터',
    array['Free 플랜은 7,000크레딧과 최대 4개의 세계 생성을 제공합니다.','Standard $20, Pro $35, Max $95/월이며 내보내기와 상업 이용 범위가 단계별로 확대됩니다.','API 크레딧은 소비자용 추가 크레딧과 별도입니다.'],
    'USD', 'https://marble.worldlabs.ai/pricing', now(),
    'None', true, false, true, 'https://platform.worldlabs.ai/', 'Native', 'specialized',
    array['3D 세계 생성','공간 편집·확장','3D 메시 내보내기'], array['파노라마 생성','영상 입력','개발자 API'],
    array['여러 입력 형식에서 탐색 가능한 3D 공간 생성','레이아웃을 조정하는 Chisel 편집','게임·VFX·공간 제작용 결과 내보내기'],
    array['게임과 VFX용 3D 환경 초안을 만드는 사용자','이미지를 탐색 가능한 공간으로 바꾸려는 사용자','공간 생성 모델을 제품에 연동하려는 개발자'],
    array['고품질 세계와 메시 생성에는 많은 크레딧과 시간이 필요합니다.','상업 이용 권리는 Pro 이상에서 제공됩니다.','일부 고급 제작 기능은 모바일에서 지원되지 않습니다.','API와 웹 구독 크레딧은 별도입니다.'],
    array['https://docs.worldlabs.ai/','https://marble.worldlabs.ai/pricing','https://platform.worldlabs.ai/'], now(), now()
  ),
  (
    'Gambo',
    '자연어로 플레이 가능한 게임과 이미지·음악·효과음을 만드는 AI 게임 빌더 #게임제작 #코딩 #이미지생성 #음악생성',
    'Gambo는 자연어 대화를 통해 게임 로직과 에셋을 만들고 수정하며, 이미지·애니메이션·타일셋·효과음·배경음악 생성과 코드 내보내기를 제공하는 AI 게임 제작 도구입니다.',
    'https://www.gambo.ai/', 'https://www.gambo.ai/favicon.ico',
    'Freemium', '$0', '게임 1개 무료 · Pro 월 $25',
    array['Free 플랜은 게임 1개와 편집용 100크레딧을 제공합니다.','Pro는 월 $25에 2,000크레딧, 생성 에셋, 사용자 도메인과 코드 내보내기를 제공합니다.','이미지·음악·대화 등 작업 종류와 품질에 따라 크레딧이 다르게 차감됩니다.'],
    'USD', 'https://www.gambo.ai/pricing', now(),
    'None', true, false, false, null, 'Native', 'specialized',
    array['자연어 게임 제작','게임 로직 편집','게임 에셋 생성'], array['음악·효과음 생성','사용자 도메인','코드 내보내기'],
    array['개발 경험 없이 플레이 가능한 게임 제작','게임 이미지·애니메이션·음향 통합 생성','Pro 플랜에서 프로젝트 코드 내보내기'],
    array['게임 아이디어를 빠르게 프로토타이핑하려는 사용자','코딩 없이 간단한 게임을 만들려는 창작자','생성된 코드를 이어서 개발하려는 사용자'],
    array['무료 플랜은 게임 수와 편집 크레딧이 제한됩니다.','복잡한 게임은 생성 후 로직·성능·보안을 직접 검수해야 합니다.','생성 에셋의 상업 이용과 제3자 권리는 최신 약관을 확인해야 합니다.','공식 공개 API는 확인되지 않았습니다.'],
    array['https://www.gambo.ai/','https://www.gambo.ai/pricing','https://www.gambo.ai/help/credit'], now(), now()
  ),
  (
    '드롭샷 AI',
    '여러 최신 모델로 이미지·영상을 한국어로 생성하는 국내 AI 스튜디오 #AI영상 #이미지생성 #한국어 #국내AI',
    '드롭샷 AI는 Veo, Sora, Seedance, Kling 등 여러 이미지·영상 생성 모델과 한국어 프롬프트 자동완성, 아바타·제품 화보·영상 템플릿을 제공하는 국내 올인원 크리에이티브 도구입니다.',
    'https://aistudio.dropshot.io/ko', 'https://aistudio.dropshot.io/favicon.ico',
    'Freemium', '0원', '가입 시 300크레딧 무료 · Lite 연간 결제 월 9,900원부터',
    array['신규 가입자에게 생성용 300크레딧을 무료로 제공합니다.','Lite는 연간 결제 기준 월 9,900원에 월 2,000크레딧을 제공합니다.','Plus 이상은 스톡 영상 이용 범위가 포함되며 플랜별 라이선스와 동시 접속 수가 다릅니다.'],
    'KRW', 'https://aistudio.dropshot.io/ko/pricing', now(),
    'Full Support', true, true, false, null, 'Native', 'specialized',
    array['AI 이미지 생성','AI 영상 생성','한국어 프롬프트'], array['아바타·제품 화보','생성 템플릿','스톡 영상'],
    array['여러 최신 이미지·영상 모델을 하나의 구독으로 이용','한국어 프롬프트와 국내 사용자 중심 UI','플랜 범위 내 생성 결과의 상업적 이용 안내'],
    array['한국어로 이미지와 영상을 제작하려는 사용자','광고·제품 화보·숏폼을 만드는 국내 크리에이터','여러 생성 모델을 한곳에서 비교하려는 사용자'],
    array['모델마다 크레딧 소모량과 생성 가능 개수가 다릅니다.','표시된 할인가는 연간 결제와 프로모션 조건이 적용될 수 있습니다.','스톡 영상 라이선스 범위는 AI 결과물 조건과 별도로 확인해야 합니다.','공식 공개 API는 확인되지 않았습니다.'],
    array['https://aistudio.dropshot.io/ko','https://aistudio.dropshot.io/ko/pricing'], now(), now()
  ),
  (
    'Morphic',
    '캔버스에서 이미지·영상·음성을 조합해 이야기를 제작하는 AI 스튜디오 #AI영상 #이미지생성 #스토리텔링 #캔버스',
    'Morphic은 Canvas, Copilot과 Compose 작업공간에서 이미지·영상·음성을 생성하고 여러 모델과 워크플로를 조합해 스토리 콘텐츠를 제작하는 AI 스튜디오입니다. 무료 체험과 개인·팀용 유료 플랜을 제공합니다.',
    'https://morphic.com/', 'https://morphic.com/favicon.ico',
    'Freemium', '$0', '무료 체험 · Basic 월 $9부터',
    array['Free 플랜은 제한된 모델과 일회성 무료 크레딧을 제공합니다.','Basic $9, Standard $24, Pro $45, Pro Max $170/월 플랜을 안내합니다.','구독 크레딧은 매월 초기화되고 추가 크레딧 팩은 별도 유효기간이 있습니다.'],
    'USD', 'https://morphic.com/en/pricing', now(),
    'None', true, false, false, null, 'Native', 'specialized',
    array['이미지·영상 생성','스토리 캔버스','AI 제작 코파일럿'], array['음성·음악 생성','업스케일','팀 워크플로'],
    array['아이디어부터 시각적 이야기까지 한 캔버스에서 제작','여러 생성 모델과 미디어 형식 조합','팀 단위 공유 크레딧과 워크플로 지원'],
    array['스토리보드와 영상 시안을 만드는 창작자','이미지·영상·음성을 함께 구성하려는 사용자','크리에이티브 프로젝트를 협업하는 팀'],
    array['무료 크레딧은 매월 갱신되지 않을 수 있습니다.','모델·해상도·오디오에 따라 크레딧 소모량이 크게 다릅니다.','상업 이용과 워터마크 제거는 플랜별 조건을 확인해야 합니다.','공식 공개 API는 확인되지 않았습니다.'],
    array['https://morphic.com/','https://morphic.com/en/pricing','https://morphic.com/docs/pricing/plans-and-credits'], now(), now()
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
  ('https://www.imagine.art/', 'design-art'), ('https://www.imagine.art/', 'video-audio'),
  ('https://www.goenhance.ai/', 'video-audio'), ('https://www.goenhance.ai/', 'design-art'),
  ('https://dashtoon.com/ai-comic-generator', 'design-art'), ('https://dashtoon.com/ai-comic-generator', 'writing-content'),
  ('https://marble.worldlabs.ai/', 'design-art'), ('https://marble.worldlabs.ai/', 'development'),
  ('https://www.gambo.ai/', 'entertainment'), ('https://www.gambo.ai/', 'development'),
  ('https://aistudio.dropshot.io/ko', 'video-audio'), ('https://aistudio.dropshot.io/ko', 'design-art'),
  ('https://morphic.com/', 'video-audio'), ('https://morphic.com/', 'design-art')
)
insert into public.tool_categories (tool_id, category_id)
select tools.id, categories.id
from assignments
join public.tools on lower(tools.url) = lower(assignments.tool_url)
join public.categories on lower(categories.slug) = lower(assignments.category_slug)
on conflict (tool_id, category_id) do nothing;
