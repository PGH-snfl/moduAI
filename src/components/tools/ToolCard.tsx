import { Star, ExternalLink, Globe, Code, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LazyImage } from '@/components/ui/LazyImage';
import type { ToolWithTags as BaseTool } from '@/hooks/useTools';

type Tool = BaseTool & {
    tool_categories?: { categories: { name: string } }[]; // Joined data structure
    korean_support_level?: string; // Ensure this is typed if missing in base
}

interface ToolCardProps {
    tool: Tool;
    onClick?: () => void;
}

import { useAnalytics } from '@/hooks/useAnalytics';
import { FavoriteButton } from './FavoriteButton';

export function ToolCard({ tool, ...props }: ToolCardProps) {
    const { trackEvent } = useAnalytics();

    const paidPrice = [tool.pricing_summary, ...(tool.pricing_details || [])]
        .join(' ')
        .match(/\$(?!0(?:\D|$))\d+(?:\.\d+)?/)?.[0];

    const pricingLabel = tool.pricing_type === 'Free'
        ? '무료'
        : tool.pricing_type === 'Freemium'
            ? '부분 무료'
            : tool.pricing_type === 'Paid'
                ? '유료'
                : '가격 문의';

    const pricingText = tool.pricing_type === 'Free'
        ? '무료 이용 가능'
        : tool.pricing_type === 'Contact'
            ? '공식 사이트에서 가격 문의'
            : tool.pricing_type === 'Freemium'
                ? paidPrice ? `무료 플랜 · 유료 ${paidPrice}부터` : '무료 플랜 · 유료 플랜 제공'
                : tool.pricing_start_at ? `${tool.pricing_start_at}부터` : paidPrice ? `${paidPrice}부터` : '가격 확인 필요';

    const handleVisit = (e: React.MouseEvent) => {
        e.stopPropagation();
        trackEvent('Outbound', 'Visit Tool', `${tool.name} - ${tool.url}`);
    };

    return (
        <div
            onClick={props.onClick}
            className="group relative flex flex-col justify-between overflow-hidden rounded-xl border bg-card p-4 sm:p-5 transition-all duration-300 ease-out hover:shadow-lg hover:border-brand-purple/50 md:hover:scale-[1.03] cursor-pointer"
        >
            <div>
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        {/* Logo Placeholder or Image with Lazy Loading */}
                        <div className="size-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
                            {tool.logo_url ? (
                                <LazyImage
                                    src={tool.logo_url}
                                    alt={tool.name}
                                    className="size-full"
                                    placeholder={
                                        <div className="size-full bg-muted animate-pulse" />
                                    }
                                    fallback={
                                        <span className="text-xl font-bold text-muted-foreground">
                                            {tool.name[0]}
                                        </span>
                                    }
                                />
                            ) : (
                                <span className="text-xl font-bold text-muted-foreground">{tool.name[0]}</span>
                            )}
                        </div>
                        <div>
                            {/* Changed Link to div/span to avoid navigation, utilizing the parent onClick */}
                            <h3 className="font-bold text-lg leading-tight group-hover:text-brand-purple transition-colors">
                                {tool.name}
                            </h3>
                            {tool.review_count > 0 ? (
                                <div className="flex items-center gap-1 text-yellow-500 text-xs mt-1">
                                    <Star className="size-3 fill-current" />
                                    <span className="font-medium">{tool.average_rating}</span>
                                    <span className="text-muted-foreground">({tool.review_count})</span>
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground mt-1">새로 등록됨</div>
                            )}
                        </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                        <FavoriteButton toolId={tool.id} compact className="size-8 rounded-full bg-background/90" />
                    </div>
                </div>

                <p className="mb-5 truncate text-sm text-muted-foreground" title={tool.description?.split('#')[0].trim()}>
                    {tool.description?.split('#')[0].trim()}
                </p>

                <div className="mb-4 flex flex-wrap gap-1.5">
                    {tool.is_verified && (
                        <Badge variant="outline" className="border-blue-500/40 bg-blue-500/5 text-xs text-blue-600">
                            <CheckCircle2 className="mr-1 size-3" />공식 출처 검증
                        </Badge>
                    )}
                    {tool.korean_support_level !== 'None' && (
                        <Badge variant="outline" className="border-brand-purple bg-brand-purple/5 text-xs text-brand-purple">
                            <Globe className="mr-1 size-3" />
                            한국어 {tool.korean_support_level === 'Full Support' ? '지원' : 'UI'}
                        </Badge>
                    )}
                    {tool.has_api && (
                        <Badge variant="outline" className="border-brand-purple/30 bg-brand-purple/5 text-xs text-brand-purple">
                            <Code className="mr-1 size-3" />API 지원
                        </Badge>
                    )}
                    {tool.tool_tags
                        ?.filter((relation) => relation.tags)
                        .sort((a, b) => a.position - b.position)
                        .map((relation) => (
                            <Badge key={relation.tags!.id} variant="secondary" className="bg-muted text-xs text-muted-foreground">
                                #{relation.tags!.name}
                            </Badge>
                        ))}
                </div>
            </div>

            <div className="mt-2 flex items-center justify-between gap-3 border-t pt-4">
                <div className="flex min-w-0 items-center gap-2">
                    <Badge variant={tool.pricing_type === 'Free' ? 'secondary' : 'default'} className="shrink-0 text-[10px]">
                        {pricingLabel}
                    </Badge>
                    <span className="truncate text-xs text-muted-foreground" title={pricingText}>
                        {pricingText}
                    </span>
                </div>
                {tool.url ? <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={handleVisit}
                >
                    <Button variant="ghost" size="sm" className="h-8 px-2 text-xs">
                        방문하기 <ExternalLink className="size-3 ml-1" />
                    </Button>
                </a> : <Button variant="ghost" size="sm" disabled className="h-8 px-2 text-xs">링크 없음</Button>}
            </div>
        </div >
    );
}
