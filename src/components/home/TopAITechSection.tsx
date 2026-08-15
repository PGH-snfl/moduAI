import { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowUpRight, BookOpen, Box, Brain, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, ExternalLink, MessageSquareText, Microscope, Share2, X } from 'lucide-react';
import { useTechnologyTrends, recordHomeContentClick, type TechnologyTrend } from '@/hooks/useHomeContent';

const icons = [Brain, Microscope, Share2, Box, MessageSquareText];
const colors = ['text-purple-500', 'text-blue-500', 'text-green-500', 'text-yellow-600', 'text-indigo-500'];

type PaperPreview = {
    title?: string;
    url?: string;
    source?: string | null;
    confidence_score?: number;
    cited_by_count?: number;
    published_at?: string;
    type?: string;
};

function papersFrom(value: unknown): PaperPreview[] {
    if (!Array.isArray(value)) return [];
    return (value.filter(item => Boolean(item) && typeof item === 'object') as PaperPreview[]).sort((a, b) => (b.published_at ?? '').localeCompare(a.published_at ?? ''));
}

export function TopAITechSection() {
    const { data: trends = [], isLoading } = useTechnologyTrends();
    const [selected, setSelected] = useState<TechnologyTrend | null>(null);
    const [page, setPage] = useState(0);
    const pageSize = 5;
    const pageCount = Math.max(1, Math.ceil(trends.length / pageSize));
    const currentPage = Math.min(page, pageCount - 1);
    const visibleTrends = trends.slice(currentPage * pageSize, (currentPage + 1) * pageSize);

    const openDetails = (trend: TechnologyTrend) => {
        setSelected(trend);
        recordHomeContentClick('trend', trend.id);
    };

    return (
        <section className="container mx-auto px-4 pb-20">
            <div className="mb-8 flex flex-col items-center text-center">
                <Badge variant="outline" className="mb-2 border-brand-purple px-3 py-1 text-brand-purple">Global AI Trends</Badge>
                <h2 className="mb-2 text-3xl font-jalnan text-slate-900 dark:text-white">주목받는 인공지능 기술</h2>
                <p className="font-arita text-lg text-muted-foreground">논문과 공식 출처를 바탕으로 관리되는 AI 기술 동향입니다.</p>
            </div>

            <div className="relative">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                    {isLoading && [0, 1, 2, 3, 4].map(value => <div key={value} className="h-56 animate-pulse rounded-xl bg-muted" />)}
                    {visibleTrends.map((trend, index) => {
                    const globalIndex = currentPage * pageSize + index;
                    const Icon = icons[globalIndex % icons.length];
                    const latestPaper = papersFrom(trend.representative_papers)[0];
                    return (
                        <button key={trend.id} type="button" onClick={() => openDetails(trend)} className="group flex min-h-56 flex-col rounded-xl border border-purple-200 bg-card p-4 text-left text-card-foreground shadow-sm transition-all hover:-translate-y-1 hover:border-brand-purple/60 hover:shadow-lg dark:border-purple-800">
                            <div className="flex items-start justify-between gap-3">
                                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand-purple/10"><Icon className={`size-4 ${colors[globalIndex % colors.length]}`} /></span>
                                <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-brand-purple" />
                            </div>
                            <p className={`mt-4 text-xs font-semibold ${colors[globalIndex % colors.length]}`}>{trend.topic_name}</p>
                            <h3 className="mt-1 truncate text-base font-bold">{trend.short_name}</h3>
                            <div className="mt-3 rounded-lg bg-muted/60 p-3"><p className="flex items-center gap-1 text-[11px] font-medium text-muted-foreground"><CalendarDays className="size-3" />최신 논문 {latestPaper?.published_at ?? '정보 없음'}</p><p className="mt-1 line-clamp-2 text-xs font-medium leading-5">{latestPaper?.title ?? '대표 논문 정보 준비 중'}</p></div>
                            <div className="mt-auto flex items-end justify-between gap-3 border-t pt-3">
                                <div><p className="text-[11px] text-muted-foreground">검증 논문</p><p className="font-bold">{trend.paper_count_7d}편</p></div>
                                <span className="text-xs font-medium text-brand-purple">자세히 보기</span>
                            </div>
                        </button>
                    );
                    })}
                </div>
                {trends.length > pageSize && <><Button type="button" size="icon" variant="secondary" aria-label="이전 기술 콘텐츠" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="absolute left-2 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full shadow-lg sm:-left-5"><ChevronLeft className="size-5" /></Button><Button type="button" size="icon" variant="secondary" aria-label="다음 기술 콘텐츠" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)} className="absolute right-2 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full shadow-lg sm:-right-5"><ChevronRight className="size-5" /></Button></>}
            </div>
            {trends.length > pageSize && <p className="mt-3 text-right text-sm font-medium text-muted-foreground">{currentPage + 1} / {pageCount}</p>}

            <Dialog.Root open={Boolean(selected)} onOpenChange={open => { if (!open) setSelected(null); }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-2xl sm:p-7">
                        {selected && <TrendDetails trend={selected} />}
                        <Dialog.Close asChild><Button size="icon" variant="ghost" className="absolute right-3 top-3" aria-label="닫기"><X className="size-5" /></Button></Dialog.Close>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
        </section>
    );
}

