import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';
import { scoreRecommendation, type RecommendationPreferences, type RecommendationScore } from '@/lib/recommendation';

// Export the Tool type from Database
export type Tool = Database['public']['Tables']['tools']['Row'] & {
    ranking_score: number;
    trending_score: number;
    popularity_score: number;
    task_ranking_score: number;
    rank_updated_at: string | null;
};

export type ToolTagRelation = {
    is_primary: boolean;
    position: number;
    tags: { id: string; name: string; slug: string } | null;
};

export type ToolCategoryRelation = {
    categories: { id: string; name: string; slug: string };
};

export type ToolWithTags = Tool & {
    tool_tags?: ToolTagRelation[];
    tool_categories?: ToolCategoryRelation[];
};

// Tool with ranking info from tool_rankings view
export interface ToolWithRanking extends Tool {
    actual_visitors_30d?: number;
    actual_page_views_30d?: number;
    popularity_level?: string;
    growth_rate?: number;
    recommendation?: RecommendationScore;
}

export interface ToolFilter {
    category: string | null;
    pricing: Array<'Free' | 'Freemium' | 'Paid' | 'Contact'>;
    korean: boolean;
    search?: string;
    sort: 'recognition' | 'trending' | 'popular' | 'updated' | 'latest';
    koreanSupport?: boolean;
    apiRequired?: boolean;
    recommendation?: RecommendationPreferences | null;
}

export interface RankingDataStatus {
    trending_ready: boolean;
    reputation_ready: boolean;
    visits_14d: number;
    previous_visits_7d: number;
    active_tools_14d: number;
    review_count: number;
    reviewed_tools: number;
}

const PAGE_SIZE = 12;

// Keyword mapping for smart search
const keywordMap: Record<string, string[]> = {
    '논문': ['#학습', '#교육', '#요약', '#글쓰기', '논문', 'paper', 'research'],
    '요약': ['#요약', '#글쓰기', '#생산성', '요약', 'summary'],
    '번역': ['#글쓰기', '#비지니스', '번역', 'translate', 'translation'],
    '코딩': ['#개발', '#프로그래밍', '코딩', 'coding', 'programming'],
    '그림': ['#디자인', '#아트', '#이미지', '그림', 'image', 'art', '그래픽'],
    '영상': ['#비디오', '#편집', '영상', 'video', 'movie'],
    'ppt': ['#파워포인트', '#프레젠테이션', '#생산성', 'ppt', 'presentation', 'slide'],
    '발표': ['#파워포인트', '#프레젠테이션', '#생산성', '발표', 'presentation'],
    '글쓰기': ['#글쓰기', '#컨텐츠', '글쓰기', 'writing', 'write'],
    '챗봇': ['#챗봇', '#대화', 'chatbot', 'chat', 'gpt', 'claude'],
};

function includesTerm(value: string | null | undefined, term: string) {
    return Boolean(value?.toLowerCase().includes(term));
}

function searchRelevance(tool: ToolWithRanking & ToolWithTags, query: string, terms: string[]) {
    const q = query.toLowerCase().trim();
    const exactName = tool.name.toLowerCase().trim() === q;
    if (exactName) return 10_000;

    let score = includesTerm(tool.name, q) ? 100 : 0;
    const primaryFeatures = tool.primary_features ?? [];
    const secondaryFeatures = tool.secondary_features ?? [];
    const primaryTags = tool.tool_tags?.filter(tag => tag.is_primary).map(tag => tag.tags?.name ?? '') ?? [];
    const secondaryTags = tool.tool_tags?.filter(tag => !tag.is_primary).map(tag => tag.tags?.name ?? '') ?? [];

    for (const term of new Set(terms.map(value => value.toLowerCase()))) {
        if (primaryFeatures.some(feature => includesTerm(feature, term)) || primaryTags.some(tag => includesTerm(tag, term))) score += 80;
        if (secondaryTags.some(tag => includesTerm(tag, term))) score += 50;
        if (secondaryFeatures.some(feature => includesTerm(feature, term))) score += 25;
        if (includesTerm(tool.description, term) || includesTerm(tool.full_description, term)) score += 10;
    }

    return tool.tool_scope === 'general' ? score * 0.65 : score;
}

