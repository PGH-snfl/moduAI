# Supabase 백엔드 구성 완전 가이드

## 1. Supabase 프로젝트 생성 (단계별)

### 1.1 Supabase 가입 및 로그인
1. [Supabase 공식 홈페이지](https://supabase.com) 접속
2. 우측 상단 `Sign Up` 클릭하여 회원가입
3. GitHub, Google 계정으로 빠른 가입 또는 이메일로 가입
4. 가입 후 로그인 완료

### 1.2 새 프로젝트 생성
1. 대시보드에서 `New Project` 버튼 클릭
2. 조직 선택 (기본적으로 개인 조직이 생성됨)
3. `Create a new project` 선택

### 1.3 프로젝트 기본 정보 설정
```
Project Name: [프로젝트 이름 입력]
예) danawa-ai, my-app-backend, user-management

Database Password: [강력한 비밀번호 생성]
- 최소 10자 이상
- 대문자, 소문자, 숫자, 특수문자 포함
- 반드시 안전한 곳에 저장 (복구 불가)

Region: Northeast Asia (Seoul)
- 한국 사용자를 위한 최적의 선택
- 낮은 지연시간
```

### 1.4 프로젝트 생성 완료
1. `Create project` 버튼 클릭
2. 생성 시간 약 1-2분 소요
3. 생성 완료 시 대시보드로 자동 이동

---

## 2. Database Schema 설정

### 2.1 SQL Editor 접근 방법
1. 프로젝트 대시보드 좌측 메뉴에서 `SQL Editor` 클릭
2. `New query` 버튼 클릭하여 새 쿼리 창 열기
3. 여기서 SQL 스크립트를 실행하여 테이블 생성

### 2.2 프로젝트 schema.sql 파일 적용 방법

#### 방법 1: 직접 붙여넣기
1. 프로젝트의 `schema.sql` 파일 내용 복사
2. SQL Editor에 붙여넣기
3. `Run` 버튼 클릭하여 실행

#### 방법 2: 파일 업로드 (권장)
1. SQL Editor 우측 상단 `...` 메뉴 클릭
2. `Upload file` 선택
3. `schema.sql` 파일 선택
4. 자동으로 내용이 에디터에 로드됨
5. `Run` 버튼 클릭

### 2.3 Schema 실행 확인
```
✅ Success: Table 'users' created successfully
✅ Success: Table 'products' created successfully
✅ Success: Foreign key constraint added
```

### 2.4 생성된 테이블 확인
1. 좌측 메뉴에서 `Table Editor` 클릭
2. 생성된 테이블 목록 확인
3. 각 테이블 클릭하여 구조 및 데이터 확인

---

## 3. Environment Variables 설정

### 3.1 Project URL 찾는 방법
1. 프로젝트 대시보드에서 `Settings` 클릭
2. `API` 섹션 선택
3. `Project URL` 필드에서 URL 복사
```
예) https://xxxxxxxx.supabase.co
```

### 3.2 Anon Key 찾는 방법
1. 동일한 `API` 섹션에서
2. `Project API keys` 영역
3. `anon public` 키 복사
```
예) eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.3 Service Role Key 찾는 방법
1. 동일한 `API` 섹션에서
2. `service_role` 키 복사 (🔒 비밀키)
```
예) eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 3.4 .env 파일 설정
프로젝트 루트 디렉토리에 `.env` 파일 생성:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# 주의사항:
# - NEXT_PUBLIC_ 접두사: 클라이언트에서 접근 가능
# - SERVICE_ROLE_KEY: 서버에서만 사용, 절대 공개 금지
```

### 3.5 .env.local 파일 (Next.js)
Next.js 프로젝트의 경우:
```env
# .env.local
NEXT_PUBLIC_SUPABASE_URL=your_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

---

## 4. Authentication 설정

### 4.1 Google OAuth 설정 방법

#### 4.1.1 Google Cloud Console 설정
1. [Google Cloud Console](https://console.cloud.google.com) 접속
2. 프로젝트 선택 또는 새 프로젝트 생성
3. 좌측 메뉴에서 `APIs & Services` > `Credentials` 클릭
4. `+ CREATE CREDENTIALS` > `OAuth client ID` 선택

#### 4.1.2 OAuth 클라이언트 생성
```
Application type: Web application
Name: [프로젝트 이름] - Supabase Auth
```

#### 4.1.3 승인된 리디렉션 URI 추가
```
URI 1: https://[project-ref].supabase.co/auth/v1/callback
```
- `[project-ref]`는 Supabase 프로젝트 URL에서 확인
- 예) `https://abcdefgh.supabase.co/auth/v1/callback`

