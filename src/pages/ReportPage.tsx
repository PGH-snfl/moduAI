import { useMemo, useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Tool } from '@/hooks/useTools';
import { PieChart, TrendingUp, DollarSign, Award, Code } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// --- Type Definitions ---
interface NewsItem {
    title: string;
    source: string;
    url: string;
    published_date: string | null;
    badge?: string;
    category: 'domestic' | 'global';
}

// --- Components ---

// 1. Sector Donut Chart (CSS Animation)
const SectorChart = ({ data }: { data: { name: string; value: number }[] }) => {
    const total = data.reduce((acc, cur) => acc + cur.value, 0);
    let currentAngle = 0;
    // Distinct Palette: [Purple, Blue, Green, Yellow, Orange, Gray]
    const colors = ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f97316', '#94a3b8'];
    const [isLoaded, setIsLoaded] = useState(false);

    useEffect(() => {
        setIsLoaded(true);
    }, []);

    if (total === 0) return <div className="size-64 flex items-center justify-center text-muted-foreground">No Data</div>;

    return (
        <div className="relative size-64 mx-auto">
            <svg viewBox="0 0 100 100" className="rotate-[-90deg]">
                {data.map((slice, i) => {
                    const sliceAngle = (slice.value / total) * 360;
                    // Avoid NaN/Drawing errors for tiny slices
                    if (sliceAngle <= 0) return null;

                    const x1 = 50 + 40 * Math.cos((Math.PI * currentAngle) / 180);
                    const y1 = 50 + 40 * Math.sin((Math.PI * currentAngle) / 180);
                    const x2 = 50 + 40 * Math.cos((Math.PI * (currentAngle + sliceAngle)) / 180);
                    const y2 = 50 + 40 * Math.sin((Math.PI * (currentAngle + sliceAngle)) / 180);

                    const largeArcFlag = sliceAngle > 180 ? 1 : 0;
                    const pathData = `M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`;

                    currentAngle += sliceAngle;

                    return (
                        <path
                            key={slice.name}
                            d={pathData}
                            fill={colors[i % colors.length]}
                            className="stroke-background stroke-2 hover:opacity-80 transition-all duration-300 cursor-pointer origin-center hover:scale-105"
                            style={{
                                opacity: isLoaded ? 1 : 0,
                                transitionDelay: `${i * 100}ms`
                            }}
                        >
                            <title>{`${slice.name}: ${Math.round((slice.value / total) * 100)}%`}</title>
                        </path>
                    );
                })}
                <circle cx="50" cy="50" r="25" className="fill-background" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                <span className="text-3xl font-bold font-tmon">{total}</span>
                <span className="text-xs text-muted-foreground">Total Tools</span>
            </div>
        </div>
    );
};



