import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { isStrongPassword, PASSWORD_MIN_LENGTH, PASSWORD_REQUIREMENT_TEXT } from '@/lib/password';

export function ResetPasswordPage() {
  const { user, requestPasswordReset, requestPasswordReauthentication, updatePassword, signOutAll } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nonce, setNonce] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError(''); setMessage('');
    if (user && password !== confirmPassword) return setError('비밀번호 확인이 일치하지 않습니다.');
    if (user && !isStrongPassword(password)) return setError(PASSWORD_REQUIREMENT_TEXT);
    if (user && nonce.length !== 6) return setError('이메일로 받은 6자리 인증 코드를 입력해주세요.');
    try {
      setLoading(true);
      if (user) {
        await updatePassword(password, nonce.trim() || undefined);
        await signOutAll();
        navigate('/login', { replace: true, state: { notice: '비밀번호가 변경되어 모든 기기에서 로그아웃되었습니다. 새 비밀번호로 로그인해주세요.' } });
      } else {
        await requestPasswordReset(email.trim());
        setMessage('비밀번호 변경 링크를 이메일로 보냈습니다.');
      }
    } catch (value) {
      setError(value instanceof Error ? value.message : '요청을 처리하지 못했습니다.');
    } finally { setLoading(false); }
  };

  const sendReauthenticationCode = async () => {
    setError(''); setMessage('');
    try {
      setLoading(true);
      await requestPasswordReauthentication();
      setMessage('계정 이메일로 6자리 재인증 코드를 보냈습니다.');
    } catch (value) {
      setError(value instanceof Error ? value.message : '재인증 코드를 보내지 못했습니다.');
    } finally { setLoading(false); }
  };

  return (
    <main className="flex min-h-[75vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold">{user ? '새 비밀번호 설정' : '비밀번호 찾기'}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{user ? '새로 사용할 비밀번호를 입력해주세요.' : '가입한 이메일로 비밀번호 변경 링크를 보내드립니다.'}</p>
        <form onSubmit={submit} className="mt-6 space-y-4">
          {user ? <>
            <div className="grid gap-2"><Label htmlFor="new-password">새 비밀번호</Label><Input id="new-password" type="password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} value={password} onChange={e => setPassword(e.target.value)} required /><p className="text-xs text-muted-foreground">{PASSWORD_REQUIREMENT_TEXT}</p></div>
            <div className="grid gap-2"><Label htmlFor="new-password-confirm">새 비밀번호 확인</Label><Input id="new-password-confirm" type="password" autoComplete="new-password" minLength={PASSWORD_MIN_LENGTH} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} required /></div>
            <div className="grid gap-2"><div className="flex items-center justify-between"><Label htmlFor="reauth-nonce">이메일 인증 코드</Label><button type="button" onClick={sendReauthenticationCode} className="text-xs text-brand-purple hover:underline">코드 받기</button></div><Input id="reauth-nonce" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={nonce} onChange={e => setNonce(e.target.value.replace(/\D/g, ''))} placeholder="6자리 코드" required /><p className="text-xs text-muted-foreground">변경 후 현재 기기를 포함한 모든 기기에서 로그아웃됩니다.</p></div>
          </> : <div className="grid gap-2"><Label htmlFor="reset-email">이메일 아이디</Label><Input id="reset-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {message && <p role="status" className="text-sm text-green-600">{message}</p>}
          <Button type="submit" disabled={loading} className="h-11 w-full">{loading && <Loader2 className="mr-2 size-4 animate-spin" />}{user ? '비밀번호 변경' : '변경 링크 보내기'}</Button>
        </form>
        <Button asChild variant="ghost" className="mt-4 w-full"><Link to="/login">로그인으로 돌아가기</Link></Button>
      </div>
    </main>
  );
}