#### 4.1.4 클라이언트 정보 복사
생성된 OAuth 클라이언트에서:
- `Client ID` 복사
- `Client Secret` 복사

### 4.2 Supabase에서 Google Provider 활성화
1. Supabase 대시보드 > `Authentication` 클릭
2. `Providers` 탭 선택
3. `Google` 섹션 찾기
4. `Enable` 토글 스위치 활성화

### 4.3 Google OAuth 정보 입력
```
Client ID: [복사한 Google Client ID]
Client Secret: [복사한 Google Client Secret]
```

### 4.4 추가 설정 (선택사항)
```
Redirect URLs: 
- http://localhost:3000/auth/callback (개발 환경)
- https://yourdomain.com/auth/callback (프로덕션)

Site URL: https://yourdomain.com
```

### 4.5 저장 및 테스트
1. `Save` 버튼 클릭
2. 로그인 페이지에서 Google 로그인 버튼 테스트

---

## 5. Edge Functions 배포 (선택사항)

### 5.1 Supabase CLI 설치

#### Windows (PowerShell)
```powershell
# PowerShell 관리자 권한으로 실행
Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://get.supabase.com/install.ps1'))
```

#### macOS/Linux
```bash
curl -L https://get.supabase.com/install.sh | bash
```

### 5.2 CLI 로그인
```bash
supabase login
```

### 5.3 프로젝트 연결
```bash
# 프로젝트 루트 디렉토리에서 실행
supabase init
supabase link --project-ref [project-ref]
```

### 5.4 Edge Functions 생성
```bash
# 새 함수 생성
supabase functions new my-function

# 함수 구조:
# supabase/functions/my-function/index.ts
```

### 5.5 함수 코드 예시
```typescript
// supabase/functions/my-function/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { name } = await req.json()
    const data = { message: `Hello ${name}!` }
    
    return new Response(
      JSON.stringify(data),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: corsHeaders }
    )
  }
})
```

### 5.6 함수 배포
```bash
# 단일 함수 배포
supabase functions deploy my-function

# 모든 함수 배포
supabase functions deploy
```

### 5.7 배포된 함수 테스트
```bash
# 로컬 테스트
supabase functions serve my-function

# 배포된 함수 호출
curl -X POST 'https://[project-ref].supabase.co/functions/v1/my-function' \
  -H 'Authorization: Bearer [anon-key]' \
  -H 'Content-Type: application/json' \
  -d '{"name": "World"}'
```

---

## 6. 전체 설정 확인 및 테스트

### 6.1 연결 테스트 스크립트
```javascript
// test-supabase.js
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
)

async function testConnection() {
  try {
    // 데이터베이스 연결 테스트
    const { data, error } = await supabase
      .from('users')
      .select('count')
    
    if (error) throw error
    
    console.log('✅ Database connection successful')
    
    // 인증 테스트
    const { data: authData } = await supabase.auth.getSession()
    console.log('✅ Auth service working')
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
  }
}

testConnection()
```

### 6.2 최종 확인 체크리스트
- [ ] Supabase 프로젝트 생성 완료
- [ ] Database Schema 적용 완료
- [ ] Environment Variables 설정 완료
- [ ] Google OAuth 설정 완료
- [ ] Edge Functions 배포 (필요시)
- [ ] 연결 테스트 통과
- [ ] 애플리케이션 정상 작동 확인

---

## 🚨 중요 주의사항

### 보안
- **Service Role Key**는 절대 클라이언트 코드에 노출 금지
- **.env 파일**은 .gitignore에 추가하여 커밋 방지
- **데이터베이스 비밀번호**는 안전한 곳에 보관

### 권한 관리
- **RLS (Row Level Security)** 정책 설정 권장
- **테이블 권한**을 최소한으로 설정
- **API 키** 주기적으로 교체

### 모니터링
- **Supabase 대시보드**에서 사용량 모니터링
- **로그** 확인으로 오류 조기 발견
- **백업** 정기적으로 수행

이 가이드를 따라하면 Supabase 백엔드가 완벽하게 구성됩니다! 🎉