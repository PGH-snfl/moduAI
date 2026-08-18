import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ToolGrid } from '@/components/tools/ToolGrid';
import { useCategories, type ToolFilter } from '@/hooks/useTools';
import { Button } from '@/components/ui/button';
import { Flame, ListFilter, Medal, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { RecommendationAssistant } from '@/components/tools/RecommendationAssistant';
import type { RecommendationPreferences } from '@/lib/recommendation';

export function ToolsPage() {
    const [searchParams] = useSearchParams();
    const query = searchParams.get('q') || '';
    const [recommendation, setRecommendation] = useState<RecommendationPreferences | null>(null);

    const [filters, setFilters] = useState<ToolFilter>({
        category: null,
        pricing: [],
        korean: false,
        search: query,
        sort: 'recognition',
    });

    // Sync filters with URL query
    useEffect(() => {
        setRecommendation(null);
        setFilters(prev => ({ ...prev, search: query, pricing: [], koreanSupport: false, apiRequired: false, recommendation: null }));
    }, [query]);

    const { data: categories } = useCategories();

    const applyRecommendation = (preferences: RecommendationPreferences) => {
        const pricing: ToolFilter['pricing'] = preferences.budget === 'free'
            ? ['Free']
            : preferences.budget === 'free_or_paid'
                ? ['Free', 'Freemium']
                : preferences.budget === 'paid'
                    ? ['Paid', 'Contact']
                    : [];
        setRecommendation(preferences);
        setFilters(prev => ({
            ...prev,
            pricing,
            koreanSupport: preferences.korean === 'required',
            apiRequired: preferences.api === 'required',
            sort: preferences.priority === 'quality' ? 'popular' : 'recognition',
            recommendation: preferences,
        }));
    };

    const resetRecommendation = () => {
        setRecommendation(null);
        setFilters(prev => ({ ...prev, pricing: [], koreanSupport: false, apiRequired: false, sort: 'recognition', recommendation: null }));
    };

    const primaryRanks: Array<{
        value: 'recognition' | 'trending' | 'popular';
        label: string;
        icon: typeof Sparkles;
    }> = [
        { value: 'recognition', label: '종합', icon: Sparkles },
        { value: 'trending', label: '급상승', icon: Flame },
        { value: 'popular', label: '평판', icon: Medal },
    ];

    return (
        <div className="container min-h-screen max-w-7xl mx-auto px-4 py-5 sm:px-6 sm:py-8">

            <RecommendationAssistant query={query} applied={recommendation} onApply={applyRecommendation} onReset={resetRecommendation} />

            {/* 1. Category Buttons (Horizontal Scrollable) */}
            {/* Moved Search to Global Header, so Categories are top now */}
            <div className="mb-5 sm:mb-8 -mx-4 overflow-x-auto px-4 pb-2 custom-scrollbar sm:mx-0 sm:px-0">
                <div className="flex gap-2 min-w-max px-1">
                    <Button
                        variant={filters.category === null ? "default" : "outline"}
                        className={cn(
                            "rounded-full px-4 sm:px-6 h-10 font-bold transition-all",
                            filters.category === null
                                ? "bg-black text-white hover:bg-slate-800"
                                : "bg-white text-slate-700 hover:bg-slate-100 hover:text-black border-slate-300"
                        )}
                        onClick={() => setFilters(prev => ({ ...prev, category: null }))}
                    >
                        전체
                        <span className={cn("ml-2 text-xs", filters.category === null ? "text-slate-300" : "text-slate-400")}>ALL</span>
                    </Button>

                    {categories?.map((cat) => (
                        <Button
                            key={cat.id}
                            variant={filters.category === cat.slug ? "default" : "outline"}
                            className={cn(
                                "rounded-full px-4 sm:px-5 h-10 transition-all font-medium",
                                filters.category === cat.slug
                                    ? "bg-black text-white hover:bg-slate-800 shadow-md"
                                    : "bg-white text-slate-600 hover:bg-slate-50 hover:text-black border-slate-200"
                            )}
                            onClick={() => setFilters(prev => ({ ...prev, category: cat.slug }))}
                        >
                            {cat.name}
                        </Button>
                    ))}
                </div>
            </div>

            {/* 2. Filter Controls Row */}
            <div className="flex flex-col gap-4 mb-6 border-b border-slate-100 pb-4 lg:flex-row lg:items-center lg:justify-end">

                {/* Right Side: Filters */}
                <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 w-full sm:w-auto">
                    {/* Checkboxes Group */}
                    <div className="grid grid-cols-1 xs:grid-cols-2 gap-3 sm:flex sm:items-center sm:gap-6">
                        <div className="flex items-center space-x-2">
                            <Checkbox
                                id="korean-support"
                                checked={filters.korean}
                                onCheckedChange={(checked) => setFilters(prev => ({ ...prev, korean: checked === true }))}
                            />
                            <Label htmlFor="korean-support" className="text-sm font-medium cursor-pointer text-slate-700">
                                국내 AI만 보기
                            </Label>
                        </div>

                    </div>

                    <div className="h-4 w-px bg-slate-200 mx-2 hidden sm:block"></div>

                    {/* Primary rankings + detail sorting */}
                    <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
                        <div className="flex shrink-0 items-center gap-1" role="group" aria-label="주요 순위 선택">
                            {primaryRanks.map((rank) => {
                                const Icon = rank.icon;
                                const selected = filters.sort === rank.value;
                                return (
                                    <button
                                        key={rank.value}
                                        type="button"
                                        aria-pressed={selected}
                                        onClick={() => setFilters(prev => ({ ...prev, sort: rank.value }))}
                                        className={cn(
                                            'inline-flex h-9 items-center gap-1 rounded-md border px-2.5 text-xs font-bold whitespace-nowrap transition-colors',
                                            selected
                                                ? 'border-brand-purple bg-brand-purple text-white'
                                                : 'border-slate-200 bg-white text-slate-600 hover:border-brand-purple/50 hover:text-brand-purple'
                                        )}
                                    >
                                        <Icon className="size-3.5" />
                                        {rank.label}
                                    </button>
                                );
                            })}
                        </div>

                        <ListFilter className="size-4 text-slate-500" />
                        <div className="relative">
                            <select
                                className="h-10 w-[160px] sm:w-[140px] appearance-none rounded-md border border-slate-200 bg-white py-2 pl-3 pr-8 text-sm font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-brand-purple cursor-pointer"
                                value={filters.sort}
                                onChange={(e) => setFilters(prev => ({ ...prev, sort: e.target.value as ToolFilter['sort'] }))}
                            >
                                {(['recognition', 'trending', 'popular'] as const).includes(filters.sort as 'recognition' | 'trending' | 'popular') && (
                                    <option value={filters.sort}>세부 정렬 선택</option>
                                )}
                                <option value="updated">업데이트순</option>
                                <option value="latest">최신 등록순</option>
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3. Tool Grid */}
            <div className="min-h-[500px]">
                <ToolGrid filters={filters} />
            </div>
        </div>
    );
}
