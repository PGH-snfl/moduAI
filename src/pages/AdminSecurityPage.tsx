import { useQuery } from '@tanstack/react-query';
import { Loader2, RefreshCw, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/lib/supabaseClient';

const eventLabels: Record<string, string> = {
  sign_in: '로그인', sign_out: '로그아웃', signup_completed: '회원가입 완료',
  password_changed: '비밀번호 변경', identity_linked: '소셜 계정 연결',
};
const documentLabels: Record<string, string> = { terms: '이용약관', privacy: '개인정보 처리방침' };

function shortId(value: string | null) {
  return value ? `${value.slice(0, 8)}…` : '삭제된 회원';
}

export function AdminSecurityPage() {
  const records = useQuery({
    queryKey: ['admin-security-records'],
    queryFn: async () => {
      const [consents, audits] = await Promise.all([
        supabase.from('user_consents').select('*').order('accepted_at', { ascending: false }).limit(100),
        supabase.from('auth_audit_events').select('*').order('created_at', { ascending: false }).limit(100),
      ]);
      if (consents.error) throw consents.error;
      if (audits.error) throw audits.error;
      return { consents: consents.data, audits: audits.data };
    },
  });

  return <main>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="flex items-center gap-2 text-3xl font-bold"><ShieldCheck className="size-7" />가입·보안 기록</h1><p className="mt-1 text-muted-foreground">최근 약관 동의와 인증 관련 활동을 최대 100건씩 확인합니다.</p></div>
      <Button variant="outline" className="gap-2" onClick={() => void records.refetch()} disabled={records.isFetching}><RefreshCw className={`size-4 ${records.isFetching ? 'animate-spin' : ''}`} />새로고침</Button>
    </div>
    {records.isError && <div className="mt-5 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">기록을 불러오지 못했습니다. 관리자 권한과 DB 마이그레이션 상태를 확인해주세요.</div>}
    {records.isLoading ? <div className="flex min-h-64 items-center justify-center"><Loader2 className="size-8 animate-spin" /></div> : <div className="mt-6 grid gap-5 xl:grid-cols-2">
      <Card><CardHeader><CardTitle>약관 동의 기록</CardTitle><CardDescription>동의 문서 버전, 방식, 제공자를 보존합니다.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[36rem] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">회원</th><th className="p-2">문서</th><th className="p-2">버전</th><th className="p-2">가입 방식</th><th className="p-2">동의 시각</th></tr></thead><tbody>{records.data?.consents.map(row => <tr key={row.id} className="border-b last:border-0"><td className="p-2 font-mono" title={row.user_id}>{shortId(row.user_id)}</td><td className="p-2">{documentLabels[row.document_type] ?? row.document_type}</td><td className="p-2">{row.document_version}</td><td className="p-2">{row.provider} · {row.acceptance_method === 'email_signup' ? '직접 가입' : '소셜 가입'}</td><td className="whitespace-nowrap p-2">{new Date(row.accepted_at).toLocaleString('ko-KR')}</td></tr>)}</tbody></table>{!records.data?.consents.length && <p className="py-8 text-center text-sm text-muted-foreground">저장된 동의 기록이 없습니다.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle>로그인 감사 기록</CardTitle><CardDescription>성공한 로그인과 주요 계정 보안 활동을 기록합니다.</CardDescription></CardHeader><CardContent className="overflow-x-auto"><table className="w-full min-w-[32rem] text-sm"><thead><tr className="border-b text-left text-muted-foreground"><th className="p-2">회원</th><th className="p-2">활동</th><th className="p-2">제공자</th><th className="p-2">결과</th><th className="p-2">시각</th></tr></thead><tbody>{records.data?.audits.map(row => <tr key={row.id} className="border-b last:border-0"><td className="p-2 font-mono" title={row.user_id ?? undefined}>{shortId(row.user_id)}</td><td className="p-2">{eventLabels[row.event_type] ?? row.event_type}</td><td className="p-2">{row.provider}</td><td className="p-2">{row.success ? '성공' : '실패'}</td><td className="whitespace-nowrap p-2">{new Date(row.created_at).toLocaleString('ko-KR')}</td></tr>)}</tbody></table>{!records.data?.audits.length && <p className="py-8 text-center text-sm text-muted-foreground">저장된 감사 기록이 없습니다.</p>}</CardContent></Card>
    </div>}
  </main>;
}
