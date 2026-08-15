alter table public.tools
  add column if not exists best_for text[],
  add column if not exists limitations text[],
  add column if not exists verification_sources text[],
  add column if not exists verified_at timestamptz;

update public.tools
set
  description = '로그인 없이 웹에서 서포터 AI 채팅을 이용할 수 있는 한국어 AI 포털 #AI채팅 #AI검색 #이미지생성 #도구',
  full_description = '뤼튼은 한국어 AI 채팅, 실시간 정보를 반영한 AI 검색, 이미지 생성과 다양한 도구를 제공하는 국내 AI 포털입니다. 웹에서는 로그인하지 않아도 서포터와 채팅할 수 있으며, 파일 첨부·대화 저장·도구 이용과 모바일 앱 사용에는 로그인이 필요합니다.',
  pricing_type = 'Free',
  pricing_start_at = '0원',
  pricing_summary = '기본 무료 · 웹 비로그인 서포터 채팅 무제한',
  pricing_details = array[
    '웹 비로그인 상태에서 서포터와 무제한으로 채팅할 수 있습니다.',
    '비로그인 사용자는 채팅방 1개와 복사, 답변 재생성, 검색 대화를 이용할 수 있습니다.',
    '파일 첨부, 대화 저장, 도구 이용은 로그인이 필요합니다.',
    '모바일 앱은 로그인 후 이용할 수 있습니다.',
    '연계 서비스와 일부 콘텐츠의 결제 조건은 기본 서비스와 다를 수 있습니다.'
  ],
  pricing_url = 'https://help.wrtn.ai/account_notlog',
  pricing_verified_at = now(),
  key_benefits = array[
    '웹에서 로그인 없이 서포터 AI 채팅 이용',
    '한국어 중심의 대화와 정보 탐색',
    'AI 검색, 이미지 생성과 다양한 도구 제공',
    '웹·Android·iOS에서 이용 가능'
  ],
  best_for = array[
    '가입 전에 한국어 AI 채팅을 먼저 체험하고 싶은 사용자',
    'AI 검색과 이미지 생성 등 여러 기능을 한곳에서 쓰고 싶은 사용자',
    '한국어 중심의 일상 질문과 콘텐츠 생성을 원하는 사용자'
  ],
  limitations = array[
    '비로그인 사용은 채팅방 1개로 제한됩니다.',
    '파일 첨부, 대화 저장, 도구 이용에는 로그인이 필요합니다.',
    '모바일 앱은 로그인 상태에서만 이용할 수 있습니다.',
    '일반 사용자를 위한 공개 API는 공식 자료에서 확인되지 않았습니다.',
    '중요한 답변은 별도의 출처나 전문가를 통해 다시 확인하는 것이 좋습니다.'
  ],
  has_api = false,
  verification_sources = array[
    'https://help.wrtn.ai/account_notlog',
    'https://help.wrtn.ai/',
    'https://wrtn.io/faq'
  ],
  verified_at = now(),
  is_verified = true,
  updated_at = now()
where id = 'fd6ef937-64eb-4345-afd2-b83d86fa12a1';
