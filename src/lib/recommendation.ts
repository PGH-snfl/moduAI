import type { ToolWithRanking, ToolWithTags } from '@/hooks/useTools';

export type BudgetPreference = 'any' | 'free' | 'free_or_paid' | 'paid';
export type RequirementPreference = 'any' | 'preferred' | 'required';
export type RecommendationPriority = 'balanced' | 'quality' | 'easy' | 'verified';

export interface RecommendationPreferences {
  budget: BudgetPreference;
  korean: RequirementPreference;
  api: RequirementPreference;
  priority: RecommendationPriority;
}

export interface RecommendationScore {
  total: number;
  purpose: number;
  conditions: number;
  confidence: number;
  reasons: string[];
}

type ScoredTool = ToolWithRanking & ToolWithTags;

const clamp = (value: number, min = 0, max = 100) => Math.min(max, Math.max(min, value));

export function scoreRecommendation(tool: ScoredTool, relevance: number, preferences: RecommendationPreferences): RecommendationScore {
  const reasons: string[] = [];
  const purpose = relevance >= 10_000 ? 40 : Math.round(clamp(relevance / 2, 6, 40));
  if (purpose >= 28) reasons.push('검색 목적과 핵심 기능이 잘 맞아요');

  let conditions = 0;
  const hasFreeAccess = tool.pricing_type === 'Free' || tool.pricing_type === 'Freemium';
  const isPaidOnly = tool.pricing_type === 'Paid' || tool.pricing_type === 'Contact';
  if (preferences.budget === 'any') conditions += 10;
  else if (preferences.budget === 'free' && tool.pricing_type === 'Free') { conditions += 15; reasons.push('완전 무료로 사용할 수 있어요'); }
  else if (preferences.budget === 'free_or_paid' && hasFreeAccess) { conditions += 15; reasons.push('무료로 먼저 시작할 수 있어요'); }
  else if (preferences.budget === 'paid' && isPaidOnly) { conditions += 15; reasons.push('유료 전문 도구 조건에 맞아요'); }

  const koreanPoints = tool.korean_support_level === 'Full Support' ? 12 : tool.korean_support_level === 'UI only' ? 7 : 0;
  conditions += preferences.korean === 'any' ? 6 : koreanPoints;
  if (preferences.korean !== 'any' && koreanPoints > 0) reasons.push(tool.korean_support_level === 'Full Support' ? '한국어를 완전히 지원해요' : '한국어 UI를 제공해요');

  conditions += preferences.api === 'any' ? 4 : tool.has_api ? 8 : 0;
  if (preferences.api !== 'any' && tool.has_api) reasons.push('API 자동화가 가능해요');
  conditions = Math.min(35, conditions);

  const ratingScore = clamp((tool.average_rating || 0) * 20);
  const popularityScore = clamp(tool.popularity_score || 0);
  const rankingScore = clamp(tool.ranking_score || 0);
  let confidence: number;
  if (preferences.priority === 'quality') {
    confidence = Math.round((ratingScore * 0.55 + popularityScore * 0.45) * 0.25);
    if (confidence >= 16) reasons.push('사용자 평판이 좋은 편이에요');
  } else if (preferences.priority === 'verified') {
    confidence = Math.round((tool.is_verified ? 18 : 3) + (tool.verified_at ? 7 : 0));
    if (tool.is_verified) reasons.push('공식 출처로 검증된 정보예요');
  } else if (preferences.priority === 'easy') {
    confidence = (tool.tool_scope === 'general' ? 10 : 5) + (hasFreeAccess ? 8 : 2) + (tool.korean_support_level !== 'None' ? 7 : 0);
    if (confidence >= 18) reasons.push('처음 시작하기 쉬운 조건을 갖췄어요');
  } else {
    confidence = Math.round((rankingScore * 0.5 + popularityScore * 0.3 + ratingScore * 0.2) * 0.25);
  }
  confidence = clamp(confidence, 0, 25);

  return { total: clamp(purpose + conditions + confidence), purpose, conditions, confidence, reasons: reasons.slice(0, 3) };
}
