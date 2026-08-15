import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminRouteProps {
    children: React.ReactNode;
}

export function AdminRoute({ children }: AdminRouteProps) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="size-8 animate-spin text-brand-purple" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Admin authorization must come from server-controlled app metadata.
    const isAdmin = user.app_metadata?.role === 'admin';

    if (!isAdmin) {
        return (
            <div className="container py-20 text-center">
                <h1 className="text-2xl font-bold mb-4">접근 권한 없음</h1>
                <p className="text-muted-foreground">
                    이 페이지는 관리자만 접근할 수 있습니다.
                </p>
            </div>
        );
    }

    return <>{children}</>;
}
