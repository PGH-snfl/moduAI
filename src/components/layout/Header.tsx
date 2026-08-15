import { Link, useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu, X, Moon, Sun, Search, TrendingUp, Trophy, FileText, User, LogOut, Shield, PlusCircle, Lightbulb } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { Input } from '@/components/ui/input';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const SEARCH_PLACEHOLDERS = [
    '사진 넣으면 모션 만들어주는 AI...',
    '논문 요약해주는 AI...',
    '비디오 자동 편집해주는 AI...',
    '코딩 도와주는 AI 개발 툴...',
    'PPT 대신 만들어주는 AI...',
];
const POPULAR_TAGS = ['#교육', '#생산성', '#인스타', '#유튜브', '#디자인'];
const SEARCH_EXAMPLES = ['논문 요약', 'PPT 만들기', '영상 자동 편집', '한국어 지원 코딩 AI'];

function ModeToggle() {
    const { theme, setTheme } = useTheme()

    return (
        <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            <span className="sr-only">Toggle theme</span>
        </Button>
    )
}

function SearchPanel({ id, popularTags, examples, onSelect, query, onSubmit }: {
    id: string;
    popularTags: string[];
    examples: string[];
    onSelect: (keyword: string) => void;
    query?: string;
    onSubmit?: () => void;
}) {
    return (
        <div
            id={id}
            role="dialog"
            aria-label="검색 도움말"
            onPointerDown={(event) => event.stopPropagation()}
            className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-xl border bg-popover text-popover-foreground shadow-xl"
        >
            {query?.trim() && (
                <div className="border-b p-3">
                    <button type="button" onClick={onSubmit} className="flex w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-muted">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-purple/10 text-brand-purple"><Search className="size-4" /></span>
                        <span className="min-w-0 flex-1">
                            <span className="block truncate text-sm font-semibold">“{query.trim()}” 검색하기</span>
                            <span className="block text-xs text-muted-foreground">입력을 완료하고 검색 결과에 적용합니다.</span>
                        </span>
                    </button>
                </div>
            )}
            <div className="p-4">
                <p className="flex items-center gap-2 text-sm font-semibold"><TrendingUp className="size-4 text-brand-purple" />인기 검색 태그</p>
                <div className="mt-3 flex flex-wrap gap-2">
                    {popularTags.map((tag) => (
                        <button key={tag} type="button" onClick={() => onSelect(tag)} className="rounded-full border bg-background px-3 py-1.5 text-sm hover:border-brand-purple hover:text-brand-purple">
                            {tag}
                        </button>
                    ))}
                </div>
            </div>
            <div className="border-t bg-muted/35 p-4">
                <p className="flex items-center gap-2 text-sm font-semibold"><Lightbulb className="size-4 text-amber-500" />이렇게 검색해보세요</p>
                <div className="mt-2 grid gap-1 sm:grid-cols-2">
                    {examples.map((example) => (
                        <button key={example} type="button" onClick={() => onSelect(example)} className="rounded-md px-2 py-1.5 text-left text-sm text-muted-foreground hover:bg-background hover:text-foreground">
                            “{example}”
                        </button>
                    ))}
                </div>
                <p className="mt-3 text-xs leading-5 text-muted-foreground">도구 이름뿐 아니라 원하는 작업이나 기능을 입력해도 관련 AI 도구를 찾을 수 있습니다. Enter를 누르면 전체 결과로 이동합니다.</p>
            </div>
        </div>
    );
}

