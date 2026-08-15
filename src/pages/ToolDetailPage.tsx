import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, ExternalLink, Share2, Check } from 'lucide-react';
import { useState } from 'react';
import { ReviewsList } from '@/components/reviews/ReviewsList';
import { FavoriteButton } from '@/components/tools/FavoriteButton';
import { Helmet, HelmetProvider } from 'react-helmet-async';
import { useTrafficTracking } from '@/hooks/useTrafficTracking';

import type { Database } from '@/types/supabase';

export function ToolDetailPage() {
    const { id } = useParams<{ id: string }>();
    const [copied, setCopied] = useState(false);
    const { trackToolClick } = useTrafficTracking();

    const handleShare = async () => {
        const shareData = { title: `${tool?.name ?? 'AI 도구'} - 모두의 AI`, text: tool?.description, url: window.location.href };
        try {
            if (navigator.share) await navigator.share(shareData);
            else {
                await navigator.clipboard.writeText(window.location.href);
                setCopied(true);
                window.setTimeout(() => setCopied(false), 2000);
            }
        } catch (error) {
            if ((error as DOMException).name !== 'AbortError') console.error('공유에 실패했습니다.', error);
        }
    };

    // ... 

    const { data: tool, isLoading, error } = useQuery({
        queryKey: ['tool', id],
        queryFn: async () => {
            if (!id) return null;
            const { data, error } = await supabase.from('tools').select('*').eq('id', id).single();
            if (error) throw error;
            return data as Database['public']['Tables']['tools']['Row'];
        },
        enabled: !!id
    });

    if (isLoading) return <div className="py-20 text-center">Loading...</div>;
    if (error || !tool) return <div className="py-20 text-center">Tool not found.</div>;

    // Schema Markup (JSON-LD)
    const schemaData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": tool.name,
        "applicationCategory": "BusinessApplication", // or specific category mapping
        "operatingSystem": "Web",
        "description": tool.full_description || tool.description,
        "offers": {
            "@type": "Offer",
            "price": tool.pricing_start_at === '무료' ? "0" : tool.pricing_start_at || "0"
        }
    };

    if (tool.review_count > 0) {
        Object.assign(schemaData, {
            aggregateRating: {
                "@type": "AggregateRating",
                "ratingValue": tool.average_rating,
                "reviewCount": tool.review_count
            }
        });
    }

    return (
        <HelmetProvider>
            <div className="container py-10 md:py-20">
                <Helmet>
                    <title>{tool.name} - 모두의 AI</title>
                    <meta name="description" content={tool.description} />
                    <meta property="og:title" content={`${tool.name} 리뷰 및 사용법`} />
                    <meta property="og:description" content={tool.description} />
                    {tool.logo_url && <meta property="og:image" content={tool.logo_url} />}
                    <script type="application/ld+json">
                        {JSON.stringify(schemaData)}
                    </script>
                </Helmet>

                {/* Header Section */}
                <div className="flex flex-col md:flex-row gap-8 items-start mb-12">
                    <div className="size-32 rounded-2xl border bg-card flex items-center justify-center p-2 shadow-sm shrink-0">
                        {tool.logo_url ? <img src={tool.logo_url} alt={tool.name} className="size-full object-contain rounded-xl" /> : <div className="text-4xl font-bold">{tool.name[0]}</div>}
                    </div>

                    <div className="flex-1 space-y-4">
                        <div className="flex items-center gap-3 flex-wrap">
                            <h1 className="text-3xl md:text-4xl font-bold">{tool.name}</h1>
                            <Badge variant={tool.pricing_type === 'Free' ? 'secondary' : 'default'} className="text-sm">
                                {tool.pricing_type}
                            </Badge>
                            {tool.korean_support_level !== 'None' && (
                                <Badge variant="outline" className="text-brand-purple border-brand-purple bg-brand-purple/10">
                                    한국어 {tool.korean_support_level}
                                </Badge>
                            )}
                        </div>

                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            {tool.review_count > 0 && (
                                <div className="flex items-center gap-1 text-yellow-500">
                                    <Star className="size-4 fill-current" />
                                    <span className="font-bold text-foreground">{tool.average_rating}</span>
                                    <span>({tool.review_count}개 리뷰)</span>
                                </div>
                            )}
                            <span>정보 검증: {tool.is_verified ? '완료' : '확인 중'}</span>
                        </div>

                        <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
                            {tool.full_description || tool.description}
                        </p>

                        <div className="flex flex-wrap gap-3 pt-2">
                            {tool.url ? <a href={tool.url} target="_blank" rel="noopener noreferrer" onClick={() => trackToolClick(tool.id, tool.name)}>
                                <Button size="lg" className="gap-2">
                                    웹사이트 방문하기 <ExternalLink className="size-4" />
                                </Button>
                            </a> : <Button size="lg" disabled>웹사이트 정보 없음</Button>}
                            <FavoriteButton toolId={tool.id} />
                            <Button variant="outline" size="lg" className="gap-2" onClick={handleShare}>
                                {copied ? <Check className="size-4" /> : <Share2 className="size-4" />}
                                {copied ? '링크 복사됨' : '공유하기'}
                            </Button>
                        </div>
                    </div>
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 border-t pt-10">
                    {/* Left: Main Content */}
                    <div className="md:col-span-2 space-y-10">
                        <section>
                            <h2 className="text-2xl font-bold mb-4">상세 기능</h2>
                            <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                {tool.key_benefits?.map((benefit) => (
                                    <li key={benefit}>{benefit}</li>
                                ))}
                            </ul>
                        </section>

                        {tool.best_for && tool.best_for.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold mb-4">이런 분께 추천해요</h2>
                                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                    {tool.best_for.map(item => <li key={item}>{item}</li>)}
                                </ul>
                            </section>
                        )}

                        {tool.limitations && tool.limitations.length > 0 && (
                            <section>
                                <h2 className="text-2xl font-bold mb-4">사용 전 확인하세요</h2>
                                <ul className="list-disc pl-5 space-y-2 text-muted-foreground">
                                    {tool.limitations.map(item => <li key={item}>{item}</li>)}
                                </ul>
                            </section>
                        )}

                        <section>
                            <h2 className="text-2xl font-bold mb-4">사용자 리뷰</h2>
                            <div className="border rounded-xl p-6 bg-card/50">
                                <ReviewsList toolId={tool.id} />
                            </div>
                        </section>
                    </div>

                    {/* Right: Sidebar Info */}
                    <div className="space-y-8">
                        <div className="rounded-xl border bg-card p-6 space-y-4">
                            <h3 className="font-semibold text-lg">가격 정보</h3>
                            <div className="text-xl font-bold">{tool.pricing_summary || tool.pricing_start_at || '가격 확인 필요'}</div>
                            {tool.pricing_details && (
                                <ul className="space-y-2 text-sm text-muted-foreground">
                                    {tool.pricing_details.map((detail) => <li key={detail}>• {detail}</li>)}
                                </ul>
                            )}
                            {tool.pricing_verified_at && (
                                <p className="text-xs text-muted-foreground">가격 확인일: {new Date(tool.pricing_verified_at).toLocaleDateString('ko-KR')}</p>
                            )}
                            {tool.pricing_url && (
                                <Button asChild className="w-full" variant="secondary">
                                    <a href={tool.pricing_url} target="_blank" rel="noopener noreferrer">공식 가격·결제 안내</a>
                                </Button>
                            )}
                        </div>
                        {tool.verification_sources && tool.verification_sources.length > 0 && (
                            <div className="rounded-xl border bg-card p-6 space-y-3">
                                <h3 className="font-semibold text-lg">검증 정보</h3>
                                {tool.verified_at && <p className="text-xs text-muted-foreground">최종 검증일: {new Date(tool.verified_at).toLocaleDateString('ko-KR')}</p>}
                                <div className="space-y-2">
                                    {tool.verification_sources.map((source, index) => (
                                        <a key={source} href={source} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-sm text-brand-purple hover:underline">
                                            공식 출처 {index + 1} <ExternalLink className="size-3" />
                                        </a>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </HelmetProvider>
    );
}
