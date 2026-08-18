import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, MinusCircle, PlusCircle, Star } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';

type Source = Database['public']['Tables']['external_review_sources']['Row'];
type ExternalReview = Database['public']['Tables']['external_reviews']['Row'];

const providerLabels: Record<Source['provider'], string> = { trustpilot: 'Trustpilot', g2: 'G2', product_hunt: 'Product Hunt', app_store: 'Apple App Store', google_play: 'Google Play', other: '외부 리뷰' };

export function ExternalReviewsSection({ toolId }: { toolId: string }) {
  const query = useQuery({
    queryKey: ['external-reviews', toolId],
    queryFn: async () => {
      const { data: sources, error } = await supabase.from('external_review_sources').select('*').eq('tool_id', toolId).eq('is_active', true).order('review_count', { ascending: false });
      if (error) throw error;
      if (!sources?.length) return { sources: [] as Source[], reviews: [] as ExternalReview[] };
      const { data: reviews, error: reviewError } = await supabase.from('external_reviews').select('*').in('source_id', sources.map(source => source.id)).eq('is_featured', true).order('published_at', { ascending: false }).limit(6);
      if (reviewError) throw reviewError;
      return { sources, reviews: reviews ?? [] };
    },
    staleTime: 15 * 60 * 1000,
  });

  if (query.isLoading) return <section><h2 className="mb-4 text-2xl font-bold">외부 사용자 평가</h2><div className="h-56 animate-pulse rounded-xl bg-muted" /></section>;
  if (!query.data?.sources.length) return null;
  const { sources, reviews } = query.data;
  const primary = sources[0];
  const sourceReviews = reviews.filter(review => review.source_id === primary.id);

  return <section>
    <div className="mb-4"><h2 className="text-2xl font-bold">외부 사용자 평가</h2><p className="mt-1 text-sm text-muted-foreground">외부 플랫폼의 평가를 출처별로 분석한 정보이며 모두AI 사용자 리뷰와 별개입니다.</p></div>
    <div className="overflow-hidden rounded-xl border bg-card/50">
      <div className="grid gap-5 border-b p-5 sm:grid-cols-[180px_1fr] sm:p-6">
        <div className="flex flex-col justify-center rounded-xl bg-muted/60 p-4 text-center"><span className="text-sm font-semibold text-muted-foreground">{providerLabels[primary.provider]}</span><div className="mt-2 flex items-center justify-center gap-2"><Star className="size-6 fill-yellow-400 text-yellow-400" /><strong className="text-3xl">{primary.average_rating?.toFixed(1) ?? '-'}</strong><span className="text-muted-foreground">/ {primary.rating_scale}</span></div><span className="mt-2 text-xs text-muted-foreground">리뷰 {(primary.review_count ?? 0).toLocaleString('ko-KR')}개</span></div>
        <div><h3 className="font-semibold">평가 데이터 분석</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{primary.analysis_summary ?? '분석 요약을 준비하고 있습니다.'}</p>{primary.analysis_sample_size != null && <p className="mt-2 text-xs text-muted-foreground">분석 표본: 리뷰 {primary.analysis_sample_size.toLocaleString('ko-KR')}개 · {primary.analyzed_at ? `${new Date(primary.analyzed_at).toLocaleDateString('ko-KR')} 분석` : '분석일 미등록'}</p>}</div>
      </div>
      {(primary.pros_summary.length > 0 || primary.cons_summary.length > 0) && <div className="grid gap-4 border-b p-5 sm:grid-cols-2 sm:p-6"><SummaryList title="사용자가 많이 언급한 장점" items={primary.pros_summary} positive /><SummaryList title="사용자가 많이 언급한 단점" items={primary.cons_summary} /></div>}
      {sourceReviews.length > 0 && <div className="border-b p-5 sm:p-6"><h3 className="mb-3 font-semibold">대표 외부 리뷰</h3><div className="grid gap-3">{sourceReviews.slice(0, 3).map(review => <article key={review.id} className="rounded-lg border bg-background p-4"><div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span className="font-semibold text-foreground">{review.reviewer_name || '외부 사용자'}</span>{review.rating != null && <Badge variant="outline"><Star className="mr-1 size-3 fill-yellow-400 text-yellow-400" />{review.rating}</Badge>}{review.is_verified && <span className="flex items-center gap-1"><CheckCircle2 className="size-3 text-emerald-500" />출처 인증 리뷰</span>}{review.published_at && <time>{new Date(review.published_at).toLocaleDateString('ko-KR')}</time>}</div>{review.title && <p className="mt-2 text-sm font-semibold">{review.title}</p>}{review.excerpt && <p className="mt-2 text-sm leading-6 text-muted-foreground">{review.excerpt}</p>}{review.review_url && <a href={review.review_url} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-1 text-xs font-semibold text-brand-purple hover:underline">원문 확인 <ExternalLink className="size-3" /></a>}</article>)}</div></div>}
      <div className="p-5 sm:p-6"><h3 className="text-sm font-semibold">출처</h3><div className="mt-2 flex flex-wrap gap-2">{sources.map(source => <a key={source.id} href={source.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs hover:border-brand-purple">{source.source_name} <ExternalLink className="size-3" /></a>)}</div><p className="mt-3 text-xs leading-5 text-muted-foreground">평점과 리뷰는 각 외부 플랫폼에 귀속됩니다. 원문 수정·삭제에 맞춰 주기적으로 갱신하며, 최종 갱신일은 {primary.synced_at ? new Date(primary.synced_at).toLocaleString('ko-KR') : '확인 중'}입니다.</p></div>
    </div>
  </section>;
}

function SummaryList({ title, items, positive = false }: { title: string; items: string[]; positive?: boolean }) {
  const Icon = positive ? PlusCircle : MinusCircle;
  return <div className={`rounded-xl p-4 ${positive ? 'bg-emerald-500/10' : 'bg-orange-500/10'}`}><h3 className="flex items-center gap-2 text-sm font-semibold"><Icon className={`size-4 ${positive ? 'text-emerald-500' : 'text-orange-500'}`} />{title}</h3><ul className="mt-3 space-y-2">{items.map(item => <li key={item} className="text-sm leading-5 text-muted-foreground">• {item}</li>)}</ul></div>;
}
