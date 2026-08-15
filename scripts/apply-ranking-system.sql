-- ============================================
-- ModuAI 랭킹 시스템 SQL 적용 가이드
-- ============================================
-- 
-- 이 파일은 Supabase Dashboard의 SQL Editor에서 실행해야 합니다.
-- 
-- 실행 순서:
-- 1. schema.sql (테이블 및 RLS 정책 생성)
-- 2. 003_ranking_system.sql (뷰 및 함수 생성)
--
-- ============================================

-- ============================================
-- 1단계: schema.sql 실행
-- ============================================
-- Supabase Dashboard → SQL Editor → New Query
-- 아래 SQL을 순서대로 실행하세요

-- 1. 기존 테이블이 있다면 마이그레이션
-- traffic_stats 테이블에 unique constraint 추가 (이미 있으면 스킵)
DO $$
BEGIN
    -- unique constraint가 없으면 추가
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'traffic_stats_tool_id_date_key'
    ) THEN
        ALTER TABLE traffic_stats 
        ADD CONSTRAINT traffic_stats_tool_id_date_key 
        UNIQUE (tool_id, date);
    END IF;
EXCEPTION
    WHEN duplicate_table THEN NULL;
    WHEN duplicate_object THEN NULL;
END $$;

-- 2. RLS 정책 추가
-- traffic_stats에 INSERT 권한 추가
DO $$
BEGIN
    -- 익명 사용자 INSERT 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Enable insert for anonymous users' 
        AND tablename = 'traffic_stats'
    ) THEN
        CREATE POLICY "Enable insert for anonymous users" 
        ON public.traffic_stats 
        FOR INSERT 
        TO anon 
        WITH CHECK (true);
    END IF;
    
    -- 익명 사용자 UPDATE 정책
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Enable update for anonymous users' 
        AND tablename = 'traffic_stats'
    ) THEN
        CREATE POLICY "Enable update for anonymous users" 
        ON public.traffic_stats 
        FOR UPDATE 
        TO anon 
        USING (true) 
        WITH CHECK (true);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 2단계: tool_categories 테이블 생성 (뷰보다 먼저!)
-- ============================================

-- tool_categories 테이블 생성 (없는 경우) - 반드시 뷰 생성 전에 실행!
CREATE TABLE IF NOT EXISTS public.tool_categories (
  tool_id uuid REFERENCES public.tools(id) ON DELETE CASCADE,
  category_id uuid REFERENCES public.categories(id) ON DELETE CASCADE,
  PRIMARY KEY (tool_id, category_id)
);

-- tool_categories RLS
ALTER TABLE public.tool_categories ENABLE ROW LEVEL SECURITY;
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE policyname = 'Enable read access for all users' 
        AND tablename = 'tool_categories'
    ) THEN
        CREATE POLICY "Enable read access for all users" 
        ON public.tool_categories 
        FOR SELECT 
        USING (true);
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ============================================
-- 3단계: 랭킹 뷰 생성
-- ============================================

-- 1. tool_rankings 뷰 생성
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
  (
    COALESCE(ts.total_visitors, 0) * 0.60 +
    COALESCE(t.visit_count, 0) * 0.25 * 0.01 +
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

-- 2. category_rankings 뷰 생성
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

-- 3. trending_tools 뷰 생성
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
  t.logo_url,
  COALESCE(rt.visitors_7d, 0) as recent_visitors,
  COALESCE(pt.visitors_prev_7d, 0) as previous_visitors,
  CASE 
    WHEN pt.visitors_prev_7d > 0 
    THEN ROUND(((rt.visitors_7d - pt.visitors_prev_7d)::numeric / pt.visitors_prev_7d * 100), 2)
    ELSE 0 
  END as growth_rate
FROM tools t
LEFT JOIN recent_traffic rt ON t.id = rt.tool_id
LEFT JOIN previous_traffic pt ON t.id = pt.tool_id
WHERE COALESCE(rt.visitors_7d, 0) > 0
ORDER BY growth_rate DESC;

-- 4. 자동 집계 트리거 함수
CREATE OR REPLACE FUNCTION update_tool_visit_count()
RETURNS TRIGGER AS $$
BEGIN
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

-- 5. 트리거 생성
DROP TRIGGER IF EXISTS trigger_update_visit_count ON traffic_stats;
CREATE TRIGGER trigger_update_visit_count
AFTER INSERT OR UPDATE ON traffic_stats
FOR EACH ROW
EXECUTE FUNCTION update_tool_visit_count();

-- 6. 랭킹 집계 함수
CREATE OR REPLACE FUNCTION aggregate_tool_rankings()
RETURNS void AS $$
BEGIN
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

-- ============================================
-- 4단계: 확인 쿼리
-- ============================================

-- 1. 테이블 목록 확인
SELECT 'Tables' as check_type, table_name as name
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('tools', 'categories', 'traffic_stats', 'tool_categories', 'news');

-- 2. 뷰 목록 확인
SELECT 'Views' as check_type, table_name as name
FROM information_schema.views 
WHERE table_schema = 'public'
AND table_name IN ('tool_rankings', 'category_rankings', 'trending_tools');

-- 3. 샘플 랭킹 확인
SELECT id, name, ranking_score, popularity_level 
FROM tool_rankings 
LIMIT 5;

-- 4. 샘플 트렌딩 확인
SELECT id, name, growth_rate 
FROM trending_tools 
LIMIT 5;

-- ============================================
-- 실행 완료!
-- ============================================
-- 모든 SQL이 정상적으로 실행되었습니다.
-- 이제 다음 명령어로 테스트하세요:
-- 
-- npx tsx scripts/test-ranking-system.ts
-- 
