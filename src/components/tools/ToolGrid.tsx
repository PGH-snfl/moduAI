import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { ToolCard } from '@/components/tools/ToolCard';
import { Button } from '@/components/ui/button';
import { useTools, type ToolFilter } from '@/hooks/useTools';
import { Loader2 } from 'lucide-react';
import { useToolModal } from '@/hooks/useToolModal'; // Custom Hook
import { ToolDetailModal } from '@/components/common/ToolDetailModal'; // Component

interface ToolGridProps {
    filters: ToolFilter;
}

export function ToolGrid({ filters }: ToolGridProps) {
    const {
        data,
        error,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        status,
    } = useTools(filters);

    const { ref, inView } = useInView();
    // Vibe Coding: Logic separated into hook
    const { openModal, closeModal, isOpen, selectedTool } = useToolModal();

    useEffect(() => {
        if (inView && hasNextPage) {
            fetchNextPage();
        }
    }, [inView, fetchNextPage, hasNextPage]);

    if (status === 'pending') {
        return (
            <div className="flex h-64 w-full items-center justify-center">
                <Loader2 className="size-8 animate-spin text-primary" />
            </div>
        );
    }

    if (status === 'error') {
        return (
            <div className="py-12 text-center text-red-500">
                에러가 발생했습니다: {(error as Error).message}
            </div>
        );
    }

    const hasTools = data?.pages[0].data.length > 0;

    return (
        <div className="w-full space-y-8">
            {!hasTools ? (
                <div className="py-20 text-center text-muted-foreground">
                    검색 결과가 없습니다.
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {data.pages.map((page) => (
                        page.data.map((tool) => (
                            <ToolCard
                                key={tool.id}
                                tool={tool}
                                onClick={() => openModal(tool)}
                            />
                        ))
                    ))}
                </div>
            )}

            {/* Infinite Scroll Trigger */}
            <div ref={ref} className="flex justify-center py-8">
                {isFetchingNextPage && <Loader2 className="size-6 animate-spin text-muted-foreground" />}
            </div>

            {/* Fallback Load More Button */}
            {hasNextPage && !isFetchingNextPage && (
                <div className="flex justify-center">
                    <Button variant="outline" onClick={() => fetchNextPage()}>
                        더 보기
                    </Button>
                </div>
            )}

            {/* Tool Detail Modal (Global to Grid) */}
            <ToolDetailModal
                open={isOpen}
                onClose={closeModal}
                tool={selectedTool}
            />
        </div>
    );
}