// 3. Sector Deep Dive Tabs
const DeepDiveTabs = ({ topSectors }: { topSectors: { name: string; data: { name: string; value: number }[] }[] }) => {
    const [activeSector, setActiveSector] = useState(topSectors[0]?.name || '');

    // Update active sector if data changes/loads
    useEffect(() => {
        if (!activeSector && topSectors.length > 0) {
            setActiveSector(topSectors[0].name);
        }
    }, [topSectors, activeSector]);

    const currentData = topSectors.find(s => s.name === activeSector)?.data || [];
    const total = currentData.reduce((acc, cur) => acc + cur.value, 0);

    if (topSectors.length === 0) return <div className="h-full flex items-center justify-center text-muted-foreground">데이터 로딩 중...</div>;

    return (
        <div className="flex flex-col h-full">
            {/* Sector Tabs */}
            <div className="flex gap-2 flex-wrap pb-4">
                {topSectors.map((sector) => (
                    <button
                        key={sector.name}
                        onClick={() => setActiveSector(sector.name)}
                        className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${activeSector === sector.name
                            ? 'bg-indigo-500 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                            }`}
                    >
                        {sector.name}
                    </button>
                ))}
            </div>

            {/* Chart Area */}
            <div className="space-y-4 flex-1">
                {currentData.map((item, i) => (
                    <div key={item.name} className="space-y-1">
                        <div className="flex justify-between text-sm">
                            <span className="font-medium flex items-center gap-2">
                                <span className={`font-mono text-xs w-4 flex justify-center items-center h-4 rounded-full ${i === 0 ? 'bg-indigo-100 text-indigo-600' : 'text-muted-foreground'}`}>{i + 1}</span>
                                {item.name}
                            </span>
                            <span className="text-muted-foreground text-xs">{total > 0 ? Math.round((item.value / total) * 100) : 0}%</span>
                        </div>
                        <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full bg-indigo-500"
                                style={{
                                    width: `${total > 0 ? (item.value / total) * 100 : 0}%`,
                                    opacity: 1 - (i * 0.15)
                                }}
                            />
                        </div>
                    </div>
                ))}
                {currentData.length === 0 && <div className="text-center text-xs text-muted-foreground py-8">데이터가 부족합니다.</div>}
            </div>
        </div>
    );
};

// 4. News Section Component
const NewsSection = ({ newsItems }: { newsItems: NewsItem[] }) => {
    const [tab, setTab] = useState<'domestic' | 'global'>('domestic');

    // Filter by tab
    const news = newsItems.filter(item => item.category === tab);

    return (
        <div className="rounded-2xl border bg-card text-card-foreground shadow-sm bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1">
                    <h3 className="text-xl font-bold font-tmon flex items-center gap-2">
                        <span className="text-2xl">📰</span> Daily AI News
                    </h3>
                    <p className="text-sm text-muted-foreground">매일 업데이트되는 국내외 AI 트렌드</p>
                </div>
                <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
                    <button
                        onClick={() => setTab('domestic')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${tab === 'domestic' ? 'bg-white dark:bg-slate-700 shadow-sm text-brand-purple' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🇰🇷 국내 AI 소식
                    </button>
                    <button
                        onClick={() => setTab('global')}
                        className={`px-4 py-2 rounded-md text-sm font-bold transition-all ${tab === 'global' ? 'bg-white dark:bg-slate-700 shadow-sm text-blue-500' : 'text-slate-500 hover:text-slate-700'}`}
                    >
                        🇺🇸 Global Trends
                    </button>
                </div>
            </div>
            <div className="p-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100 dark:divide-slate-800">
                    {/* Left Column (1-5) */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {news.slice(0, 5).map((item, i) => (
                            <a
                                key={i}
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-start gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                            >
                                <span className={`
                                    flex items-center justify-center size-6 rounded font-bold text-xs shrink-0 mt-0.5
                                    ${i < 3 ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'}
                                `}>
                                    {i + 1}
                                </span>
                                <div className="space-y-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200 text-slate-500">
                                            {item.source}
                                        </Badge>
                                        {item.badge && (
                                            <Badge className={`text-[10px] px-1.5 py-0 ${item.badge === 'Hot' ? 'bg-red-500 hover:bg-red-600' : item.badge === 'Must Read' ? 'bg-indigo-500 hover:bg-indigo-600' : 'bg-emerald-500 hover:bg-emerald-600'} border-0`}>
                                                {item.badge}
                                            </Badge>
                                        )}
                                        <span className="text-xs text-slate-400 ml-auto">{item.published_date}</span>
                                    </div>
                                    <h4 className="font-bold text-base group-hover:text-brand-purple transition-colors line-clamp-2 md:line-clamp-1">
                                        {item.title}
                                    </h4>
                                </div>
                            </a>
                        ))}
                    </div>
                    {/* Right Column (6-10) */}
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {news.slice(5, 10).map((item, i) => (
                            <a
                                key={i}
                                href={item.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-start gap-4 p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                            >
                                <span className="flex items-center justify-center size-6 rounded font-bold text-xs shrink-0 mt-0.5 bg-slate-100 text-slate-500 dark:bg-slate-800">
                                    {i + 6}
                                </span>
                                <div className="space-y-1 min-w-0">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-slate-200 text-slate-500">
                                            {item.source}
                                        </Badge>
                                        <span className="text-xs text-slate-400 ml-auto">{item.published_date}</span>
                                    </div>
                                    <h4 className="font-medium text-base text-slate-700 dark:text-slate-300 group-hover:text-brand-purple transition-colors line-clamp-2 md:line-clamp-1">
                                        {item.title}
                                    </h4>
                                </div>
                            </a>
                        ))}
                    </div>
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-100 dark:border-slate-800 text-center">
                    <a href={tab === 'domestic' ? 'https://www.aitimes.com' : 'https://www.technologyreview.com/topic/artificial-intelligence/'} target="_blank" rel="noreferrer" className="text-sm font-bold text-muted-foreground hover:text-brand-purple transition-colors inline-flex items-center gap-2">
                        {tab === 'domestic' ? 'AI Times' : 'MIT Technology Review'}에서 더 보기
                        <TrendingUp className="size-4" />
                    </a>
                </div>
            </div>
        </div>
    );
};

export const ReportPage = () => {
    // --- Data Fetching (Real Data from Supabase) ---

    // 1. Fetch Tools for Analytics
    const { data: toolsData, isLoading: isToolsLoading } = useQuery({
        queryKey: ['report-tools'],
        queryFn: async () => {
            const { data, error } = await supabase.from('tools').select('*');
            if (error) throw error;
            return data as Tool[];
        }
    });

    // 2. Fetch News
    const { data: newsData, isLoading: isNewsLoading } = useQuery({
        queryKey: ['report-news'],
        queryFn: async () => {
            const { data, error } = await supabase.from('news').select('*').order('published_date', { ascending: false }).order('created_at', { ascending: false });
            if (error) throw error;
            return data as unknown as NewsItem[];
        }
    });

    // --- Data Processing ---

    const stats = useMemo(() => {
        if (!toolsData) return null;

        const sectorMap: Record<string, number> = {};
        const sectorToolsMap: Record<string, { name: string, value: number }[]> = {};
        const pricingMap: Record<string, number> = { 'Free': 0, 'Freemium': 0, 'Paid': 0 };
        const apiCount = toolsData.filter(t => t.has_api).length;

        toolsData.forEach(tool => {
            // Sector extraction
            const tags = tool.description?.match(/#[\w가-힣]+/g) || [];
            const mainTag = tags[0]?.replace('#', '') || 'Other';
            sectorMap[mainTag] = (sectorMap[mainTag] || 0) + 1;

            // Collect for Deep Dive
            if (!sectorToolsMap[mainTag]) sectorToolsMap[mainTag] = [];
            // Use visit_count as "Share" metric within sector, or just count 1 if visit_count missing
            sectorToolsMap[mainTag].push({
                name: tool.name,
                value: tool.visit_count || 1000 // Proxy for "Share"
            });

            // Pricing
            if (pricingMap[tool.pricing_type] !== undefined) {
                pricingMap[tool.pricing_type]++;
            }
        });

        // Format Sector Data (Top 5 + Others)
        const sortedSectors = Object.entries(sectorMap)
            .sort(([, a], [, b]) => b - a)
            .map(([name, value]) => ({ name, value }));

        const top5Sectors = sortedSectors.slice(0, 5);
        const otherCount = sortedSectors.slice(5).reduce((acc, cur) => acc + cur.value, 0);
        if (otherCount > 0) top5Sectors.push({ name: '기타', value: otherCount });

        // Pricing Data
        const pricingData = [
            { name: '무료 (Free)', value: pricingMap['Free'], color: '#22c55e' }, // Green
            { name: '부분 유료 (Freemium)', value: pricingMap['Freemium'], color: '#8b5cf6' }, // Brand Purple
            { name: '유료 (Paid)', value: pricingMap['Paid'], color: '#ef4444' }, // Red
        ];

        // Rankings
        const trafficLeaders = [...toolsData].sort((a, b) => (b.visit_count || 0) - (a.visit_count || 0)).slice(0, 5);
        const reviewLeaders = [...toolsData].sort((a, b) => (b.review_count || 0) - (a.review_count || 0)).slice(0, 5);

        // Multi-Sector Deep Dive Data
        // 1. Get names of Top 5 Sectors
        const topSectorNames = top5Sectors.filter(s => s.name !== '기타').map(s => s.name);

        // 2. Build data structure for each
        const rankingData = topSectorNames.map(name => {
            const tools = sectorToolsMap[name] || [];
            const sorted = tools.sort((a, b) => b.value - a.value).slice(0, 5);
            return { name, data: sorted };
        });

        return { sectors: top5Sectors, pricing: pricingData, apiCount, total: toolsData.length, trafficLeaders, reviewLeaders, rankingData };
    }, [toolsData]);

    if (isToolsLoading || isNewsLoading || !stats) {
        return <div className="min-h-screen flex items-center justify-center text-muted-foreground">리포트를 생성하고 있습니다...</div>;
    }

    return (
        <div className="container py-8 max-w-6xl animate-fade-in">
            <div className="mb-8 space-y-2">
                <div className="flex items-center gap-2 text-brand-purple mb-2">
                    <PieChart className="size-5" />
                    <span className="font-bold tracking-wider text-sm uppercase">AI Insight Report</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-bold font-tmon">2026 AI 트렌드 리포트</h1>
                <p className="text-lg text-muted-foreground">
                    등록된 <span className="text-foreground font-bold">{stats.total}개</span>의 AI 서비스를 심층 분석했습니다.
                </p>
            </div>

            {/* Top Row: 3 Equal Columns */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                {/* 1. Sector Analysis */}
                <div className="col-span-1 rounded-xl border bg-card text-card-foreground shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur">
                    <div className="flex flex-col space-y-1.5 p-6 text-center">
                        <h3 className="font-semibold leading-none tracking-tight flex items-center justify-center gap-2">
                            <TrendingUp className="size-5 text-blue-500" />
                            섹터별 점유율
                        </h3>
                        <p className="text-sm text-muted-foreground">가장 활발한 AI 분야는?</p>
                    </div>
                    <div className="p-6 pt-0 flex flex-col items-center">
                        <SectorChart data={stats.sectors} />
                        <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-2 w-full">
                            {stats.sectors.map((s, i) => (
                                <div key={s.name} className="flex items-center gap-2 text-sm">
                                    <div className="size-2 rounded-full shrink-0" style={{ backgroundColor: ['#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#f97316', '#94a3b8'][i] }} />
                                    <span className="text-muted-foreground flex-1 truncate text-left">{s.name}</span>
                                    <span className="font-bold">{Math.round((s.value / stats.total) * 100)}%</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 2. Deep Dive (Multi-Sector) */}
                <div className="col-span-1 rounded-xl border bg-card text-card-foreground shadow-sm bg-blue-50/50 dark:bg-blue-900/10 backdrop-blur border-blue-100 dark:border-blue-900">
                    <div className="flex flex-col space-y-1.5 p-6 pb-2">
                        <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                            <Award className="size-5 text-indigo-500" />
                            분야별 Top 5
                        </h3>
                        <p className="text-sm text-muted-foreground">주요 섹터 내 인기 서비스</p>
                    </div>
                    <div className="p-6 pt-2 h-[420px]">
                        <DeepDiveTabs topSectors={stats.rankingData} />
                    </div>
                </div>

                {/* 3. Market Leaders */}
                <div className="col-span-1 rounded-xl border bg-card text-card-foreground shadow-sm bg-gradient-to-br from-brand-purple/5 to-blue-500/5 border-l-4 border-l-brand-purple">
                    <div className="flex flex-col space-y-1.5 p-6">
                        <h3 className="font-semibold leading-none tracking-tight flex items-center gap-2">
                            <Award className="size-5 text-amber-500" />
                            마켓 리더 (Traffic)
                        </h3>
                        <p className="text-sm text-muted-foreground">가장 많이 방문한 서비스</p>
                    </div>
                    <div className="p-6 pt-0">
                        <div className="space-y-4">
                            {stats.trafficLeaders.map((tool, i) => (
                                <div key={tool.id} className="flex items-center gap-3 group cursor-pointer hover:bg-white/50 dark:hover:bg-slate-800/50 p-3 rounded-lg transition-colors">
                                    <div className={`
                                        size-8 rounded flex items-center justify-center font-bold text-sm shrink-0
                                        ${i === 0 ? 'bg-amber-400 text-white shadow-amber-200' :
                                            i === 1 ? 'bg-slate-400 text-white' :
                                                i === 2 ? 'bg-amber-700 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}
                                    `}>
                                        {i + 1}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-bold truncate text-base">{tool.name}</div>
                                        <div className="text-xs text-muted-foreground line-clamp-1">{tool.description}</div>
                                    </div>
                                    <Badge variant="secondary" className="text-[10px] shrink-0 px-1.5">
                                        {(tool.visit_count || 0) >= 1000000
                                            ? Math.floor((tool.visit_count || 0) / 10000) + '만+'
                                            : (tool.visit_count || 0).toLocaleString()} visitors
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle: Daily News Section */}
            <div className="mb-8 animate-fade-in-up delay-200">
                <NewsSection newsItems={newsData || []} />
            </div>

            {/* Bottom: Review Leaders Section (Hall of Fame) */}
            <div className="bg-slate-900 text-white rounded-2xl p-8 mb-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Award className="size-64 rotate-12" />
                </div>
                <h2 className="text-2xl font-bold mb-6 relative z-10 flex items-center gap-2">
                    <Award className="text-amber-400" /> 명예의 전당: 사용자 리뷰 Top 5
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 relative z-10">
                    {stats.reviewLeaders.map((tool, i) => (
                        <div key={tool.id} className="bg-white/10 backdrop-blur p-4 rounded-xl border border-white/10 hover:bg-white/20 transition-colors">
                            <div className="text-4xl font-black text-white/20 mb-2">0{i + 1}</div>
                            <h3 className="font-bold text-lg mb-1 truncate">{tool.name}</h3>
                            <div className="flex items-center gap-1 text-sm text-yellow-400 mb-2">
                                <span className="font-bold">{tool.average_rating}</span>
                                <div className="flex">
                                    {[...Array(5)].map((_, idx) => (
                                        <span key={idx} className={`size-1.5 rounded-full mx-[1px] ${idx < Math.floor(tool.average_rating || 0) ? 'bg-yellow-400' : 'bg-slate-600'}`} />
                                    ))}
                                </div>
                            </div>
                            <p className="text-xs text-white/60 line-clamp-2">{tool.description}</p>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer: Pricing & API Stats (Refactored to horizontal style) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {/* Pricing Distribution */}
                <div className="col-span-1 rounded-xl border bg-card text-card-foreground shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur p-6">
                    <h3 className="font-semibold tracking-tight flex items-center gap-2 mb-4">
                        <DollarSign className="size-5 text-green-500" />
                        가격 정책 분포
                    </h3>
                    <div className="space-y-4">
                        {stats.pricing.map((item) => (
                            <div key={item.name} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="font-medium flex items-center gap-2">
                                        <div className={`size-2 rounded-full`} style={{ backgroundColor: item.color }} />
                                        {item.name}
                                    </span>
                                    <span className="text-muted-foreground">{item.value}개 ({Math.round((item.value / stats.total) * 100)}%)</span>
                                </div>
                                <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                    <div
                                        className="h-full rounded-full"
                                        style={{
                                            backgroundColor: item.color,
                                            width: `${(item.value / stats.total) * 100}%`
                                        }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* API Availability */}
                <div className="col-span-1 rounded-xl border bg-card text-card-foreground shadow-sm bg-white/50 dark:bg-slate-900/50 backdrop-blur p-6 flex flex-col justify-center">
                    <h3 className="font-semibold tracking-tight flex items-center gap-2 mb-2">
                        <Code className="size-5 text-brand-purple" />
                        API 지원 현황
                    </h3>
                    <p className="text-sm text-muted-foreground mb-6">전체 서비스 중 개발자 API를 제공하는 비율</p>

                    <div className="flex items-end justify-between mb-2">
                        <span className="text-3xl font-bold font-mono text-brand-purple">{Math.round((stats.apiCount / stats.total) * 100)}%</span>
                        <span className="text-sm text-muted-foreground">of {stats.total} tools</span>
                    </div>
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-4 rounded-full overflow-hidden">
                        <div
                            className="bg-brand-purple h-full rounded-full transition-all duration-1000 ease-out"
                            style={{ width: `${(stats.apiCount / stats.total) * 100}%` }}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
};
