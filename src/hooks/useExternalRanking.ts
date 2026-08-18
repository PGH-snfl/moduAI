/**
 * 외부 데이터 소스 연동을 위한 랭킹 데이터 수집 모듈
 * 
 * 단계별 구현:
 * Phase 1: GitHub API (무료) - 개발자 도구 인기도
 * Phase 2: Google Trends (pytrends) - 검색 트렌드
 * Phase 3: SimilarWeb API (유료) - 트래픽 데이터
 */

import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';

// GitHub API 타입 정의
interface GitHubRepoData {
  stargazers_count: number;
  forks_count: number;
  watchers_count: number;
  open_issues_count: number;
  updated_at: string;
  created_at: string;
}

// 외부 신호 데이터 타입
export interface ExternalSignals {
  tool_id: string;
  github_stars?: number;
  github_forks?: number;
  google_trends_score?: number;
  search_console_impressions?: number;
  search_console_clicks?: number;
  collected_at: string;
}

/**
 * GitHub Stars 수집 (무료 API)
 * Rate Limit: 인증 시 5,000 requests/hour
 */
export async function fetchGitHubStars(owner: string, repo: string): Promise<number | null> {
  try {
    // GitHub API는 인증 없이도 사용 가능 (rate limit 낮음)
    // 인증 시 5,000 requests/hour, 미인증 시 60 requests/hour
    const response = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        // TODO: GitHub Token 추가 시 rate limit 증가
        // 'Authorization': `token ${process.env.GITHUB_TOKEN}`
      }
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        console.warn(`GitHub repo not found: ${owner}/${repo}`);
        return null;
      }
      if (response.status === 403) {
        console.warn('GitHub API rate limit exceeded');
        return null;
      }
      throw new Error(`GitHub API error: ${response.status}`);
    }
    
    const data: GitHubRepoData = await response.json();
    return data.stargazers_count;
  } catch (error) {
    console.error('Error fetching GitHub stars:', error);
    return null;
  }
}

/**
 * 도구의 GitHub URL에서 owner/repo 추출
 */
export function parseGitHubUrl(url: string): { owner: string; repo: string } | null {
  try {
    const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
    if (match) {
      return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * 외부 신호 데이터 저장
 */
export async function saveExternalSignals(signals: ExternalSignals): Promise<void> {
  try {
    const { error } = await supabase
      .from('external_signals')
      .upsert({
        ...signals,
        collected_at: new Date().toISOString()
      }, {
        onConflict: 'tool_id'
      });
    
    if (error) {
      console.error('Error saving external signals:', error);
      throw error;
    }
  } catch (error) {
    console.error('Failed to save external signals:', error);
    throw error;
  }
}

/**
 * 도구의 외부 신호 데이터 조회
 */
export function useExternalSignals(toolId: string | undefined) {
  return useQuery({
    queryKey: ['external-signals', toolId],
    queryFn: async () => {
      if (!toolId) return null;
      
      const { data, error } = await supabase
        .from('external_signals')
        .select('*')
        .eq('tool_id', toolId)
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        throw error;
      }
      
      return data as ExternalSignals | null;
    },
    enabled: !!toolId,
    staleTime: 60 * 60 * 1000, // 1 hour cache
  });
}

/**
 * 모든 도구의 외부 신호 데이터 수집 (배치 작업용)
 * TODO: Supabase Edge Function으로 스케줄링
 */
export async function collectAllExternalSignals(): Promise<void> {
  try {
    // 1. GitHub 데이터가 있는 도구 조회
    const { data: tools, error } = await supabase
      .from('tools')
      .select('id, name, url, github_url')
      .not('github_url', 'is', null);
    
    if (error) throw error;
    
    // 2. 각 도구의 GitHub 데이터 수집
    for (const tool of tools || []) {
      if (!tool.github_url) continue;
      
      const parsed = parseGitHubUrl(tool.github_url);
      if (!parsed) continue;
      
      // Rate limit 고려하여 딜레이 추가
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const stars = await fetchGitHubStars(parsed.owner, parsed.repo);
      
      if (stars !== null) {
        await saveExternalSignals({
          tool_id: tool.id,
          github_stars: stars,
          collected_at: new Date().toISOString()
        });
        
        console.log(`✅ Updated GitHub stars for ${tool.name}: ${stars}`);
      }
    }
    
    console.log('🎉 External signals collection complete');
  } catch (error) {
    console.error('Failed to collect external signals:', error);
    throw error;
  }
}

/**
 * 통합 랭킹 점수 계산
 * 내부 데이터 + 외부 데이터 결합
 */
export function calculateComprehensiveRanking(
  internalScore: number,
  externalSignals: ExternalSignals | null
): number {
  if (!externalSignals) {
    // 외부 데이터 없으면 내부 점수만 사용
    return internalScore;
  }
  
  // GitHub Stars 정규화 (0-100)
  const githubScore = externalSignals.github_stars
    ? Math.min(100, Math.log10(externalSignals.github_stars + 1) * 20)
    : 0;
  
  // Google Trends 정규화 (이미 0-100)
  const trendsScore = externalSignals.google_trends_score || 0;
  
  // 가중 평균
  // 내부 데이터 80%, 외부 데이터 20%
  const finalScore = (
    internalScore * 0.8 +
    (githubScore * 0.15) +
    (trendsScore * 0.05)
  );
  
  return Math.round(finalScore);
}

/**
 * TODO: Phase 2 - Google Trends 수집
 * pytrends 라이브러리 사용 (Python 서버 필요)
 */
export async function fetchGoogleTrends(keywords: string[]): Promise<Record<string, number>> {
  // TODO: Python 서버 구축 후 구현
  // pytrends는 Python 라이브러리이므로 별도 서버 또는 Edge Function 필요
  console.log('Google Trends collection not yet implemented', { keywords });
  return {};
}

/**
 * TODO: Phase 3 - SimilarWeb API
 * 유료 API - 향후 도입 검토
 */
export async function fetchSimilarWebData(domain: string): Promise<unknown> {
  // TODO: SimilarWeb API 키 필요
  console.log('SimilarWeb API not yet implemented', { domain });
  return null;
}