function TrendDetails({ trend }: { trend: TechnologyTrend }) {
    const papers = papersFrom(trend.representative_papers);
    const [showAll, setShowAll] = useState(false);
    const visiblePapers = showAll ? papers : papers.slice(0, 3);
    const remainingExternalCount = Math.max(0, trend.paper_count_7d - papers.length);
    return <>
        <Dialog.Title className="pr-10 text-2xl font-bold">{trend.topic_name}</Dialog.Title>

        <div className="mt-5">
            <h4 className="flex items-center gap-2 font-semibold"><BookOpen className="size-4" />최신 논문</h4>
            <div className="mt-3 grid gap-3">
                {visiblePapers.map((paper, index) => <a key={`${paper.url ?? paper.title ?? index}`} href={paper.url} target="_blank" rel="noreferrer" className="rounded-xl border p-4 transition-colors hover:border-brand-purple/60 hover:bg-muted/40"><div className="flex items-start justify-between gap-3"><p className="font-medium leading-6">{paper.title ?? '제목 정보 없음'}</p><ExternalLink className="mt-1 size-4 shrink-0 text-muted-foreground" /></div><div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground"><span>{paper.source ?? '출처 정보 없음'}</span>{paper.type && <span>· {paper.type === 'preprint' ? '프리프린트' : '학술 논문'}</span>}{paper.published_at && <span>· {paper.published_at}</span>}{paper.confidence_score && <Badge variant="outline">신뢰도 {paper.confidence_score}점</Badge>}<Badge variant="outline">인용 {paper.cited_by_count ?? 0}회</Badge></div></a>)}
                {papers.length === 0 && <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">등록된 대표 논문이 없습니다.</p>}
                {papers.length > 3 && <Button type="button" variant="ghost" className="w-full gap-2" onClick={() => setShowAll(value => !value)}>{showAll ? <><ChevronUp className="size-4" />논문 목록 접기</> : <><ChevronDown className="size-4" />최신 논문 {papers.length - 3}편 더보기</>}</Button>}
                {showAll && remainingExternalCount > 0 && <Button asChild variant="outline" className="w-full gap-2"><a href={trend.source_url} target="_blank" rel="noreferrer">나머지 {remainingExternalCount}편 OpenAlex에서 보기<ExternalLink className="size-4" /></a></Button>}
            </div>
        </div>

        <div className="mt-5 rounded-xl bg-muted/60 p-4"><p className="text-xs font-medium text-muted-foreground">검증된 최근 논문 {trend.paper_count_7d}편</p><Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">{trend.summary}</Dialog.Description></div>

        <div className="mt-6 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between"><p className="text-xs text-muted-foreground">출처: {trend.source_label}</p><Button asChild><a href={trend.source_url} target="_blank" rel="noreferrer" className="gap-2">전체 출처 확인<ExternalLink className="size-4" /></a></Button></div>
    </>;
}
