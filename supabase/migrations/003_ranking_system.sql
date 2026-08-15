-- ============================================
-- AI 도구 랭킹 시스템 마이그레이션
-- 뷰, 함수, 트리거 생성
-- ============================================

-- 1. 실제 트래픽 데이터 기반 랭킹 뷰 생성
-- traffic_stats 테이블의 데이터를 기반으로 실제 인기도 계산

CREATE OR REPLACE VIEW tool_rankings AS
WITH traffic_summary AS (
  SELECT 
    tool_id,
    SUM(visitors) as total_visitors,
    SUM(page_views) as total_page_views,
    COUNT(DISTINCT date) as active_days,
    MAX(date) as last_activity
  FROM traffic_stats
  WHERE date >= CURRENT_DATE - INTERVAL '30 days'
  GROUP BY tool_id
),
ratings_summary AS (
  SELECT 
    id as tool_id,
    average_rating,
    review_count,
    visit_count as db_visit_count
  FROM tools
)
SELECT 
  t.id,
  t.name,
  t.description,
  t.logo_url,
  t.pricing_type,
  t.is_domestic,
  t.average_rating,
  t.review_count,
  COALESCE(ts.total_visitors, 0) as actual_visitors_30d,
  COALESCE(ts.total_page_views, 0) as actual_page_views_30d,
  COALESCE(t.visit_count, 0) as total_visit_count,
  -- 복합 랭킹 점수 계산
  -- (실제 방문자 60% + DB visit_count 25% + 평점 10% + 리뷰수 5%)
  (
    COALESCE(ts.total_visitors, 0) * 0.60 +
    COALESCE(t.visit_count, 0) * 0.25 * 0.01 + -- 가중치 조정
    COALESCE(t.average_rating, 0) * 100 * 0.10 +
    COALESCE(t.review_count, 0) * 0.05
  ) as ranking_score,
  CASE 
    WHEN ts.total_visitors > 10000 THEN 'Very High'
    WHEN ts.total_visitors > 1000 THEN 'High'
    WHEN ts.total_visitors > 100 THEN 'Medium'
    ELSE 'Low'
  END as popularity_level
FROM tools t
LEFT JOIN traffic_summary ts ON t.id = ts.tool_id
ORDER BY ranking_score DESC;

-- 2. 카테고리별 랭킹 뷰
CREATE OR REPLACE VIEW category_rankings AS
SELECT 
  c.name as category_name,
  c.slug,
  COUNT(t.id) as tool_count,
  AVG(t.average_rating) as avg_rating,
  SUM(COALESCE(t.visit_count, 0)) as total_visits
FROM categories c
LEFT JOIN tool_categories tc ON c.id = tc.category_id
LEFT JOIN tools t ON tc.tool_id = t.id
GROUP BY c.id, c.name, c.slug
ORDER BY total_visits DESC;

-- 3. 트렌딩 도구 뷰 (최근 7일간 급상승)
-- tools 테이블의 모든 컬럼 + 트래픽 성장률 데이터
-- 트래픽 데이터가 없어도 모든 도구가 나오도록 LEFT JOIN 사용
CREATE OR REPLACE VIEW trending_tools AS
WITH recent_traffic AS (
  SELECT 
    tool_id,
    SUM(visitors) as visitors_7d
  FROM traffic_stats
  WHERE date >= CURRENT_DATE - INTERVAL '7 days'
  GROUP BY tool_id
),
previous_traffic AS (
  SELECT 
    tool_id,
    SUM(visitors) as visitors_prev_7d
  FROM traffic_stats
  WHERE date >= CURRENT_DATE - INTERVAL '14 days'
    AND date < CURRENT_DATE - INTERVAL '7 days'
  GROUP BY tool_id
)
SELECT 
  t.id,
  t.name,
  t.description,
  t.full_description,
  t.url,
  t.logo_url,
  t.pricing_type,
  t.pricing_start_at,
  t.korean_support_level,
  t.is_verified,
  t.is_domestic,
  t.average_rating,
  t.review_count,
  t.visit_count,
  t.has_api,
  t.api_url,
  t.api_tutorial_key,
  t.api_tutorial_example,
  t.api_tutorial_pricing,
  t.ai_type,
  t.key_benefits,
  t.created_at,
  t.updated_at,
  COALESCE(rt.visitors_7d, 0) as recent_visitors,
  COALESCE(pt.visitors_prev_7d, 0) as previous_visitors,
  CASE 
    WHEN pt.visitors_prev_7d > 0 
    THEN ROUND(((rt.visitors_7d - pt.visitors_prev_7d)::numeric / pt.visitors_prev_7d * 100), 2)
    WHEN rt.visitors_7d > 0 AND pt.visitors_prev_7d = 0
    THEN 100.0 -- 새로 트래픽이 생긴 경우 100% 성장
    ELSE 0 
  END as growth_rate
FROM tools t
LEFT JOIN recent_traffic rt ON t.id = rt.tool_id
LEFT JOIN previous_traffic pt ON t.id = pt.tool_id
ORDER BY growth_rate DESC, t.visit_count DESC;

-- 4. 랭킹 통계 집계 함수
CREATE OR REPLACE FUNCTION aggregate_tool_rankings()
RETURNS void AS $$
BEGIN
  -- visit_count 업데이트 (traffic_stats 기준)
  UPDATE tools
  SET visit_count = COALESCE((
    SELECT SUM(visitors)
    FROM traffic_stats
    WHERE traffic_stats.tool_id = tools.id
  ), 0),
  updated_at = NOW();
  
  RAISE NOTICE 'Tool rankings aggregated successfully';
END;
$$ LANGUAGE plpgsql;

-- 5. 자동 집계를 위한 트리거 (traffic 데이터 삽입 시 자동 업데이트)
CREATE OR REPLACE FUNCTION update_tool_visit_count()
RETURNS TRIGGER AS $$
BEGIN
  -- 해당 도구의 총 방문수 업데이트
  UPDATE tools
  SET visit_count = COALESCE((
    SELECT SUM(visitors)
    FROM traffic_stats
    WHERE tool_id = NEW.tool_id
  ), 0),
  updated_at = NOW()
  WHERE id = NEW.tool_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 트리거 생성 (이미 있으면 삭제 후 재생성)
DROP TRIGGER IF EXISTS trigger_update_visit_count ON traffic_stats;
CREATE TRIGGER trigger_update_visit_count
AFTER INSERT OR UPDATE ON traffic_stats
FOR EACH ROW
EXECUTE FUNCTION update_tool_visit_count();

-- 6. tool_categories 중간 테이블 (존재하지 않으면 생성)
CREATE TABLE IF NOT EXISTS public.tool_categories (
  tool_id uuid REFERENCES public.tools(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (tool_id, category_id)
);

-- tool_categories RLS
ALTER TABLE public.tool_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Enable read access for all users" ON public.tool_categories FOR SELECT USING (true);

-- 7. 주석 추가
COMMENT ON VIEW tool_rankings IS 'AI 도구 랭킹 뷰 - 실제 트래픽 + 평점 + 리뷰 기반';
COMMENT ON VIEW trending_tools IS '최근 7일간 급상승한 AI 도구 뷰';

-- 8. 샘플 데이터 확인 쿼리
-- SELECT * FROM tool_rankings LIMIT 10;
-- SELECT * FROM trending_tools LIMIT 10;
-- SELECT * FROM category_rankings;
