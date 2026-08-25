import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Check, ExternalLink, Loader2, RefreshCw, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import type { Json } from '@/types/supabase';

type ToolSummary = { id: string; name: string; logo_url: string | null };
type Candidate = {
  id: string;
  tool_id: string;
  status: 'pending' | 'approved' | 'rejected';
  source_url: string;
  source_title: string | null;
  current_values: Json;
  proposed_updates: Json;
  change_summary: string;
  evidence: Json;
  confidence: number;
  detected_at: string;
  reviewed_at: string | null;
  admin_notes: string | null;
  tools: ToolSummary | null;
};

const fieldLabels: Record<string, string> = {
  pricing_type: '가격 유형', pricing_start_at: '시작 가격', pricing_summary: '가격 요약', pricing_details: '가격 상세',
  pricing_currency: '통화', pricing_url: '가격 링크', has_api: 'API 제공', api_url: 'API 링크',
  korean_support_level: '한국어 지원', primary_features: '핵심 기능', secondary_features: '보조 기능',
  key_benefits: '주요 장점', limitations: '유의사항',
};

function record(value: Json): Record<string, Json | undefined> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, Json | undefined> : {};
}

function display(value: Json | undefined) {
  if (value === null || value === undefined || value === '') return '없음';
  if (Array.isArray(value)) return value.map(String).join(' · ');
  if (typeof value === 'boolean') return value ? '예' : '아니오';
  return typeof value === 'object' ? JSON.stringify(value) : String(value);
}

