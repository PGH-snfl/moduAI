import { Star } from 'lucide-react';
import { useReviews } from '@/hooks/useReviews';
import { formatDistanceToNow } from '@/lib/utils';
import { ReviewForm } from './ReviewForm';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useUserReview } from '@/hooks/useReviews';
import { Link } from 'react-router-dom';

interface ReviewsListProps {
  toolId: string;
}

export function ReviewsList({ toolId }: ReviewsListProps) {
  const { data: reviews, isLoading } = useReviews(toolId);
  const { user } = useAuth();
  const { data: userReview } = useUserReview(toolId, user?.id);
  const [showForm, setShowForm] = useState(false);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="p-4 border rounded-lg animate-pulse">
            <div className="h-4 bg-muted rounded w-1/4 mb-2" />
            <div className="h-4 bg-muted rounded w-3/4" />
          </div>
        ))}
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-center py-8 text-muted-foreground">
          <p>아직 리뷰가 없습니다. 첫 번째 리뷰를 작성해보세요!</p>
        </div>
        {showForm ? (
          <ReviewForm 
            toolId={toolId} 
            onCancel={() => setShowForm(false)} 
          />
        ) : user ? (
          <Button onClick={() => setShowForm(true)} className="w-full">
            리뷰 작성하기
          </Button>
        ) : (
          <Button asChild variant="outline" className="w-full">
            <Link to="/login">로그인하고 리뷰 작성하기</Link>
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* User's own review at top if exists */}
      {userReview && !showForm && (
        <div className="p-4 border-2 border-brand-purple/30 rounded-lg bg-brand-purple/5">
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-brand-purple">내 리뷰</span>
            <Button variant="ghost" size="sm" onClick={() => setShowForm(true)}>
              수정
            </Button>
          </div>
          <div className="flex items-center gap-1 mb-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`size-4 ${
                  star <= userReview.rating
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-muted-foreground'
                }`}
              />
            ))}
          </div>
          {userReview.content && (
            <p className="text-sm text-muted-foreground">{userReview.content}</p>
          )}
        </div>
      )}

      {showForm && (
        <ReviewForm
          toolId={toolId}
          existingReview={userReview}
          onCancel={() => setShowForm(false)}
        />
      )}

      {/* Write review button */}
      {!userReview && !showForm && user && (
        <Button onClick={() => setShowForm(true)} className="w-full">
          리뷰 작성하기
        </Button>
      )}
      {!user && (
        <Button asChild variant="outline" className="w-full">
          <Link to="/login">로그인하고 리뷰 작성하기</Link>
        </Button>
      )}

      {/* All reviews */}
      <div className="space-y-3">
        {reviews
          .filter((review) => !userReview || review.id !== userReview.id)
          .map((review) => (
            <div key={review.id} className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm">
                    {review.display_name || '사용자'}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(review.created_at))}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`size-3 ${
                        star <= review.rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-muted-foreground'
                      }`}
                    />
                  ))}
                </div>
              </div>
              {review.content && (
                <p className="text-sm text-muted-foreground">{review.content}</p>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
