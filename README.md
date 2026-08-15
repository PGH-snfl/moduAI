# 모두의 AI (Modu AI)

## 📖 프로젝트 소개
**모두의 AI**는 한국 사용자를 위해 최적화된 **생성형 AI 도구 검색 및 비교 플랫폼**입니다.
전 세계의 다양한 AI 서비스들을 카테고리별로 쉽게 탐색하고, 한국어 지원 여부와 요금 정책 등을 한눈에 비교할 수 있습니다.

### 🎯 프로젝트 목적
*   **접근성 향상**: 쏟아지는 AI 도구들 중에서 나에게 필요한 서비스를 쉽게 찾을 수 있도록 돕습니다.
*   **국내 AI 특화**: **"국내 AI만 보기"** 필터를 통해 한국 기업이 만든 우수한 서비스를 빠르게 찾습니다.
*   **직관적인 UI**: 부동산 앱과 같은 **대시보드형 레이아웃**을 채택하여 정보의 밀도를 높이고 탐색 경험을 극대화했습니다.

## 🛠️ 기술 스택
*   **Frontend**: React, TypeScript, Vite
*   **Styling**: Tailwind CSS, Shadcn/UI
*   **State Management**: TanStack Query (React Query)
*   **Database**: Supabase (현재 MVP 단계에서는 Mock Data 사용)
*   **Design**: Modern Dark Mode UI

## 🚀 실행 방법

이 프로젝트를 로컬 환경에서 실행하려면 다음 단계(Node.js 설치 필요)를 따르세요.

### 1. 저장소 클론 (Clone)
```bash
git clone https://github.com/duckychoi/moduAI.git
cd moduAI
```

### 2. 패키지 설치 (Install Dependencies)
```bash
npm install
```

### 3. 개발 서버 실행 (Run Dev Server)
```bash
npm run dev
```
터미널에 표시되는 로컬 주소(예: `http://localhost:5173`)로 접속하여 프로젝트를 확인할 수 있습니다.

## 📂 주요 기능
*   **AI 도구 검색**: 키워드 자동 매핑(예: 논문 -> #학습) 기반의 스마트 검색
*   **국내 AI 전용 필터**: 한국형 AI 서비스만 모아보기 기능
*   **가로형 카테고리**: 직관적인 버튼형 카테고리 네비게이션
*   **AI 트렌드 리포트**: 분야별 점유율, 급상승 트렌드, 최주 AI 뉴스 제공
*   **연구 및 커뮤니티**: 주요 AI 학회(NeurIPS, CVPR 등) 기술 동향 및 주간 핫이슈 모음
*   **다크 모드**: 눈이 편안한 다크 테마 기본 적용

---
© 2026 모두의 AI. All rights reserved.
