import { useState } from 'react';
import { createClient } from '@supabase/supabase-js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart3, TrendingUp, Users, RefreshCw, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Initialize Supabase client (use anon key for read operations)
const supabase = createClient(
    import.meta.env.VITE_SUPABASE_URL || '',
    import.meta.env.VITE_SUPABASE_ANON_KEY || ''
);

interface TrafficStat {
    id: string;
    tool_id: string;
    date: string;
    visitors: number;
    page_views: number;
    tools?: {
        name: string;
        category: string;
    };
}

interface ToolWithTraffic {
    id: string;
    name: string;
    category: string;
    total_visitors: number;
    total_page_views: number;
    last_7_days: number;
    previous_7_days: number;
    growth_rate: number;
}

export function TrafficDashboardPage() {
    const [stats, setStats] = useState<{
        totalTools: number;
        totalVisitors: number;
        totalPageViews: number;
        topTools: ToolWithTraffic[];
        trendingTools: ToolWithTraffic[];
        categoryDistribution: { category: string; visitors: number }[];
        isLoading: boolean;
        error: string | null;
    }>({
        totalTools: 0,
        totalVisitors: 0,
        totalPageViews: 0,
        topTools: [],
        trendingTools: [],
        categoryDistribution: [],
        isLoading: false,
        error: null
    });

    const [dateRange, setDateRange] = useState<'7d' | '30d' | '90d'>('30d');

    const fetchTrafficStats = async () => {
        try {
            setStats(prev => ({ ...prev, isLoading: true, error: null }));

            // Get all tools
            const { data: tools, error: toolsError } = await supabase
                .from('tools')
                .select('id, name, category, visit_count')
                .order('visit_count', { ascending: false })
                .limit(20);

            if (toolsError) throw new Error('Failed to fetch tools');

            // Get traffic stats
            let dateFilter = '';
            const today = new Date();
            
            if (dateRange === '7d') {
                const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
                dateFilter = sevenDaysAgo.toISOString();
            } else if (dateRange === '30d') {
                const thirtyDaysAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
                dateFilter = thirtyDaysAgo.toISOString();
            } else if (dateRange === '90d') {
                const ninetyDaysAgo = new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000);
                dateFilter = ninetyDaysAgo.toISOString();
            }

            const { data: trafficStats, error: trafficError } = await supabase
                .from('traffic_stats')
                .select('tool_id, date, visitors, page_views, tools!inner(name, category)')
                .gte('date', dateFilter.split('T')[0])
                .order('date', { ascending: false });

            if (trafficError) throw new Error('Failed to fetch traffic stats');

            // Aggregate traffic by tool
            const trafficByTool = new Map<string, {
                total_visitors: number;
                total_page_views: number;
                last_7_days: number;
                previous_7_days: number;
            }>();

            trafficStats.forEach((stat: TrafficStat) => {
                const existing = trafficByTool.get(stat.tool_id);
                if (existing) {
                    existing.total_visitors += stat.visitors;
                    existing.total_page_views += stat.page_views;
                } else {
                    trafficByTool.set(stat.tool_id, {
                        total_visitors: stat.visitors,
                        total_page_views: stat.page_views,
                        last_7_days: 0,
                        previous_7_days: 0
                    });
                }
            });

            // Calculate 7-day and previous 7-day metrics for each tool
            const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
            const fourteenDaysAgo = new Date(today.getTime() - 14 * 24 * 60 * 60 * 1000);

            trafficStats.forEach((stat: TrafficStat) => {
                const statDate = new Date(stat.date);
                if (statDate >= sevenDaysAgo) {
                    const metrics = trafficByTool.get(stat.tool_id);
                    if (metrics) {
                        metrics.last_7_days += stat.visitors;
                    }
                } else if (statDate >= fourteenDaysAgo && statDate < sevenDaysAgo) {
                    const metrics = trafficByTool.get(stat.tool_id);
                    if (metrics) {
                        metrics.previous_7_days += stat.visitors;
                    }
                }
            });

            // Calculate totals
            const totalVisitors = Array.from(trafficByTool.values())
                .reduce((sum, metrics) => sum + metrics.total_visitors, 0);
            const totalPageViews = Array.from(trafficByTool.values())
                .reduce((sum, metrics) => sum + metrics.total_page_views, 0);

            // Get top tools by traffic
            const toolsWithTraffic = tools
                ?.map(tool => {
                    const metrics = trafficByTool.get(tool.id);
                    if (!metrics) return null;

                    const last7 = metrics.last_7_days;
                    const previous7 = metrics.previous_7_days;
                    const growthRate = previous7 > 0 
                        ? ((last7 - previous7) / previous7) * 100 
                        : 0;

                    return {
                        id: tool.id,
                        name: tool.name,
                        category: tool.category || 'Other',
                        total_visitors: metrics.total_visitors,
                        total_page_views: metrics.total_page_views,
                        last_7_days: last7,
                        previous_7_days: previous7,
                        growth_rate: growthRate
                    };
                })
                .filter((tool): tool is ToolWithTraffic => tool !== null)
                .sort((a, b) => b.last_7_days - a.last_7_days)
                .slice(0, 10) as ToolWithTraffic[];

            // Get trending tools (by growth rate)
            const trendingTools = (toolsWithTraffic || [])
                .filter(tool => tool.growth_rate > 0)
                .sort((a, b) => b.growth_rate - a.growth_rate)
                .slice(0, 10);

            // Calculate category distribution
            const categoryMap = new Map<string, number>();
            toolsWithTraffic.forEach(tool => {
                const existing = categoryMap.get(tool.category);
                if (existing) {
                    categoryMap.set(tool.category, existing + tool.last_7_days);
                } else {
                    categoryMap.set(tool.category, tool.last_7_days);
                }
            });

            const categoryDistribution = Array.from(categoryMap.entries())
                .map(([category, visitors]) => ({ category, visitors }))
                .sort((a, b) => b.visitors - a.visitors)
                .slice(0, 10);

            setStats({
                totalTools: tools?.length || 0,
                totalVisitors,
                totalPageViews,
                topTools: toolsWithTraffic || [],
                trendingTools,
                categoryDistribution,
                isLoading: false,
                error: null
            });

        } catch (err) {
            console.error('Error fetching traffic stats:', err);
            setStats(prev => ({ ...prev, isLoading: false, error: '데이터를 가져오는 중 오류가 발생했습니다.' }));
        }
    };

    // Initial load
    useState(() => {
        fetchTrafficStats();
    }, []);

    const formatNumber = (num: number) => {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toLocaleString();
    };

    const formatGrowthRate = (rate: number) => {
        if (rate > 100) {
            return `+${rate.toFixed(0)}%`;
        }
        return `${rate.toFixed(1)}%`;
    };

    return (
        <div className="container py-8">
            {/* Header */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold">트래픽 통계 대시보드</h1>
                <p className="text-muted-foreground">
                    AI 도구 방문자 수, 조회수, 인기 도구 등을 모니터링합니다.
                </p>
            </div>

            {/* Date Range Filter */}
            <Card className="mb-6">
                <CardContent className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Calendar className="size-4 text-muted-foreground" />
                        <span className="text-sm font-medium">기간 선택:</span>
                    </div>
                    <div className="flex gap-2">
                        {(['7d', '30d', '90d'] as const).map((range) => (
                            <button
                                key={range}
                                onClick={() => setDateRange(range)}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    dateRange === range 
                                        ? 'bg-brand-purple text-white' 
                                        : 'bg-muted hover:bg-muted/80'
                                }`}
                            >
                                {range === '7d' && '최근 7일'}
                                {range === '30d' && '최근 30일'}
                                {range === '90d' && '최근 90일'}
                            </button>
                        ))}
                    </div>
                    <button
                        onClick={() => fetchTrafficStats()}
                        className="p-2 rounded-lg hover:bg-muted/80 transition-colors"
                        title="새로고침"
                    >
                        <RefreshCw className="size-4 text-muted-foreground" />
                    </button>
                </CardContent>
            </Card>

            {stats.isLoading ? (
                <div className="flex items-center justify-center py-20">
                    <RefreshCw className="size-8 animate-spin text-brand-purple" />
                </div>
            ) : stats.error ? (
                <Card className="mb-6">
                    <CardContent className="text-center py-12">
                        <p className="text-destructive font-medium">{stats.error}</p>
                        <button
                            onClick={() => fetchTrafficStats()}
                            className="mt-4 px-4 py-2 bg-brand-purple text-white rounded-lg"
                        >
                            다시 시도
                        </button>
                    </CardContent>
                </Card>
            ) : (
                <>
                    {/* Overview Cards */}
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">총 방문자</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <Users className="size-8 text-brand-purple" />
                                    <span className="text-3xl font-bold">
                                        {formatNumber(stats.totalVisitors)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">총 조회수</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <BarChart3 className="size-8 text-brand-purple" />
                                    <span className="text-3xl font-bold">
                                        {formatNumber(stats.totalPageViews)}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">등록된 도구</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="flex items-center gap-2">
                                    <TrendingUp className="size-8 text-brand-purple" />
                                    <span className="text-3xl font-bold">
                                        {stats.totalTools}
                                    </span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm">평균 조회/방문</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <span className="text-3xl font-bold">
                                    {stats.totalVisitors > 0 
                                        ? (stats.totalPageViews / stats.totalVisitors).toFixed(1)
                                        : '0'}
                                </span>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid gap-6 md:grid-cols-2 mb-6">
                        {/* Top Tools */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top 10 도구</CardTitle>
                                <CardDescription>최근 7일 기준 방문자수</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {stats.topTools.slice(0, 10).map((tool, idx) => (
                                        <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-brand-purple/10 flex items-center justify-center">
                                                    <span className="text-xs font-bold">{idx + 1}</span>
                                                </div>
                                                <div>
                                                    <p className="font-medium">{tool.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {tool.category}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-2xl font-bold">
                                                    {formatNumber(tool.last_7_days)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    방문
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Trending Tools */}
                        <Card>
                            <CardHeader>
                                <CardTitle>
                                    급상승 도구
                                    <Badge variant="secondary" className="ml-2">
                                        성장률 기준
                                    </Badge>
                                </CardTitle>
                                <CardDescription>주간 성장률 상위 10개</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-3">
                                    {stats.trendingTools.map((tool, idx) => (
                                        <div key={tool.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                                            <div className="flex items-center gap-3">
                                                <div className="size-8 rounded-full bg-green-500/10 flex items-center justify-center">
                                                    <TrendingUp className="size-4 text-green-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium">{tool.name}</p>
                                                    <p className="text-xs text-muted-foreground">
                                                        {tool.category}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant="secondary" className="mb-1">
                                                    {formatGrowthRate(tool.growth_rate)}
                                                </Badge>
                                                <p className="text-2xl font-bold">
                                                    {formatNumber(tool.last_7_days)}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    방문
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Category Distribution */}
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>카테고리별 방문자</CardTitle>
                            <CardDescription>카테고리별 분포</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {stats.categoryDistribution.map((cat, idx) => (
                                    <div key={cat.category} className="flex items-center justify-between">
                                        <div className="flex-1">
                                            <p className="font-medium">{cat.category}</p>
                                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-brand-purple transition-all duration-300" 
                                                    style={{ width: `${(cat.visitors / stats.totalVisitors) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                        <div className="text-right min-w-20">
                                            <p className="text-2xl font-bold">
                                                {formatNumber(cat.visitors)}
                                            </p>
                                            <p className="text-xs text-muted-foreground">
                                                {((cat.visitors / stats.totalVisitors) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
