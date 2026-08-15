import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { Chrome, Eye, EyeOff, Loader2, LockKeyhole, MessageCircle } from 'lucide-react';
import { isStrongPassword, PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENT_TEXT } from '@/lib/password';

type Mode = 'login' | 'signup';

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { signInWithPassword, signUpWithPassword, signInWithProvider } = useAuth();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState(() => (location.state as { notice?: string } | null)?.notice || '');

  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo;
  const safeReturnTo = returnTo?.startsWith('/') && !returnTo.startsWith('//') ? returnTo : '/tools';

  const friendlyError = (value: unknown) => {
    const message = value instanceof Error ? value.message : '';
    if (message.includes('Invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않습니다.';
    if (message.includes('Email not confirmed')) return '가입 확인 이메일의 인증 링크를 먼저 눌러주세요.';
    if (message.includes('User already registered')) return '이미 가입된 이메일입니다.';
    if (message.includes('Password should') || message.includes('weak_password')) return PASSWORD_REQUIREMENT_TEXT;
    if (message.includes('provider is not enabled') || message.includes('Unsupported provider')) return '이 외부 로그인은 아직 관리자 설정이 필요합니다.';
    return message || '인증 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setNotice('');
    if (mode === 'signup' && !isStrongPassword(password)) return setError(PASSWORD_REQUIREMENT_TEXT);
    if (mode === 'signup' && password !== confirmPassword) return setError('비밀번호 확인이 일치하지 않습니다.');
    if (mode === 'signup' && !displayName.trim()) return setError('표시할 이름을 입력해주세요.');
    try {
      setLoading('password');
      if (mode === 'login') {
        await signInWithPassword(email.trim(), password);
        navigate(safeReturnTo, { replace: true });
      } else {
        const { needsEmailConfirmation } = await signUpWithPassword(email.trim(), password, displayName);
        if (needsEmailConfirmation) {
          setNotice('가입 확인 이메일을 보냈습니다. 이메일의 인증 링크를 눌러 가입을 완료해주세요.');
        } else navigate(safeReturnTo, { replace: true });
      }
    } catch (value) {
      setError(friendlyError(value));
    } finally {
      setLoading(null);
    }
  };

  const socialLogin = async (provider: 'google' | 'kakao') => {
    setError('');
    try {
      setLoading(provider);
      await signInWithProvider(provider, `/complete-signup?returnTo=${encodeURIComponent(safeReturnTo)}`);
    } catch (value) {
      setError(friendlyError(value));
      setLoading(null);
    }
  };

  return (
    <main className="flex min-h-[80vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex size-12 items-center justify-center rounded-xl bg-brand-purple/10"><LockKeyhole className="size-6 text-brand-purple" /></div>
          <h1 className="text-3xl font-bold">{mode === 'login' ? '로그인' : '회원가입'}</h1>
          <p className="mt-2 text-muted-foreground">AI 도구를 저장하고 리뷰를 관리하세요</p>
        </div>

        <div className="mt-7 grid grid-cols-2 rounded-lg bg-muted p-1" role="tablist">
          {(['login', 'signup'] as Mode[]).map(value => (
            <button key={value} type="button" role="tab" aria-selected={mode === value} onClick={() => { setMode(value); setError(''); setNotice(''); }} className={`rounded-md px-3 py-2 text-sm font-medium ${mode === value ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}>
              {value === 'login' ? '로그인' : '회원가입'}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="mt-6 space-y-4">
          {mode === 'signup' && <div className="grid gap-2"><Label htmlFor="display-name">이름</Label><Input id="display-name" autoComplete="name" value={displayName} onChange={e => setDisplayName(e.target.value)} placeholder="서비스에 표시할 이름" required /></div>}
          <div className="grid gap-2"><Label htmlFor="email">이메일 아이디</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" required /></div>
          <div className="grid gap-2">
            <div className="flex items-center justify-between"><Label htmlFor="password">비밀번호</Label>{mode === 'login' && <Link to="/reset-password" className="text-xs text-brand-purple hover:underline">비밀번호 찾기</Link>}</div>
            <div className="relative"><Input id="password" type={showPassword ? 'text' : 'password'} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} value={password} onChange={e => setPassword(e.target.value)} minLength={mode === 'signup' ? PASSWORD_MIN_LENGTH : undefined} required className="pr-11" /><button type="button" onClick={() => setShowPassword(value => !value)} aria-label={showPassword ? '비밀번호 숨기기' : '비밀번호 보기'} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">{showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button></div>
            {mode === 'signup' && <p className="text-xs text-muted-foreground">{PASSWORD_REQUIREMENT_TEXT}</p>}
          </div>
          {mode === 'signup' && <div className="grid gap-2"><Label htmlFor="confirm-password">비밀번호 확인</Label><Input id="confirm-password" type={showPassword ? 'text' : 'password'} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} minLength={PASSWORD_MIN_LENGTH} required /></div>}
          {error && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-300">{error}</p>}
          {notice && <p role="status" className="rounded-lg border border-green-200 bg-green-50 p-3 text-sm text-green-700 dark:border-green-900 dark:bg-green-950/30 dark:text-green-300">{notice}</p>}
          <Button type="submit" disabled={Boolean(loading)} className="h-11 w-full">{loading === 'password' && <Loader2 className="mr-2 size-4 animate-spin" />}{mode === 'login' ? '로그인' : '계정 만들기'}</Button>
        </form>

        <div className="relative my-6"><div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div><div className="relative flex justify-center text-xs"><span className="bg-card px-2 text-muted-foreground">외부 계정으로 계속하기</span></div></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <Button type="button" variant="outline" disabled={Boolean(loading)} onClick={() => socialLogin('google')} className="h-11">{loading === 'google' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <Chrome className="mr-2 size-4" />}Google</Button>
          <Button type="button" disabled={Boolean(loading)} onClick={() => socialLogin('kakao')} className="h-11 bg-[#FEE500] text-[#191919] hover:bg-[#F5DC00]">{loading === 'kakao' ? <Loader2 className="mr-2 size-4 animate-spin" /> : <MessageCircle className="mr-2 size-4" />}카카오</Button>
        </div>
        <p className="mt-6 text-center text-xs leading-5 text-muted-foreground">계속하면 <Link to="/terms" className="underline">이용약관</Link> 및 <Link to="/privacy" className="underline">개인정보처리방침</Link>에 동의하게 됩니다.</p>
        <Button variant="ghost" onClick={() => navigate('/tools')} className="mt-3 w-full">← 둘러보기로 돌아가기</Button>
      </div>
    </main>
  );
}
