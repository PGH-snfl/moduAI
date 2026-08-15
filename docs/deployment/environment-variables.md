# 모두의 AI - 환경 변수 설정 가이드

> **작성일**: 2026-02-04  
> **환경**: Vite + React + Supabase  
> **우선순위**: 필수 (배포 전 반드시 설정 필요)

---

## 📋 필수 환경 변수 목록

### 프론트엔드 환경 변수 (`.env` 파일)

```bash
# Supabase 연결 설정 (필수)
VITE_SUPABASE_URL=https://<project-id>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>

# Google Analytics (선택)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

### Supabase Edge Functions 환경 변수 (Supabase Dashboard)

```bash
# 뉴스 크롤러용 (필수)
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>

# 뉴스 요약 기능 (선택) - Google AI Studio (Gemini)
GOOGLE_AI_API_KEY=your-google-ai-studio-api-key
```

---

## 🔧 설정 방법

### 1. Supabase 프로젝트 정보 확인

**Supabase Dashboard → Project Settings → API**

| 항목 | 위치 | 용도 |
|------|------|------|
| URL | Project URL | VITE_SUPABASE_URL |
| anon key | anon public | VITE_SUPABASE_ANON_KEY |
| service_role key | service_role secret | VITE_SUPABASE_SERVICE_ROLE_KEY (로컬 seed용) / SUPABASE_SERVICE_ROLE_KEY (Edge Functions용) |

⚠️ **주의**: service_role key는 **절대** 프론트엔드에 노출하지 마세요. 서버/Edge Functions에서만 사용합니다.

---

### 2. 로컬 개발 환경 설정

프로젝트 루트에 `.env` 파일 생성:

```bash
# .env
VITE_SUPABASE_URL=https://ahqqtqkjymqzodjhiymw.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIs...
VITE_SUPABASE_SERVICE_ROLE_KEY=sb_secret_XXXXXX  # For admin operations (seed scripts, migrations)
VITE_GA_MEASUREMENT_ID=G-XXXXXXXXXX
```

**중요**: 
- `.env` 파일은 **절대** Git에 커밋하지 마세요 (.gitignore에 추가되어 있음)
- 각 개발자는 자신의 `.env` 파일을 로컬에 보관합니다

---

### 3. Supabase Edge Functions 화경 변수 설정

**방법 A: Supabase Dashboard 사용**

1. Supabase Dashboard → Project Settings → Functions
2. "Add new secret" 클릭
3. 환경 변수 추가:
   - `SUPABASE_SERVICE_ROLE_KEY`: <service_role_key>
   - `OPENAI_API_KEY`: <openai_api_key> (선택)

**방법 B: CLI 사용**

```bash
# Supabase CLI로 환경 변수 설정
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=<service_role_key>
supabase secrets set OPENAI_API_KEY=<openai_api_key>

# 설정 확인
supabase secrets list
```

---

### 4. Vercel/Netlify 배포 환경 설정

**Vercel 설정:**

1. Vercel Dashboard → Project → Settings → Environment Variables
2. 다음 변수 추가:
    - `VITE_SUPABASE_URL`
    - `VITE_SUPABASE_ANON_KEY`
    - `VITE_GA_MEASUREMENT_ID`
    - `VITE_SUPABASE_SERVICE_ROLE_KEY` (로컬 스크립트 실행용 - 주의: 프론트엔드에서 사용 금지)
    - `OPENAI_API_KEY` (뉴스 요약 Edge Functions용 - 서버사이드에서만 접근)

3. Production, Preview, Development 환경 모두에 설정

**Netlify 설정:**

1. Netlify Dashboard → Site settings → Environment variables
2. 동일한 변수 추가

---

## 🔐 보안 체크리스트

### ✅ 올바른 설정

- [ ] anon key는 프론트엔드에서 사용
- [ ] service_role key는 서버/Edge Functions에서만 사용
- [ ] `.env` 파일이 .gitignore에 포함됨
- [ ] production 환경에 올바른 변수 설정

### ❌ 금지 사항

- [ ] service_role key를 프론트엔드 코드에 하드코딩하지 않음
- [ ] GitHub에 `.env` 파일을 커밋하지 않음
- [ ] 민감한 키를 로그에 출력하지 않음

---

## 🧪 환경 변수 테스트

### 프론트엔드 테스트

```typescript
// src/lib/supabaseClient.ts 테스트
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Supabase Key exists:', !!import.meta.env.VITE_SUPABASE_ANON_KEY);
```

### Edge Function 테스트

```bash
# 로컬에서 환경 변수 테스트
curl -i --location --request POST 'http://localhost:54321/functions/v1/crawl-news' \
  --header 'Authorization: Bearer <anon-key>'
```

---

## 🐛 문제 해결

### 1. "Cannot read properties of undefined"

**원인**: 환경 변수가 로드되지 않음  
**해결**: 
- `.env` 파일 확인
- 변수명이 `VITE_` 접두사로 시작하는지 확인
- 서버 재시작 (Vite는 `.env` 변경 시 자동 재시작)

### 2. "Invalid API key"

**원인**: 잘못된 Supabase key 사용  
**해결**:
- Dashboard에서 정확한 key 복사
- anon key vs service_role key 구분

### 3. "Missing Supabase credentials"

**원인**: Edge Function에 환경 변수 없음  
**해결**:
- Dashboard → Settings → Functions에서 설정 확인
- CLI로 재설정: `supabase secrets set ...`

---

## 📝 참고 자료

- [Supabase Docs - Environment Variables](https://supabase.com/docs/guides/functions/secrets)
- [Vite Env Variables](https://vitejs.dev/guide/env-and-mode.html)
- [Google Analytics Setup](https://support.google.com/analytics/answer/9304153)

---

*마지막 업데이트: 2026-02-04*
