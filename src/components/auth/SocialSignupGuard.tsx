import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const ALLOWED_BEFORE_SIGNUP = ['/complete-signup', '/login', '/terms', '/privacy', '/reset-password'];

export function SocialSignupGuard({ children }: { children: ReactNode }) {
  const { user, isLoading, signOut } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [signupState, setSignupState] = useState<{ userId: string; completed: boolean } | null>(null);

  useEffect(() => {
    if (isLoading) return;
    if (!user) return;

    const checkProfile = async () => {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();
      if (error) {
        setSignupState(null);
        try { await signOut(); } catch { /* local auth state still redirects on expiry */ }
        navigate('/login', {
          replace: true,
          state: { notice: '회원 정보를 확인하지 못해 안전하게 로그아웃했습니다. 처음부터 다시 로그인해주세요.' },
        });
        return;
      }
      setSignupState({ userId: user.id, completed: Boolean(data?.onboarding_completed) });
    };
    void checkProfile();
  }, [isLoading, navigate, signOut, user]);

  const isAllowed = ALLOWED_BEFORE_SIGNUP.includes(location.pathname);
  if (!user && !isLoading) return <>{children}</>;
  const completed = signupState && signupState.userId === user?.id ? signupState.completed : null;
  if (!isAllowed && (isLoading || completed === null)) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-brand-purple" /></div>;
  }

  if (!isAllowed && user && completed === false) {
    const returnTo = `${location.pathname}${location.search}`;
    return <Navigate to={`/complete-signup?returnTo=${encodeURIComponent(returnTo)}`} replace />;
  }

  return <>{children}</>;
}