function compareBySelectedSort(a: Tool, b: Tool, sort: ToolFilter['sort']) {
    if (sort === 'popular') return b.popularity_score - a.popularity_score;
    if (sort === 'trending') return b.trending_score - a.trending_score;
    if (sort === 'updated') return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    if (sort === 'latest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return b.visit_count - a.visit_count;
}

// Server-side filtering implementation
export function useTools(filters: ToolFilter) {
    return useInfiniteQuery({
        queryKey: ['tools', filters],
        queryFn: async ({ pageParam = 0 }) => {
            const sortType = filters.sort || 'recognition';
            
            // The tools table is the single source of truth. No demo data or
            // optional ranking views are used by the production UI.
            const categoryRelation = filters.category
                ? 'tool_categories!inner(categories!inner(id, name, slug))'
                : 'tool_categories(categories(id, name, slug))';
            let query = supabase
                .from('tools')
                .select(`*, tool_tags(is_primary, position, tags(id, name, slug)), ${categoryRelation}`, { count: 'exact' });

            let searchTerms: string[] = [];
            // Search results are ranked after retrieval so feature importance
            // and the general-AI weight can be applied consistently.
            if (filters.search) {
                const q = filters.search.toLowerCase().trim();
                
                // Get mapped keywords
                searchTerms = [q];
                Object.keys(keywordMap).forEach(key => {
                    if (q.includes(key)) {
                        searchTerms.push(...keywordMap[key]);
                    }
                });
                
            }

            // 2. Category filter
            if (filters.category) query = query.eq('tool_categories.categories.slug', filters.category);

            // 3. Pricing filter
            if (filters.pricing.length > 0) {
                query = query.in('pricing_type', filters.pricing);
            }

            // 4. Domestic AI filter
            if (filters.korean) {
                query = query.eq('is_domestic', true);
            }

            if (filters.koreanSupport) query = query.neq('korean_support_level', 'None');
            if (filters.apiRequired) query = query.eq('has_api', true);

            // 5. Sorting (server-side when no relevance ranking is needed)
            if (!filters.search) switch (sortType) {
                case 'recognition':
                    query = query
                        .order(filters.category ? 'task_ranking_score' : 'ranking_score', { ascending: false })
                        .order('visit_count', { ascending: false })
                        .order('name', { ascending: true });
                    break;
                case 'trending':
                    query = query
                        .order('trending_score', { ascending: false })
                        .order('ranking_score', { ascending: false })
                        .order('name', { ascending: true });
                    break;
                case 'popular':
                    query = query
                        .order('popularity_score', { ascending: false })
                        .order('ranking_score', { ascending: false })
                        .order('name', { ascending: true });
                    break;
                case 'updated':
                    query = query.order('updated_at', { ascending: false });
                    break;
                case 'latest':
                    query = query.order('created_at', { ascending: false });
                    break;
            }

            // 6. Pagination
            const from = pageParam * PAGE_SIZE;
            const to = from + PAGE_SIZE - 1;
            
            query = filters.search ? query.limit(500) : query.range(from, to);

            const { data: dbData, error, count } = await query;

            if (error) {
                console.error('Error fetching tools:', error);
                throw error;
            }

            let data = (dbData || []) as unknown as Array<ToolWithRanking & ToolWithTags>;

            if (filters.search) {
                const q = filters.search.toLowerCase().trim();
                data = data
                    .map(tool => ({ tool, relevance: searchRelevance(tool, q, searchTerms) }))
                    .filter(result => result.relevance > 0)
                    .map(result => ({
                        ...result,
                        tool: filters.recommendation
                            ? { ...result.tool, recommendation: scoreRecommendation(result.tool, result.relevance, filters.recommendation) }
                            : result.tool,
                    }))
                    .sort((a, b) => filters.recommendation
                        ? ((b.tool.recommendation?.total ?? 0) - (a.tool.recommendation?.total ?? 0)) || (b.relevance - a.relevance)
                        : (b.relevance - a.relevance) || compareBySelectedSort(a.tool, b.tool, sortType))
                    .map(result => result.tool);

                const start = pageParam * PAGE_SIZE;
                const pagedData = data.slice(start, start + PAGE_SIZE);
                return {
                    data: pagedData,
                    count: data.length,
                    nextPage: start + PAGE_SIZE < data.length ? pageParam + 1 : undefined,
                };
            }

            return {
                data,
                count: count || data.length,
                nextPage: data.length === PAGE_SIZE ? pageParam + 1 : undefined
            };
        },
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextPage,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

export function useCategories() {
    return useQuery({
        queryKey: ['categories'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('categories')
                .select('*')
                .eq('is_active', true)
                .order('display_order', { ascending: true })
                .order('name', { ascending: true });

            if (error) throw error;
            return data;
        },
        staleTime: 10 * 60 * 1000, // Categories rarely change
    });
}

export function useRankingDataStatus() {
    return useQuery({
        queryKey: ['ranking-data-status'],
        queryFn: async () => {
            const { data, error } = await supabase.rpc('get_ranking_data_status');
            if (error) throw error;
            return data as unknown as RankingDataStatus;
        },
        staleTime: 5 * 60 * 1000,
    });
}

// Get single tool by ID
export function useTool(id: string | undefined) {
    return useQuery({
        queryKey: ['tool', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase
                .from('tools')
                .select('*')
                .eq('id', id)
                .single();
            
            if (error) throw error;
            return data as Tool;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}

// Get related tools (same category or similar features)
export function useRelatedTools(currentToolId: string, category: string | null, limit: number = 3) {
    return useQuery({
        queryKey: ['related-tools', currentToolId, category],
        queryFn: async () => {
            const categoryRelation = category ? 'tool_categories!inner(categories!inner(slug))' : 'tool_categories(categories(slug))';
            let query = supabase
                .from('tools')
                .select(`*, ${categoryRelation}`)
                .neq('id', currentToolId)
                .limit(limit);
            
            if (category) query = query.eq('tool_categories.categories.slug', category);
            
            const { data, error } = await query;
            if (error) throw error;
            return data as unknown as Tool[];
        },
        enabled: !!currentToolId,
        staleTime: 5 * 60 * 1000,
    });
}
