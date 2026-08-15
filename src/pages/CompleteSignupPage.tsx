import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, UserRoundCheck } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

export function CompleteSignupPage() {
  const { user, isLoading, signOut } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestedReturnTo = searchParams.get('returnTo') || '/tools';
  const returnTo = requestedReturnTo.startsWith('/') && !requestedReturnTo.startsWith('//') ? requestedReturnTo : '/tools';
  const [displayName, setDisplayName] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    const checkSignup = async () => {
      const { data, error: profileError } = await supabase
        .from('user_profiles')
        .select('display_name, onboarding_completed')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        setError('회원 정보를 확인하지 못했습니다. 잠시 후 다시 시도해주세요.');
      } else if (data?.onboarding_completed) {
        navigate(returnTo, { replace: true });
        return;
      } else {
        setDisplayName(data?.display_name || user.user_metadata?.full_name || user.user_metadata?.name || '');
      }
      setChecking(false);
    };

    void checkSignup();
  }, [isLoading, navigate, returnTo, user]);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    if (!user) return;
    if (!user.email) return setError('회원가입에 필요한 이메일을 소셜 계정에서 받지 못했습니다. 이메일 제공에 동의한 뒤 다시 시도해주세요.');
    if (!displayName.trim()) return setError('서비스에서 사용할 이름을 입력해주세요.');
    if (!termsAccepted || !privacyAccepted) return setError('필수 약관에 모두 동의해주세요.');

    setSaving(true);
    const { error: profileError } = await supabase.from('user_profiles').upsert({
      id: user.id,
      display_name: displayName.trim(),
      avatar_url: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      onboarding_completed: true,
      signup_provider: user.app_metadata?.provider || 'email',
      updated_at: new Date().toISOString(),
    });

    if (profileError) {
      setError('회원가입을 완료하지 못했습니다. 잠시 후 다시 시도해주세요.');
      setSaving(false);
      return;
    }

    await supabase.auth.updateUser({ data: { full_name: displayName.trim(), onboarding_completed: true } });
    window.location.replace(returnTo);
  };

  if (isLoading || checking) {
    return <main className="flex min-h-[70vh] items-center justify-center"><Loader2 className="size-8 animate-spin text-brand-purple" /></main>;
  }

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-xl bg-brand-purple/10"><UserRoundCheck className="size-6 text-brand-purple" /></div>
          <CardTitle className="text-2xl">회원가입을 완료해주세요</CardTitle>
          <CardDescription>소셜 계정 인증이 완료되었습니다. 모두의 AI에서 사용할 정보를 확인해주세요.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="social-email">이메일</Label>
              <Input id="social-email" type="email" value={user?.email || ''} disabled />
              <p className="text-xs text-muted-foreground">소셜 계정에서 인증된 이메일로 모두의 AI 회원 계정이 생성됩니다.</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="social-display-name">표시 이름</Label>
              <Input id="social-display-name" value={displayName} onChange={event => setDisplayName(event.target.value)} maxLength={40} required />
            </div>
            <div className="space-y-3 rounded-xl border p-4">
              <label className="flex cursor-pointer items-start gap-3 text-sm"><Checkbox checked={termsAccepted} onCheckedChange={value => setTermsAccepted(value === true)} /><span><strong>[필수]</strong> <Link to="/terms" target="_blank" className="underline">이용약관</Link>에 동의합니다.</span></label>
              <label className="flex cursor-pointer items-start gap-3 text-sm"><Checkbox checked={privacyAccepted} onCheckedChange={value => setPrivacyAccepted(value === true)} /><span><strong>[필수]</strong> <Link to="/privacy" target="_blank" className="underline">개인정보처리방침</Link>에 동의합니다.</span></label>
            </div>
            {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
            {!user?.email && <p role="alert" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/30 dark:text-amber-300">소셜 계정에서 이메일을 제공하지 않아 가입할 수 없습니다. 로그아웃 후 이메일 제공에 동의하여 다시 로그인해주세요.</p>}
            <Button type="submit" disabled={saving || !user?.email} className="h-11 w-full">{saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : <CheckCircle2 className="mr-2 size-4" />}이 이메일로 회원가입</Button>
            <Button type="button" variant="ghost" className="w-full" onClick={() => void signOut()}>취소하고 로그아웃</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
