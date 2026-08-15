# 모두의 AI - 뉴스 크롤러 배포 가이드

> **작성일**: 2026-02-04  
> **대상**: Supabase Edge Functions  
> **파일 위치**: `supabase/functions/crawl-news/index.ts`

---

## 📋 개요

이 가이드는 Supabase Edge Functions를 사용하여 자동으로 AI 뉴스를 수집하고 데이터베이스에 저장하는 방법을 설명합니다.

### 지원하는 뉴스 소스

**국내 AI 뉴스**
- AI Times (aitimes.com)
- ET News (etnews.com)  
- Bloter (bloter.net)

**글로벌 AI 뉴스**
- TechCrunch
- Wired AI
- The Verge AI

---

## 🚀 배포 방법

### 1. 사전 준비

```bash
# Supabase CLI 설치 (미설치 시)
npm install -g supabase

# Supabase 로그인
supabase login
```

### 2. 환경 변수 설정

Supabase Dashboard → Project Settings → Secrets 에 다음 환경 변수를 추가합니다:

| 변수명 | 설명 | 필수 여부 |
|--------|------|----------|
| `SUPABASE_URL` | 프로젝트 URL | ✅ 필수 |
| `SUPABASE_SERVICE_ROLE_KEY` | Service Role Key | ✅ 필수 |
| `OPENAI_API_KEY` | 뉴스 요약용 (선택) | ❌ 선택 |

**환경 변수 조회 방법:**
```bash
# Project Settings > API에서 확인
Project URL: https://<project-id>.supabase.co
Service Role Key: <your-service-role-key>
```

### 3. Edge Function 배포

```bash
# 프로젝트 루트에서 실행
supabase functions deploy crawl-news
```

### 4. 배포 확인

```bash
# 배포된 함수 목록 확인
supabase functions list

# 함수 로그 확인
supabase functions logs crawl-news --tail
```

---

## ⏰ 자동 실행 설정 (Cron Job)

### 방법 1: Supabase Cron Job (권장)

Supabase Dashboard → Database → Cron Jobs 에서 다음 SQL을 실행합니다:

```sql
-- 매일 오전 9시에 뉴스 크롤링 실행
select cron.schedule(
    'crawl-ai-news-daily',    -- 작업 이름
    '0 9 * * *',             -- 크론 표현식 (매일 9:00)
    $$ 
    select net.http_get(
        url:='https://<project-id>.supabase.co/functions/v1/crawl-news',
        headers:='{"Authorization": "Bearer <anon-key>", "Content-Type": "application/json"}'::jsonb
    ) as response
    $$
);

-- 크론 작업 목록 확인
select * from cron.job;

-- 크론 작업 삭제 (필요시)
-- select cron.unschedule('crawl-ai-news-daily');
```

### 방법 2: 외부 스케줄러 사용

Vercel Cron, GitHub Actions, 또는 AWS Lambda를 사용할 수 있습니다.

**Vercel Cron 예시 (vercel.json):**
```json
{
  "crons": [
    {
      "path": "/api/cron/news-crawler",
      "schedule": "0 9 * * *"
    }
  ]
}
```

---

## 🧪 테스트 방법

### 1. 로컬 테스트

```bash
# Supabase CLI를 사용한 로컬 실행
supabase functions serve crawl-news

# 다른 터미널에서 테스트
 curl -i --location --request POST 'http://localhost:54321/functions/v1/crawl-news' \
   --header 'Authorization: Bearer <anon-key>'
```

### 2. 배포된 함수 테스트

```bash
curl -i --location --request POST 'https://<project-id>.supabase.co/functions/v1/crawl-news' \
  --header 'Authorization: Bearer <anon-key>'
```

### 3. 예상 응답

```json
{
  "success": true,
  "message": "Crawled 12 AI news items",
  "details": {
    "totalInserted": 12,
    "totalSkipped": 5,
    "sources": 6,
    "errors": []
  },
  "timestamp": "2026-02-04T09:00:00.000Z"
}
```

---

## ⚙️ 기능 설정

### 뉴스 필터링 설정

`crawl-news/index.ts` 파일에서 `isAIRelated` 함수를 수정하여 필터링 키워드를 조정할 수 있습니다:

```typescript
function isAIRelated(title: string): boolean {
    const aiKeywords = [
        'AI', '인공지능', 'ChatGPT', 'GPT', 'LLM', '클로드',
        '미드저니', 'stable diffusion', '생성형', 'Generative',
        // 원하는 키워드 추가
    ];
    // ...
}
```

### 요약 기능 활성화

OpenAI API Key를 설정하면 뉴스 제목을 자동으로 요약합니다:

1. [OpenAI API Key 발급](https://platform.openai.com/api-keys)
2. Supabase Secrets에 `OPENAI_API_KEY` 추가
3. 배포된 함수는 자동으로 요약 기능 사용

---

## 📊 모니터링

### 로그 확인

```bash
# 실시간 로그 스트리밍
supabase functions logs crawl-news --tail

# 특정 시간대 로그
supabase functions logs crawl-news --since 2026-02-04
```

### 데이터베이스 확인

```sql
-- 수집된 뉴스 확인
select * from news order by published_date desc limit 10;

-- 소스별 통계
select source, count(*) from news 
where created_at > now() - interval '7 days'
group by source;
```

---

## 🐛 문제 해결

### 자주 발생하는 문제

**1. 401 Unauthorized 에러**
```
原因: Authorization 헤더 누락 또는 잘못된 키
해결: 올바른 anon key 사용
```

**2. 500 Internal Server Error**
```
原因: 환경 변수 설정 누락
해결: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY 확인
```

**3. RSS 피드 파싱 실패**
```
原因: RSS 피드 형식 변경 또는 접근 제한
해결: 해당 소스의 RSS URL 수동 확인
```

**4. 중복 데이터**
```
原因: URL 중복 체크 로직 확인
해결: `onConflict: 'url'` 설정 확인 (이미 설정되어 있음)
```

### 디버깅 방법

```typescript
// 로컬 테스트 시 콘솔 로그 확인
console.log('Debug info:', data);

// Edge Function에서 로그 확인
console.error('Error details:', error);
```

---

## 📝 업데이트 및 재배포

```bash
# 코드 수정 후 재배포
supabase functions deploy crawl-news

# 특정 프로젝트에 배포
supabase functions deploy crawl-news --project-ref <project-ref>
```

---

## 🎯 다음 단계

뉴스 크롤러 배포 후 완료할 작업:

1. ✅ **ReportPage.tsx**에 뉴스 섹션 추가 (`useNews` 훅 사용)
2. ✅ **HomePage.tsx**에 최신 뉴스 위젯 추가 (`useLatestNews` 훅 사용)
3. ⏳ **뉴스 디테일 페이지** 구현 (필요시)
4. ⏳ **뉴스 검색 기능** 추가 (필요시)

---

*마지막 업데이트: 2026-02-04*
