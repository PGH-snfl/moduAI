# Future Tasks

## Completed (Virtual Deployment v1)
- [x] **Home Layout**: Redesigned Landing Page with Hero CTA and Ad placeholder.
- [x] **Routing**: Split `HomePage` (Landing) and `ToolsPage` (List). implemented `/tools` route.
- [x] **Navigation**: Renamed Header links (Ranking/Report/Community) and moved Search Bar to Global Header.
- [x] **Filtering**: Implemented "Domestic AI Only" (K-AI) filter and Horizontal Category Buttons.
- [x] **Styling**: Login button (Brand Purple) and Header padding polish.

## Backlog / Future Improvements
- [x] **Real Backend Integration**: Connected Supabase (Tools & News data is now live).
    - *Note*: Traffic Charts remain simulated until historical data accumulates.
    - *Note*: 'Weekly Hot' section is currently curated (hardcoded).
- [ ] **User Authentication**: Implement Login/Signup for writing reviews.
- [ ] **Admin Dashboard**: Create interface for adding/editing tools.
- [ ] **Mobile Optimization**: Refine mobile-specific UI (e.g., bottom sheet filters).

## 🤖 오케스트레이션 및 검증 리포트 (2026-01-27)

**1. 랭킹 서브에이전트 (검증 결과: ⚠️ 부분 성공)**
- **상태**: 차트는 정상적으로 렌더링되나, 데이터의 원천이 `seed.ts`에 하드코딩된 더미 데이터(visit_count)입니다.
- **문제점**: 실제 검색량이나 트래픽 데이터(Google Trends, SimilarWeb API 등)와 연동되어 있지 않습니다.
- **해결책**:
    - [ ] Google Analytics API 또는 내부 로깅 시스템 구축 필요 (트래픽 수집용).
    - [ ] `traffic_stats` 테이블에 일별 데이터를 쌓는 크론잡(Batch Job) 개발 필요.

**2. 리포트 서브에이전트 (검증 결과: ⚠️ 정적 데이터)**
- **상태**: Daily AI News가 정상 표시되지만, 이는 DB링 시점에 넣은 고정 데이터입니다. "매주 끌어오는지"에 대한 검증 결과는 **False**입니다.
- **문제점**: 자동화된 뉴스 크롤러(Crawler)가 없습니다.
- **해결책**:
    - [ ] Supabase Edge Functions로 매일 아침 IT 뉴스를 긁어오는 서버리스 함수 배포 필요.
    - [ ] OpenAI API를 연동하여 뉴스 요약 자동화 필요.

**3. 메인 서브에이전트 (검증 결과: ✅ DB 연동 완료)**
- **상태**: 80여 개의 툴 카드가 모두 정상적으로 DB에서 로드됩니다.
- **문제점**: 이미지가 외부 링크(Unsplash/Google Favicon)에 의존하여 로딩 속도가 느리거나 깨질 위험이 있습니다.
- **해결책**:
    - [ ] CDN 도입 또는 이미지 캐싱 처리.

**4. 관리감독 서브에이전트 (종합 의견)**
- 현재 시스템은 **"구조적 백엔드(Structure)"**는 완성되었으나, **"동적 데이터 파이프라인(Live Pipeline)"**이 부재합니다.
- 우선 순위: 뉴스 크롤러 구축 -> 트래픽 로깅 시스템 -> 어드민 대시보드 순으로 개발을 권장합니다.


---

## 🔍 오케스트레이션 및 데이터 검증 리포트 (2026-01-27)

관리감독 서브에이전트에 의해 수행된 각 시스템별 데이터 연동 검증 결과 및 향후 계획입니다.

### 1. 랭킹 서브에이전트 (검증 결과: ⚠️ Mock Data)
*   **분석 (Current Status)**:
    *   현재 `useTools.ts` 훅이 `mockData.ts`의 정적 배열 데이터를 반환하고 있음.
    *   `useTrafficData.ts`는 난수 발생기(Random Math)를 통해 가짜 트래픽 차트를 생성 중.
    *   실제 검색량이나 방문자 수 기반이 아님.
*   **해결책 (Action Items)**:
    *   [ ] **DB Migration**: Supabase에 `tools` 및 `traffic_stats` 테이블 설계 및 이관.
    *   [ ] **Data Collection**: SimilarWeb API 또는 네이버 DataLab API 등을 활용한 실제 트래픽 지표 수집 파이프라인 구축.
    *   [ ] **API Integration**: 프론트엔드에서 실수치 데이터를 호출하도록 쿼리 변경 (`useQuery` -> Supabase Client).

### 2. 리포트 서브에이전트 (검증 결과: ⚠️ Mock Data)
*   **분석 (Current Status)**:
    *   `ReportPage.tsx` 내부의 차트(Sector Chart, Leaders)가 `MOCK_TOOLS` 배열을 가공해서 보여주고 있음.
    *   Daily AI News 섹션 또한 하드코딩된 뉴스 링크를 사용 중이며, 자동 업데이트되지 않음.
*   **해결책 (Action Items)**:
    *   [ ] **News Crawler**: 매주/매일 IT 관련 뉴스 RSS를 크롤링하여 DB에 적재하는 서버리스 함수(Edge Function) 구현.
    *   [ ] **Real-time Stats**: 리포트 페이지 접속 시점에 DB에서 `GROUP BY` 쿼리로 실시간 카테고리 점유율 계산.

### 3. 메인 서브에이전트 (검증 결과: ⚠️ Hardcoded)
*   **분석 (Current Status)**:
    *   `HotTrendSection`(Runway 광고) 및 `WeeklyHotSection`이 코드 내에 텍스트와 이미지 URL로 박혀있음 (Hardcoded).
    *   사이트 관리자가 내용을 변경하려면 코드를 수정하고 배포해야 함.
*   **해결책 (Action Items)**:
    *   [ ] **CMS 구축**: 관리자 페이지에서 '금주의 추천 앱', '메인 배너'를 설정할 수 있는 CMS 기능 개발.
    *   [ ] **Dynamic Fetching**: 메인 페이지 로드 시 CMS 설정값을 받아와 렌더링하도록 수정.

### 4. 관리감독 종합 의견
*   현재 프론트엔드 UI/UX 작업은 완료 단계이나, **데이터 레이어(Data Layer)**가 전무한 상태임.
*   실제 서비스 런칭을 위해서는 우선순위를 **UI 수정**에서 **백엔드/데이터 연동**으로 전환해야 함.
