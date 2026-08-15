# 외부 데이터 소스 연동 전략

> **작성일**: 2026-02-04  
> **목적**: AI 도구 랭킹을 위한 외부 데이터 수집

---

## 🎯 권장 통합 우선순위

### Phase 1: 무료 데이터 소스 (즉시 구현 가능)

#### 1. GitHub API ⭐ (완전 무료)
- **Rate Limit**: 인증 시 5,000 requests/hour
- **데이터**: Stars, Forks, Contributors, Traffic
- **적용 대상**: 개발자 도구, 오픈소스 AI 도구
- **코스트**: $0

```typescript
// GitHub Stars 수집 예시
const getGitHubStars = async (owner: string, repo: string) => {
  const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
  const data = await response.json();
  return data.stargazers_count;
};
```

#### 2. Google Trends (pytrends) 📈 (무료)
- **Rate Limit**: ~1,400 requests 후 60초 대기
- **데이터**: 상대적 검색 관심도 (0-100)
- **적용 대상**: 모든 AI 도구의 검색 트렌드
- **코스트**: $0

```python
# Python 서버에서 실행
from pytrends.request import TrendReq
pytrends = TrendReq(hl='ko-KR', tz=540)
pytrends.build_payload(['ChatGPT', 'Midjourney'], timeframe='today 3-m')
interest = pytrends.interest_over_time()
```

#### 3. Google Search Console API 🔍 (무료)
- **Rate Limit**: 1,200 QPM / 30M QPD
- **데이터**: 검색 노출, 클릭, 순위
- **요구사항**: 사이트 소유권 인증 필요
- **코스트**: $0

---

### Phase 2: 프리미엄 데이터 소스 (추후 통합)

#### 4. SimilarWeb API 💎 (유료)
- **Rate Limit**: 10 requests/sec
- **데이터**: 트래픽 추정, 유입 채널, 지리 분포
- **정확도**: 업계 최고 수준
- **가격**: 영업팀 문의 필요

#### 5. SEMrush API 📊 (유료)
- **데이터**: SEO 순위, AI 검색 트래픽, 백링크
- **커버리지**: 140+ 국가
- **특징**: AI 검색 데이터 제공

#### 6. Ahrefs API v3 🔗 (유료)
- **데이터**: 백링크, 도메인 레이팅
- **상태**: API v2는 2025년 11월 deprecated

---

## ⚠️ 중요 알림

### **Alexa Rank API**: **2022년 5월 단종됨**
- 더 이상 사용 불가
- 대안: SimilarWeb API 사용

### **Google Trends 공식 API 없음**
- pytrends는 비공식 스크래핑 라이브러리
- 사용 시 차단 위험 있음 (적절한 딜레이 필수)

---

## 🏗️ 권장 아키텍처

```
┌─────────────────────────────────────────────────────────┐
│                   데이터 수집 서버                        │
│  (Supabase Edge Functions / Vercel Cron)               │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │ GitHub API  │  │  pytrends   │  │ Search Console│  │
│  │  (무료)     │  │  (무료)     │  │   (무료)      │  │
│  └─────────────┘  └─────────────┘  └──────────────┘  │
│           │              │                │            │
│           ▼              ▼                ▼            │
│  ┌─────────────────────────────────────────────────┐   │
│  │              데이터 정규화 및 가공               │   │
│  │    - 로그 스케일 변환                           │   │
│  │    - 이상치 제거                               │   │
│  │    - 가중치 적용                               │   │
│  └─────────────────────────────────────────────────┘   │
│           │                                            │
│           ▼                                            │
│  ┌─────────────────────────────────────────────────┐   │
│  │              Supabase DB 저장                   │   │
│  │    - external_signals 테이블                   │   │
│  │    - ranking_scores 테이블                      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 📊 데이터 정규화 공식

### GitHub Stars 정규화 (0-100)
```typescript
const normalizeGitHubStars = (stars: number): number => {
  // 로그 스케일로 계산
  // 0 stars → 0점
  // 100 stars → 40점
  // 1,000 stars → 60점
  // 10,000 stars → 80점
  // 100,000+ stars → 100점
  return Math.min(100, Math.log10(stars + 1) * 20);
};
```

### Google Trends 정규화 (이미 0-100)
```typescript
// Google Trends는 이미 0-100 스케일 제공
// 단, 상대적 값이므로 비교군 선정 중요
const normalizeTrends = (trendValue: number): number => {
  return trendValue; // 이미 0-100
};
```

---

## 🔄 수집 주기

| 데이터 소스 | 수집 주기 | 우선순위 |
|-----------|----------|---------|
| GitHub Stars | 일일 | High |
| Google Trends | 주간 | Medium |
| Search Console | 일일 | High |
| 내부 트래픽 | 실시간 | High |
| SimilarWeb (추후) | 주간 | Low |

---

## 💰 비용 예산

### Phase 1 (무료)
- GitHub API: $0
- pytrends: $0
- Search Console: $0
- **총 비용: $0/월**

### Phase 2 (유료)
- SimilarWeb API: ~$500/월 (추정)
- SEMrush API: ~$200/월 (추정)
- **총 비용: ~$700/월**

---

## 🚀 구현 체크리스트

### 즉시 구현 (Week 1-2)
- [ ] GitHub API 연동 함수 작성
- [ ] pytrends 서버 설정
- [ ] Search Console API 연동
- [ ] 데이터 정규화 로직 구현
- [ ] Supabase 테이블 생성

### 중기 구현 (Month 2-3)
- [ ] SimilarWeb API 검토 및 도입
- [ ] SEMrush API 검토 및 도입
- [ ] 데이터 품질 모니터링 대시보드

---

*참고: 모든 API는 공식 문서 기준 2026년 2월 현재 기준*
