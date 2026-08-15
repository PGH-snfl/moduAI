import { useEffect } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  loginMessage?: string;
}

const recentLoginNotices = new Map<string, number>();

function LoginRedirect({ returnTo, message }: { returnTo: string; message: string }) {
  const navigate = useNavigate();

  useEffect(() => {
    const noticeKey = `${returnTo}:${message}`;
    const now = Date.now();
    const lastShownAt = recentLoginNotices.get(noticeKey) ?? 0;
    if (now - lastShownAt > 1500) {
      recentLoginNotices.set(noticeKey, now);
      window.alert(message);
    }
    navigate('/login', { state: { returnTo }, replace: true });
  }, [message, navigate, returnTo]);

  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
    </div>
  );
}

export function ProtectedRoute({ children, loginMessage }: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-brand-purple" />
      </div>
    );
  }

  if (!user) {
    const returnTo = `${location.pathname}${location.search}`;
    if (loginMessage) return <LoginRedirect returnTo={returnTo} message={loginMessage} />;
    return <Navigate to="/login" state={{ returnTo }} replace />;
  }

  return <>{children}</>;
}
