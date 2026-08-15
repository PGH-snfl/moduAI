# 모두의 AI (Modu AI) 랭킹 시스템 방법론

> **버전**: 1.0  
> **작성일**: 2026-02-04  
> **목적**: AI 도구의 객관적이고 정확한 인기도/품질 측정

---

## 🎯 핵심 목표

"무수히 많이 쏟아지는 AI 툴 중에서 정말 필요한 것만, 인기있는 것만 딱 선정하여 사용자가 고르기 쉽게 제공"

---

## 📊 랭킹 알고리즘 (Weighted Multi-Factor Score)

### 총점 계산 공식

```
Total Score = 
  (Traffic Score × 35%) +
  (Engagement Score × 25%) +
  (Quality Score × 20%) +
  (Growth Score × 15%) +
  (External Signal Score × 5%)
```

---

## 1️⃣ Traffic Score (35%) - 트래픽 점수

**정의**: 실제 사용자 방문량과 참여도

**데이터 소스**:
- 내부 트래픽 통계 (`traffic_stats` 테이블)
- 일일/주간/월간 방문자 수
- 페이지뷰 수

**계산 방법**:
```typescript
// 로그 스케일로 계산하여 극단적 차이 완화
Traffic Score = min(100, log10(dailyVisitors + 1) × 20)

// 예시:
- 100 일일 방문자 → log10(101) × 20 = 40점
- 1,000 일일 방문자 → log10(1001) × 20 = 60점
- 10,000 일일 방문자 → log10(10001) × 20 = 80점
```

**게임 방지**:
- 동일 IP 반복 클릭 차단 (24시간 쿨다운)
- 비정상적인 트래픽 스파이크 감지 및 조정
- 서로 다른 도구 간 상대적 비교

---

## 2️⃣ Engagement Score (25%) - 참여도 점수

**정의**: 사용자의 적극적인 상호작용 지표

**데이터 소스**:
- 사용자 리뷰 수 (`reviews` 테이블)
- 즐겨찾기 수 (`user_favorites` 테이블)
- 평점 참여율

**계산 방법**:
```typescript
// 리뷰와 즐겨찾기의 조합
Engagement Score = min(100, 
  log10(reviewCount + 1) × 15 + 
  log10(favoriteCount + 1) × 10
)

// 예시:
- 리뷰 10개 → log10(11) × 15 = 15.6점
- 즐겨찾기 50개 → log10(51) × 10 = 17.1점
- 총 Engagement Score = 32.7점
```

**가중치**:
- 리뷰: 60% (더 높은 진입장벽 = 더 높은 가치)
- 즐겨찾기: 40%

---

## 3️⃣ Quality Score (20%) - 품질 점수

**정의**: 도구의 실제 품질과 사용자 만족도

**데이터 소스**:
- 평균 평점 (`average_rating`)
- 긍정/부정 리뷰 비율
- 검증된 도구 여부 (`is_verified`)

**계산 방법**:
```typescript
// 기본 평점 정규화
Base Quality Score = (averageRating / 5) × 100

// 검증 배지 보넄스
Verified Bonus = is_verified ? 10 : 0

// 최종 품질 점수 (최대 100)
Quality Score = min(100, Base Quality Score + Verified Bonus)
```

---

## 4️⃣ Growth Score (15%) - 성장률 점수

**정의**: 도구의 성장势과 모멘텀

**데이터 소스**:
- 주간/월간 트래픽 변화율
- 신규 리뷰 증가율
- 소셜 미디어 언급량 증가

**계산 방법**:
```typescript
// 주간 성장률 계산
weeklyGrowth = ((last7Days - previous7Days) / previous7Days) × 100

// 성장률을 0-100 스케일로 변환
// -50% ~ +50% 성장률을 0 ~ 100 점수로 매핑
Growth Score = max(0, min(100, 50 + (weeklyGrowth × 0.5)))

// 예시:
- -20% 감소 → 50 + (-20 × 0.5) = 40점
- 0% 변화없음 → 50점
- +30% 성장 → 50 + (30 × 0.5) = 65점
- +100% 급성장 → 50 + (100 × 0.5) = 100점
```

---

## 5️⃣ External Signal Score (5%) - 외부 신호 점수

**정의**: 외부 데이터 소스의 인기도 지표

**데이터 소스** (추후 통합 예정):
- Google Trends 검색 관심도
- GitHub Stars (개발자 도구의 경우)
- Reddit/Twitter 언급량
- Product Hunt Upvotes

**계산 방법**:
```typescript
External Score = min(100,
  (googleTrendsInterest × 0.5) +
  log10(githubStars + 1) × 10 +
  log10(socialMentions + 1) × 15
)
```

---

