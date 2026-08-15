import { Input } from '@/components/ui/input';
import { Search, X } from 'lucide-react';
import type { ToolFilter } from '@/hooks/useTools';
import { useState, useEffect } from 'react';

interface FilterSidebarProps {
    filters: ToolFilter;
    setFilters: (filters: ToolFilter) => void;
    categories: { id: string, name: string, slug: string }[];
}

type PricingType = ToolFilter['pricing'][number];
const pricingOptions: PricingType[] = ['Free', 'Freemium', 'Paid'];

export function FilterSidebar({ filters, setFilters, categories }: FilterSidebarProps) {
    // Local state for search input (for debouncing)
    const [searchInput, setSearchInput] = useState(filters.search || '');

    // Debounce search updates
    useEffect(() => {
        const timer = setTimeout(() => {
            if (searchInput !== (filters.search || '')) {
                setFilters({ ...filters, search: searchInput });
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [searchInput, filters, setFilters]);

    // Sync local state when filters change externally
    useEffect(() => {
        setSearchInput(filters.search || '');
    }, [filters.search]);

    const handlePricingChange = (type: PricingType) => {
        const newPricing = filters.pricing.includes(type)
            ? filters.pricing.filter((p) => p !== type)
            : [...filters.pricing, type];
        setFilters({ ...filters, pricing: newPricing });
    };

    const handleCategoryChange = (slug: string) => {
        setFilters({ ...filters, category: filters.category === slug ? null : slug });
    }

    const clearSearch = () => {
        setSearchInput('');
        setFilters({ ...filters, search: '' });
    };

    return (
        <aside className="w-full md:w-64 shrink-0 space-y-8 pr-6 hidden md:block border-r min-h-[500px]">

            {/* Search within Results */}
            <div>
                <h3 className="font-semibold mb-3">검색</h3>
                <div className="relative">
                    <Search className="absolute left-2 top-2.5 size-4 text-muted-foreground" />
                    <Input
                        placeholder="결과 내 검색"
                        className="pl-8 pr-8 h-9"
                        value={searchInput}
                        onChange={(e) => setSearchInput(e.target.value)}
                    />
                    {searchInput && (
                        <button
                            onClick={clearSearch}
                            className="absolute right-2 top-2.5 text-muted-foreground hover:text-foreground"
                        >
                            <X className="size-4" />
                        </button>
                    )}
                </div>
            </div>

            {/* Category Filter */}
            <div>
                <h3 className="font-semibold mb-3">카테고리</h3>
                <div className="space-y-2">
                    <div
                        className={`text-sm cursor-pointer hover:text-brand-purple ${!filters.category ? 'font-bold text-brand-purple' : 'text-muted-foreground'}`}
                        onClick={() => setFilters({ ...filters, category: null })}
                    >
                        전체 보기
                    </div>
                    {categories.map((cat) => (
                        <div
                            key={cat.id}
                            className={`text-sm cursor-pointer hover:text-brand-purple transition-colors ${filters.category === cat.slug ? 'font-bold text-brand-purple' : 'text-muted-foreground'}`}
                            onClick={() => handleCategoryChange(cat.slug)}
                        >
                            {cat.name}
                        </div>
                    ))}
                </div>
            </div>

            {/* Pricing Filter */}
            <div>
                <h3 className="font-semibold mb-3">가격 정책</h3>
                <div className="space-y-2">
                    {pricingOptions.map((type) => (
                        <div key={type} className="flex items-center space-x-2">
                            <input /* Replaced native checkbox with custom Checkbox later */
                                type="checkbox"
                                id={type}
                                className="accent-brand-purple size-4"
                                checked={filters.pricing.includes(type)}
                                onChange={() => handlePricingChange(type)}
                            />
                            <label htmlFor={type} className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer">
                                {type}
                            </label>
                        </div>
                    ))}
                </div>
            </div>

            {/* Korean Support Filter */}
            <div>
                <h3 className="font-semibold mb-3">한국어 지원</h3>
                <div className="flex items-center space-x-2">
                    <input
                        type="checkbox"
                        id="korean"
                        className="accent-brand-purple size-4"
                        checked={filters.korean}
                        onChange={(e) => setFilters({ ...filters, korean: e.target.checked })}
                    />
                    <label htmlFor="korean" className="text-sm font-medium leading-none cursor-pointer">
                        한국어 지원 포함
                    </label>
                </div>
            </div>

        </aside>
    );
}
