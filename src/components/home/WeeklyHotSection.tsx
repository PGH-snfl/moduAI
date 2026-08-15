import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CalendarDays, ChevronLeft, ChevronRight, Play, Heart, MessageCircle, Youtube, Instagram, Music2 } from 'lucide-react';
import { useFeaturedWorks, recordHomeContentClick } from '@/hooks/useHomeContent';

const platformMeta = {
    YouTube: { icon: Youtube, color: 'text-red-600' },
    Instagram: { icon: Instagram, color: 'text-pink-600' },
    TikTok: { icon: Music2, color: 'text-black dark:text-white' },
    Other: { icon: Play, color: 'text-brand-purple' },
};

const compactCount = (value: number | null) => value === null ? '집계 전' : new Intl.NumberFormat('en', { notation: 'compact', maximumFractionDigits: 1 }).format(value);
const uploadDate = (value: string | null) => value ? new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' }).format(new Date(value)) : null;

export function WeeklyHotSection() {
    const { data: works = [], isLoading } = useFeaturedWorks();
    const [page, setPage] = useState(0);
    const pageSize = 3;
    const pageCount = Math.max(1, Math.ceil(works.length / pageSize));
    const currentPage = Math.min(page, pageCount - 1);
    const visibleWorks = works.slice(currentPage * pageSize, (currentPage + 1) * pageSize);
    return (
        <section className="container mx-auto px-4 py-8">
            <div className="flex items-center gap-2 mb-6">
                <div className="size-2 rounded-full bg-red-500 animate-ping" />
                <h2 className="text-2xl font-jalnan">지난주 가장 핫했던 AI 작업물</h2>
            </div>

            <div className="relative">
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    {isLoading && [0,1,2].map(value => <div key={value} className="h-96 animate-pulse rounded-2xl bg-muted" />)}
                    {visibleWorks.map((work) => {
                    const meta = platformMeta[work.platform];
                    const PlatformIcon = meta.icon;
                    const publishedDate = uploadDate(work.published_at);
                    return (
                    <a
                        key={work.id}
                        href={work.content_url}
                        onClick={() => recordHomeContentClick('work', work.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 block"
                    >
                        {/* Thumbnail */}
                        <div className="relative aspect-[9/16] md:aspect-[4/3] overflow-hidden">
                            <img
                                src={work.thumbnail_url}
                                alt={work.title}
                                className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                            {/* Platform Badge */}
                            <div className="absolute top-4 left-4">
                                <div className="bg-white/90 backdrop-blur px-3 py-1 rounded-full flex items-center gap-1.5 shadow-sm">
                                    <PlatformIcon className={`size-4 ${meta.color}`} />
                                    <span className="text-xs font-bold text-slate-900">{work.platform}</span>
                                </div>
                            </div>

                            {/* Play Button */}
                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                <div className="size-16 rounded-full bg-white/20 backdrop-blur flex items-center justify-center border border-white/40">
                                    <Play className="size-8 text-white fill-white ml-1" />
                                </div>
                            </div>

                            {/* Metrics Overlay */}
                            <div className="absolute bottom-4 right-4 flex flex-col items-end text-white">
                                <Badge variant="secondary" className="mb-2 bg-red-600 text-white border-0 hover:bg-red-700">
                                    HOT 🔥
                                </Badge>
                                <span className="font-bold text-lg shadow-black/50 drop-shadow-md">{compactCount(work.view_count)} views</span>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-5">
                            <h3 className="font-bold text-lg mb-1 line-clamp-1 group-hover:text-brand-purple transition-colors">
                                {work.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-1">
                                {work.description}
                            </p>
                            {publishedDate && <p className="mb-4 flex items-center gap-1.5 text-xs font-medium text-muted-foreground"><CalendarDays className="size-3.5" />업로드 {publishedDate}</p>}

                            <div className="flex min-w-0 items-center justify-between gap-3 border-t border-slate-100 pt-4 dark:border-slate-800">
                                <span className="flex min-w-0 items-center gap-2 text-sm font-semibold">
                                    <span className="size-6 shrink-0 rounded-full bg-slate-200 dark:bg-slate-700" />
                                    <span className="truncate">{work.creator_name}</span>
                                </span>
                                <div className="flex shrink-0 gap-2 text-xs text-slate-400 lg:gap-3">
                                    {work.like_count !== null && <span className="flex items-center gap-1"><Heart className="size-3.5" />{compactCount(work.like_count)}</span>}
                                    {work.comment_count !== null && <span className="flex items-center gap-1"><MessageCircle className="size-3.5" />{compactCount(work.comment_count)}</span>}
                                </div>
                            </div>
                        </div>
                    </a>
                    )})}
                </div>
                {works.length > pageSize && <><Button type="button" size="icon" variant="secondary" aria-label="이전 작업물" disabled={currentPage === 0} onClick={() => setPage(currentPage - 1)} className="absolute left-2 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full shadow-lg sm:-left-5"><ChevronLeft className="size-5" /></Button><Button type="button" size="icon" variant="secondary" aria-label="다음 작업물" disabled={currentPage >= pageCount - 1} onClick={() => setPage(currentPage + 1)} className="absolute right-2 top-1/2 z-10 size-11 -translate-y-1/2 rounded-full shadow-lg sm:-right-5"><ChevronRight className="size-5" /></Button></>}
            </div>
            {works.length > pageSize && <p className="mt-3 text-right text-sm font-medium text-muted-foreground">{currentPage + 1} / {pageCount}</p>}
        </section>
    );
}