export function Header() {
    const navigate = useNavigate();
    const location = useLocation();
    const [searchParams] = useSearchParams();
    const [query, setQuery] = useState(searchParams.get('q') || '');
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const searchAreaRef = useRef<HTMLDivElement>(null);
    const { user, signOut } = useAuth();

    // Rotating Placeholder Logic
    const [placeholderIndex, setPlaceholderIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setPlaceholderIndex((prev) => (prev + 1) % SEARCH_PLACEHOLDERS.length);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const update = window.setTimeout(() => setQuery(searchParams.get('q') || ''), 0);
        return () => window.clearTimeout(update);
    }, [searchParams]);

    useEffect(() => {
        const close = window.setTimeout(() => setIsMobileMenuOpen(false), 0);
        return () => window.clearTimeout(close);
    }, [location.pathname]);

    useEffect(() => {
        const closeSearch = (event: PointerEvent) => {
            if (searchAreaRef.current && !searchAreaRef.current.contains(event.target as Node)) setIsSearchOpen(false);
        };
        document.addEventListener('pointerdown', closeSearch);
        return () => document.removeEventListener('pointerdown', closeSearch);
    }, []);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setQuery(e.target.value);
        setIsSearchOpen(true);
    };

    const submitSearch = () => {
        const completedQuery = query.trim();
        setIsSearchOpen(false);
        navigate(completedQuery ? `/tools?q=${encodeURIComponent(completedQuery)}` : '/tools');
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            submitSearch();
        } else if (e.key === 'Escape') {
            setIsSearchOpen(false);
        }
    };

    const handleKeywordClick = (keyword: string) => {
        const term = keyword.replace('#', '');
        setQuery(term);
        setIsSearchOpen(false);
        navigate(`/tools?q=${encodeURIComponent(term)}`);
    };

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 min-w-0 items-center justify-between gap-2 px-4 sm:px-6">
                {/* Logo Section */}
                <Link to="/" className="flex items-center gap-2 shrink-0 md:mr-4">
                    <div className="size-8 rounded bg-brand-purple flex items-center justify-center text-white font-bold">
                        K
                    </div>
                    <span className="text-lg sm:text-xl font-tmon tracking-tight text-foreground block xl:block pt-1">
                        모두의 AI
                    </span>
                </Link>

                {/* Search Section (Row Layout) */}
                <div className="hidden min-w-0 flex-1 items-center md:flex">
                    {/* Search Input */}
                    <div ref={searchAreaRef} className="relative min-w-0 flex-1 2xl:max-w-lg">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground size-4" />
                        <Input
                            aria-expanded={isSearchOpen}
                            aria-controls="desktop-search-panel"
                            placeholder={SEARCH_PLACEHOLDERS[placeholderIndex]}
                            value={query}
                            onChange={handleSearch}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsSearchOpen(true)}
                            className="h-10 pl-10 rounded-full bg-muted/50 focus-visible:ring-brand-purple transition-all"
                        />
                        {isSearchOpen && (
                            <SearchPanel id="desktop-search-panel" popularTags={POPULAR_TAGS} examples={SEARCH_EXAMPLES} onSelect={handleKeywordClick} query={query} onSubmit={submitSearch} />
                        )}
                    </div>
                </div>

                {/* Right Section: Nav + Actions */}
                <div className="flex shrink-0 items-center gap-2 2xl:gap-4">
                    {/* Nav Links (Segmented Control Style) */}
                    <nav className="mr-1 hidden items-center rounded-lg border bg-muted/50 p-1 xl:flex 2xl:mr-4">
                        <Link
                            to="/tools"
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                location.pathname === '/tools' || location.pathname === '/'
                                    ? "bg-foreground text-background shadow-sm"
                                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                            )}
                        >
                            <Trophy className="size-3.5" />
                            랭킹
                        </Link>
                        <Link
                            to="/report"
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                location.pathname === '/report'
                                    ? "bg-foreground text-background shadow-sm"
                                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                            )}
                        >
                            <FileText className="size-3.5" />
                            리포트
                        </Link>
                        <Link
                            to="/submit"
                            className={cn(
                                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                location.pathname === '/submit'
                                    ? "bg-foreground text-background shadow-sm"
                                    : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                            )}
                        >
                            <PlusCircle className="size-3.5" />
                            도구 제보
                        </Link>
                        {user?.app_metadata?.role === 'admin' && (
                            <Link
                                to="/admin/dashboard"
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                                    location.pathname.startsWith('/admin')
                                        ? "bg-foreground text-background shadow-sm"
                                        : "text-muted-foreground hover:bg-background/50 hover:text-foreground"
                                )}
                            >
                                <Shield className="size-3.5" />
                                관리자
                            </Link>
                        )}
                    </nav>

                    <div className="flex items-center gap-2">
                        <ModeToggle />
                        {user ? (
                            <div className="flex items-center gap-2">
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="hidden max-w-36 items-center gap-2 2xl:flex"
                                    onClick={() => navigate('/mypage')}
                                >
                                    <User className="size-4" />
                                    <span className="truncate">{user.user_metadata.full_name || user.email?.split('@')[0]}</span>
                                </Button>
                                <Button variant="ghost" size="icon" onClick={signOut} title="로그아웃">
                                    <LogOut className="size-4" />
                                </Button>
                            </div>
                        ) : (
                            <Button variant="brand" size="sm" className="hidden 2xl:flex" onClick={() => navigate('/login')}>
                                로그인
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            size="icon"
                            className="xl:hidden"
                            onClick={() => setIsMobileMenuOpen((open) => !open)}
                            aria-label={isMobileMenuOpen ? '메뉴 닫기' : '메뉴 열기'}
                            aria-expanded={isMobileMenuOpen}
                        >
                            {isMobileMenuOpen ? <X className="size-5" /> : <Menu className="size-5" />}
                        </Button>
                    </div>
                </div>
            </div>

            {isMobileMenuOpen && (
                <div className="xl:hidden border-t bg-background px-4 py-4 shadow-lg">
                    <div className="relative mb-4 md:hidden">
                        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                        <Input
                            aria-label="AI 도구 검색"
                            placeholder="필요한 AI 도구 검색"
                            value={query}
                            onChange={handleSearch}
                            onKeyDown={handleKeyDown}
                            onFocus={() => setIsSearchOpen(true)}
                            className="h-11 pl-10"
                        />
                        {isSearchOpen && (
                            <SearchPanel id="mobile-search-panel" popularTags={POPULAR_TAGS} examples={SEARCH_EXAMPLES} onSelect={handleKeywordClick} query={query} onSubmit={submitSearch} />
                        )}
                    </div>
                    <nav className="grid gap-1">
                        <Link to="/tools" className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                            <Trophy className="size-4" /> AI 도구 랭킹
                        </Link>
                        <Link to="/report" className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                            <FileText className="size-4" /> 리포트
                        </Link>
                        <Link to="/submit" className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                            <PlusCircle className="size-4" /> AI 도구 제보
                        </Link>
                        {user?.app_metadata?.role === 'admin' && (
                            <Link to="/admin/dashboard" className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                                <Shield className="size-4" /> 관리자
                            </Link>
                        )}
                        {user ? (
                            <>
                                <Link to="/mypage" className="flex min-h-11 items-center gap-3 rounded-lg px-3 py-2 hover:bg-muted">
                                    <User className="size-4" /> 마이페이지
                                </Link>
                                <button onClick={signOut} className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 py-2 text-left hover:bg-muted">
                                    <LogOut className="size-4" /> 로그아웃
                                </button>
                            </>
                        ) : (
                            <Link to="/login" className="flex min-h-11 items-center gap-3 rounded-lg bg-brand-purple px-3 py-2 text-white">
                                <User className="size-4" /> 로그인
                            </Link>
                        )}
                    </nav>
                </div>
            )}
        </header>
    );
}
