import { Heart, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useIsFavorite, useToggleFavorite } from '@/hooks/useFavorites';
import { cn } from '@/lib/utils';
import { recordAnalytics } from '@/lib/analytics';

interface FavoriteButtonProps {
  toolId: string;
  compact?: boolean;
  className?: string;
}

export function FavoriteButton({ toolId, compact = false, className }: FavoriteButtonProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: isFavorite = false, isLoading } = useIsFavorite(toolId);
  const toggle = useToggleFavorite();
  const pending = isLoading || toggle.isPending;

  const handleClick = async (event: React.MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
    if (!user) {
      navigate('/login', { state: { returnTo: window.location.pathname + window.location.search } });
      return;
    }
    await toggle.mutateAsync({ toolId, isCurrentlyFavorite: isFavorite });
    recordAnalytics(isFavorite ? 'favorite_remove' : 'favorite_add', window.location.pathname, { tool_id: toolId });
  };

  return (
    <Button
      type="button"
      variant="outline"
      size={compact ? 'icon' : 'lg'}
      disabled={pending}
      onClick={handleClick}
      aria-label={isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가'}
      title={user ? (isFavorite ? '즐겨찾기 해제' : '즐겨찾기 추가') : '로그인 후 즐겨찾기'}
      className={cn(!compact && 'gap-2', className)}
    >
      {pending ? <Loader2 className="size-4 animate-spin" /> : <Heart className={cn('size-4', isFavorite && 'fill-red-500 text-red-500')} />}
      {!compact && (isFavorite ? '저장됨' : '즐겨찾기')}
    </Button>
  );
}
