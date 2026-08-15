insert into public.featured_promotions (
  headline,
  description,
  eyebrow,
  media_url,
  destination_url,
  button_text,
  is_sponsored,
  priority,
  is_active,
  starts_at
)
select
  '내 자료를 근거로 답하는 AI 연구 도우미, NotebookLM',
  'PDF, 웹페이지, YouTube, 오디오와 문서를 한곳에 모아 출처 인용이 포함된 답변과 요약, 오디오 개요, 마인드맵을 만들 수 있습니다. 무료 사용자는 노트북당 최대 50개 소스를 이용할 수 있습니다.',
  '추천 서비스 후보',
  null,
  'https://notebooklm.google.com/',
  'NotebookLM 사용해보기',
  false,
  10,
  false,
  timezone('utc'::text, now())
where not exists (
  select 1 from public.featured_promotions
  where destination_url = 'https://notebooklm.google.com/'
);