export function AdminToolUpdatesPage() {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [message, setMessage] = useState<string | null>(null);

  const candidates = useQuery({
    queryKey: ['tool-update-candidates', status],
    queryFn: async () => {
      const { data, error } = await supabase.from('tool_update_candidates').select('*, tools(id,name,logo_url)').eq('status', status).order('detected_at', { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as Candidate[];
    },
  });
  const lastRun = useQuery({
    queryKey: ['tool-update-last-run'],
    queryFn: async () => {
      const { data, error } = await supabase.from('tool_update_runs').select('*').order('started_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const refresh = useMutation({
    mutationFn: async () => {
      const queued = await supabase.rpc('queue_full_tool_information_refresh');
      if (queued.error) throw queued.error;
      const { data, error } = await supabase.functions.invoke('refresh-tool-information', { body: { trigger_type: 'manual', limit: 20 } });
      if (error) throw error;
      return { ...(data as { checked?: number; candidates_created?: number }), queued: queued.data as number };
    },
    onSuccess: async data => {
      setMessage(`전체 ${data.queued ?? 0}개 도구 점검을 시작했습니다. 첫 배치 ${data.checked ?? 0}개를 완료했고, 나머지는 5분 간격으로 이어서 확인합니다.`);
      await Promise.all([candidates.refetch(), lastRun.refetch(), queryClient.invalidateQueries({ queryKey: ['admin-notifications'] })]);
    },
    onError: error => setMessage(`자동 점검 실패: ${error.message}`),
  });
  const review = useMutation({
    mutationFn: async ({ id, decision }: { id: string; decision: 'approved' | 'rejected' }) => {
      const { error } = await supabase.rpc('review_tool_update_candidate', { p_candidate_id: id, p_decision: decision, p_admin_notes: notes[id]?.trim() || undefined });
      if (error) throw error;
      return decision;
    },
    onSuccess: async decision => {
      setMessage(decision === 'approved' ? '변경 내용을 공개 도구 정보에 반영했습니다.' : '변경 후보를 거절했습니다.');
      await Promise.all([candidates.refetch(), queryClient.invalidateQueries({ queryKey: ['all-tools'] }), queryClient.invalidateQueries({ queryKey: ['tools'] })]);
    },
    onError: error => setMessage(`검토 처리 실패: ${error.message}`),
  });

  return <main>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-3xl font-bold">도구 정보 업데이트</h1><p className="mt-1 text-muted-foreground">공식 페이지에서 감지된 변경을 확인한 뒤 공개 정보에 반영합니다.</p></div>
      <Button className="gap-2" onClick={() => refresh.mutate()} disabled={refresh.isPending}>{refresh.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}전체 도구 점검 시작</Button>
    </div>

    {message && <div role="status" className="mt-4 rounded-xl border bg-muted/50 px-4 py-3 text-sm">{message}</div>}
    <Card className="mt-5"><CardHeader><CardTitle className="text-base">자동화 상태</CardTitle><CardDescription>5분마다 확인 기한이 지난 도구를 20개씩 처리합니다. 한 번 확인한 도구는 24시간 동안 제외되어 매일 전체 카탈로그를 한 차례 순회합니다.</CardDescription></CardHeader><CardContent>{lastRun.isLoading ? <Loader2 className="size-5 animate-spin" /> : lastRun.data ? <div className="flex flex-wrap items-center gap-2 text-sm"><Badge variant={lastRun.data.status === 'success' ? 'secondary' : 'outline'}>{lastRun.data.status}</Badge><span>{new Date(lastRun.data.started_at).toLocaleString('ko-KR')}</span><span className="text-muted-foreground">최근 배치 확인 {lastRun.data.tools_checked}개 · 후보 {lastRun.data.candidates_created}건</span></div> : <p className="text-sm text-muted-foreground">아직 실행 기록이 없습니다.</p>}</CardContent></Card>

    <div className="mt-6 flex gap-2 border-b pb-3">{(['pending','approved','rejected'] as const).map(value => <Button key={value} variant={status === value ? 'default' : 'outline'} size="sm" onClick={() => setStatus(value)}>{value === 'pending' ? '검토 대기' : value === 'approved' ? '승인됨' : '거절됨'}</Button>)}</div>

    <div className="mt-5 grid gap-4">
      {candidates.isLoading && <div className="flex justify-center py-16"><Loader2 className="size-8 animate-spin" /></div>}
      {candidates.isError && <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">변경 후보를 불러오지 못했습니다.</div>}
      {candidates.data?.map(candidate => {
        const current = record(candidate.current_values);
        const proposed = record(candidate.proposed_updates);
        const evidence = Array.isArray(candidate.evidence) ? candidate.evidence : [];
        return <Card key={candidate.id}>
          <CardHeader>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="flex items-center gap-3">{candidate.tools?.logo_url && <img src={candidate.tools.logo_url} alt="" className="size-10 rounded-lg" />}<div><CardTitle>{candidate.tools?.name ?? '삭제된 도구'}</CardTitle><CardDescription className="mt-1">{new Date(candidate.detected_at).toLocaleString('ko-KR')} 감지 · 신뢰도 {Math.round(candidate.confidence * 100)}%</CardDescription></div></div><Button variant="outline" size="sm" asChild><a href={candidate.source_url} target="_blank" rel="noopener noreferrer" className="gap-1"><ExternalLink className="size-4" />공식 근거</a></Button></div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-200"><p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4" />자동 감지 요약</p><p className="mt-1 leading-6">{candidate.change_summary}</p></div>
            <div className="overflow-x-auto rounded-xl border"><table className="w-full min-w-[42rem] text-sm"><thead className="bg-muted/70 text-left"><tr><th className="p-3">항목</th><th className="p-3">현재 값</th><th className="p-3">변경 후보</th></tr></thead><tbody>{Object.entries(proposed).map(([field, value]) => <tr key={field} className="border-t align-top"><th className="p-3 font-medium">{fieldLabels[field] ?? field}</th><td className="max-w-sm whitespace-pre-wrap p-3 text-muted-foreground">{display(current[field])}</td><td className="max-w-sm whitespace-pre-wrap p-3 font-medium">{display(value)}</td></tr>)}</tbody></table></div>
            {evidence.length > 0 && <div><h3 className="text-sm font-semibold">페이지 근거</h3><div className="mt-2 grid gap-2">{evidence.map((item, index) => { const row = item && typeof item === 'object' && !Array.isArray(item) ? item as Record<string, Json | undefined> : {}; return <blockquote key={index} className="rounded-lg border-l-4 border-brand-purple bg-muted/50 px-3 py-2 text-sm"><strong>{fieldLabels[String(row.field)] ?? String(row.field)}</strong><span className="ml-2 text-muted-foreground">“{String(row.quote ?? '')}”</span></blockquote>; })}</div></div>}
            {candidate.status === 'pending' && <div className="grid gap-3 border-t pt-4"><Textarea placeholder="검토 메모(선택)" value={notes[candidate.id] ?? ''} onChange={event => setNotes(value => ({ ...value, [candidate.id]: event.target.value }))} /><div className="flex justify-end gap-2"><Button variant="outline" className="gap-1" disabled={review.isPending} onClick={() => review.mutate({ id: candidate.id, decision: 'rejected' })}><X className="size-4" />거절</Button><Button className="gap-1" disabled={review.isPending} onClick={() => review.mutate({ id: candidate.id, decision: 'approved' })}><Check className="size-4" />승인 및 반영</Button></div></div>}
            {candidate.admin_notes && <p className="text-sm text-muted-foreground">관리자 메모: {candidate.admin_notes}</p>}
          </CardContent>
        </Card>;
      })}
      {!candidates.isLoading && candidates.data?.length === 0 && <Card><CardContent className="py-16 text-center text-muted-foreground">이 상태의 변경 후보가 없습니다.</CardContent></Card>}
    </div>
  </main>;
}