## 🔄 데이터 수집 및 갱신 주기

| 데이터 유형 | 수집 방식 | 갱신 주기 |
|------------|----------|----------|
| 내부 트래픽 | 자동 추적 (useTrafficTracking) | 실시간 |
| 리뷰/평점 | 사용자 입력 | 실시간 |
| 외부 트래픽 | API (SimilarWeb 등) | 일일 |
| 소셜 미디어 | API (Twitter/Reddit) | 주간 |
| Google Trends | API | 주간 |

---

## 🛡️ 게임 방지 및 품질 보장

### 1. 트래픽 검증
```typescript
// 동일 IP 24시간 내 중복 클릭 방지
const trackWithCooldown = async (toolId: string, userIp: string) => {
  const lastClick = await getLastClickTime(toolId, userIp);
  if (Date.now() - lastClick < 24 * 60 * 60 * 1000) {
    return; // 24시간 이내 클릭 무시
  }
  await recordClick(toolId, userIp);
};
```

### 2. 리뷰 검증
- 계정당 도구당 1개 리뷰만 허용
- 새 계정의 리뷰는 가중치 낮춤 (신뢰도 구축 기간)
- 비정상적인 리뷰 패턴 감지 (예: 5점만 연속 등록)

### 3. 급격한 변화 감지
- 1일 내 트래픽 500% 이상 증가 시 수동 검토 플래그
- 신규 도구의 초기 버스트 트래픽 정규화

---

## 📈 랭킹 카테고리

### 전체 랭킹 (Overall Rankings)
- **Top 100 AI Tools**: 전체 누적 점수 기반
- **Trending This Week**: Growth Score 중심
- **Highest Rated**: Quality Score 중심
- **Most Popular**: Traffic Score 중심

### 카테고리별 랭킹
- Text & Writing
- Image & Art
- Video & Animation
- Audio & Music
- Business & Productivity
- Code & Development

---

## 🏆 뱃지 및 인증 시스템

| 뱃지 | 기준 | 설명 |
|-----|------|------|
| 🔥 Trending | Growth Score > 80 | 급성장 중인 도구 |
| ⭐ Top Rated | Quality Score > 90 | 최고 평점 도구 |
| 💎 Verified | 관리자 검증 완료 | 신뢰할 수 있는 도구 |
| 🏅 Editor's Pick | 에디터 선정 | 추천 도구 |
| 📈 Rising Star | 30일 이내 신규 + Growth > 70 | 신규 유망 도구 |

---

## 🔧 구현 계획

### Phase 1: 기본 랭킹 (완료)
- [x] 내부 트래픽 추적
- [x] 리뷰/평점 시스템
- [x] 기본 랭킹 계산

### Phase 2: 외부 데이터 통합 (진행 중)
- [ ] SimilarWeb API 연동
- [ ] Google Trends 데이터 수집
- [ ] GitHub Stars 통합 (개발자 도구)

### Phase 3: 고급 알고리즘 (예정)
- [ ] 머신러닝 기반 이상 탐지
- [ ] 시계열 분석 (트렌드 예측)
- [ ] 사용자 세그먼트별 랭킹

---

## 📊 Benchmark 비교

| 플랫폼 | 데이터 소스 | 랭킹 방법 | 특징 |
|-------|-----------|----------|------|
| **SimilarWeb** | 브라우저 확장, ISP | 트래픽 기반 | 산업 표준 |
| **Product Hunt** | 커뮤니티 투표 | 오늘의 상품 | 커뮤니티 중심 |
| **G2** | 사용자 리뷰 | 리뷰 기반 | B2B 중심 |
| **Gartner** | 분석가 평가 | 매직 쿼드런트 | 기업 중심 |
| **Modu AI** | 내부 + 외부 | 다중 요소 | AI 특화 |

---

## 🎯 성공 지표 (KPIs)

1. **랭킹 정확도**: 사용자 만족도 설문 (목표: 4.5/5)
2. **데이터 신선도**: 평균 데이터 갱신 시간 (목표: < 24시간)
3. **게임 방지**: 부정 클릭 감지율 (목표: > 95%)
4. **도구 커버리지**: 등록된 AI 도구 수 (목표: 500+)

---

## 📝 참고 자료

- [Salesforce AI Research CRM Benchmark](https://www.salesforceairesearch.com/crm-benchmark)
- [SimilarWeb Ranking Methodology](https://www.similarweb.com/blog/insights/ranking-methodology/)
- [Gartner Magic Quadrant Methodology](https://www.gartner.com/en/research/magic-quadrant)
- [Product Hunt Ranking Algorithm](https://www.producthunt.com/faq)

---

*마지막 업데이트: 2026-02-04*  
*작성자: AI Agent (Orchestration System)*
