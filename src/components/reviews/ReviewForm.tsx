import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Star } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useUpsertReview, useDeleteReview } from '@/hooks/useReviews';

interface ReviewFormProps {
  toolId: string;
  existingReview?: {
    id: string;
    rating: number;
    content: string | null;
  } | null;
  onCancel?: () => void;
}

export function ReviewForm({ toolId, existingReview, onCancel }: ReviewFormProps) {
  const { user } = useAuth();
  const [rating, setRating] = useState(existingReview?.rating || 0);
  const [content, setContent] = useState(existingReview?.content || '');
  const [hoveredRating, setHoveredRating] = useState(0);
  const [errorMessage, setErrorMessage] = useState('');

  const upsertReview = useUpsertReview();
  const deleteReview = useDeleteReview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || rating === 0) return;

    try {
      setErrorMessage('');
      await upsertReview.mutateAsync({
        toolId,
        userId: user.id,
        rating,
        content,
        displayName: user.user_metadata.full_name || user.email?.split('@')[0] || '사용자',
      });
      onCancel?.();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : '리뷰 저장에 실패했습니다.');
    }
  };

  const handleDelete = async () => {
    if (!user || !existingReview) return;
    
    if (confirm('리뷰를 삭제하시겠습니까?')) {
      try {
        setErrorMessage('');
        await deleteReview.mutateAsync({ reviewId: existingReview.id, toolId, userId: user.id });
        onCancel?.();
      } catch (error) {
        setErrorMessage(error instanceof Error ? error.message : '리뷰 삭제에 실패했습니다.');
      }
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-muted rounded-lg text-center">
        <p className="text-muted-foreground">리뷰를 작성하려면 로그인이 필요합니다</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-4 border rounded-lg">
      <div>
        <label className="block text-sm font-medium mb-2">별점</label>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onClick={() => setRating(star)}
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              className="focus:outline-none"
            >
              <Star
                className={`size-6 transition-colors ${
                  star <= (hoveredRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium mb-2">리뷰 내용</label>
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="이 AI 도구에 대한 경험을 공유해주세요..."
          rows={4}
        />
      </div>

      <div className="flex gap-2">
        <Button
          type="submit"
          disabled={rating === 0 || upsertReview.isPending}
          className="flex-1"
        >
          {upsertReview.isPending ? '저장 중...' : existingReview ? '수정하기' : '리뷰 작성'}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            취소
          </Button>
        )}
        {existingReview && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteReview.isPending}
          >
            삭제
          </Button>
        )}
      </div>
      {errorMessage && <p role="alert" className="text-sm text-red-600">{errorMessage}</p>}
    </form>
  );
}
