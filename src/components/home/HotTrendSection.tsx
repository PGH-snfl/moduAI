import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Sparkles, ArrowRight } from 'lucide-react';
import { useFeaturedPromotion, recordHomeContentClick } from '@/hooks/useHomeContent';
import type { FeaturedPromotion } from '@/hooks/useHomeContent';

function youtubeId(url: string) {
    try {
        const parsed = new URL(url);
        if (parsed.hostname === 'youtu.be') return parsed.pathname.split('/').filter(Boolean)[0] ?? null;
        if (parsed.hostname.endsWith('youtube.com')) {
            if (parsed.pathname === '/watch') return parsed.searchParams.get('v');
            const parts = parsed.pathname.split('/').filter(Boolean);
            if (['embed', 'shorts', 'live'].includes(parts[0])) return parts[1] ?? null;
        }
    } catch {
        return null;
    }
    return null;
}

function PromotionMedia({ promotion }: { promotion: FeaturedPromotion }) {
    const [playing, setPlaying] = useState(false);
    const id = promotion.video_type === 'youtube' && promotion.video_url ? youtubeId(promotion.video_url) : null;
    const thumbnail = promotion.media_url || (id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : null);

    if (playing && id) {
        return <iframe className="absolute inset-0 h-full w-full" src={`https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`} title={`${promotion.headline} 소개 영상`} allow="autoplay; encrypted-media; picture-in-picture" referrerPolicy="strict-origin-when-cross-origin" allowFullScreen />;
    }
    if (playing && promotion.video_type === 'direct' && promotion.video_url) {
        return <video className="absolute inset-0 h-full w-full bg-black object-contain" src={promotion.video_url} controls autoPlay playsInline />;
    }

    return <>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/60 to-purple-900/60" />
        {thumbnail && <img src={thumbnail} alt="" className="absolute inset-0 h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-105" />}
        {promotion.is_sponsored && <div className="absolute left-6 top-6 rounded-full border border-white/10 bg-black/80 px-3 py-1 text-xs font-bold text-white backdrop-blur">Sponsored</div>}
        {promotion.video_url ? <button type="button" onClick={() => setPlaying(true)} aria-label={`${promotion.headline} 소개 영상 재생`} className="absolute inset-0 flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-inset">
            <span className="flex size-16 items-center justify-center rounded-full border border-white/40 bg-black/55 text-white shadow-xl backdrop-blur-sm transition-transform group-hover:scale-110"><Play className="ml-1 size-8 fill-current" /></span>
        </button> : <a href={promotion.destination_url} onClick={() => recordHomeContentClick('promotion', promotion.id)} target="_blank" rel="noopener noreferrer sponsored" aria-label={`${promotion.headline} 열기`} className="absolute inset-0" />}
    </>;
}

export function HotTrendSection() {
    const { data: promotion, isLoading } = useFeaturedPromotion();
    if (isLoading) return <section className="container mx-auto px-4 py-12"><div className="h-[400px] animate-pulse rounded-2xl bg-muted" /></section>;
    if (!promotion) return null;
    return <section className="container mx-auto px-4 py-12">
        <div className="mb-6 flex items-center gap-2"><Sparkles className="size-6 text-brand-purple" /><h2 className="text-2xl font-jalnan">유용한 인공지능 서비스를 소개합니다</h2></div>
        <div className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl">
            <div className="grid gap-0 md:grid-cols-2">
                <div className="group relative aspect-video cursor-pointer overflow-hidden bg-black md:aspect-auto md:h-[400px]"><PromotionMedia key={promotion.id} promotion={promotion} /></div>
                <div className="flex flex-col justify-center bg-slate-900/50 p-8 backdrop-blur-md"><div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-brand-purple"><span className="size-2 rounded-full bg-brand-purple" />{promotion.eyebrow}</div>
                    <h3 className="text-3xl font-tmon leading-tight text-white"><span className="bg-gradient-to-r from-brand-purple to-pink-500 bg-clip-text text-transparent">{promotion.headline}</span></h3>
                    <p className="text-lg leading-relaxed text-slate-400 font-arita">{promotion.description}</p>
                    <div className="flex items-center gap-4 pt-4"><Button asChild size="lg" className="gap-2 rounded-full bg-white font-bold text-black hover:bg-slate-200"><a href={promotion.destination_url} onClick={() => recordHomeContentClick('promotion', promotion.id)} target="_blank" rel="noopener noreferrer sponsored">{promotion.button_text} <ArrowRight className="size-4" /></a></Button><div className="text-sm font-medium text-slate-500">{new URL(promotion.destination_url).hostname}</div></div>
                </div></div>
            </div>
        </div>
    </section>;
}
