import { useEffect, useState, type ReactNode } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';

const ALLOWED_BEFORE_SIGNUP = ['/complete-signup', '/login', '/terms', '/privacy', '/reset-password'];

export function SocialSignupGuard({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();
  const location = useLocation();
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
      setSignupState({ userId: user.id, completed: error ? true : Boolean(data?.onboarding_completed) });
    };
    void checkProfile();
  }, [isLoading, user]);

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
