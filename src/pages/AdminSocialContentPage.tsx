import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, ExternalLink, Loader2, Play, ThumbsUp, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';
import { useAuth } from '@/contexts/AuthContext';
import type { Database } from '@/types/supabase';

type Candidate = Database['public']['Tables']['social_content_candidates']['Row'];
type Filter = 'pending' | 'approved' | 'rejected' | 'all';
const platformName = { youtube: '유튜브', instagram: '인스타그램', threads: '스레드' } as const;

export function AdminSocialContentPage() {
  const client = useQueryClient();
  const { user } = useAuth();
  const [filter, setFilter] = useState<Filter>('pending');
  const [message, setMessage] = useState('');
  const candidates = useQuery({ queryKey: ['admin-social-content'], queryFn: async () => { const { data, error } = await supabase.from('social_content_candidates').select('*').order('collected_at', { ascending: false }).limit(500); if (error) throw error; return data ?? []; } });
  const lastRun = useQuery({ queryKey: ['admin-social-run'], queryFn: async () => { const { data, error } = await supabase.from('social_collection_runs').select('*').order('started_at', { ascending: false }).limit(1).maybeSingle(); if (error) throw error; return data; } });
  const refresh = () => Promise.all([client.invalidateQueries({ queryKey: ['admin-social-content'] }), client.invalidateQueries({ queryKey: ['admin-social-run'] }), client.invalidateQueries({ queryKey: ['admin-notifications'] })]);
  const review = useMutation({ mutationFn: async ({ id, status }: { id: string; status: 'approved' | 'rejected' }) => { const { error } = await supabase.from('social_content_candidates').update({ status, reviewed_at: new Date().toISOString(), reviewed_by: user?.id ?? null, updated_at: new Date().toISOString() }).eq('id', id); if (error) throw error; }, onSuccess: async () => { await refresh(); setMessage('검토 상태를 저장했습니다.'); }, onError: error => setMessage(`저장 실패: ${error.message}`) });
  const collect = useMutation({ mutationFn: async () => { const { data, error } = await supabase.functions.invoke('collect-social-content', { body: {} }); if (error) throw error; return data as { saved?: number; details?: Record<string, { skipped?: boolean; reason?: string }> }; }, onSuccess: async data => { await refresh(); setMessage(`수집 완료: 새 검토 후보 ${data.saved ?? 0}개. Meta 연결이 없는 플랫폼은 아래 실행 기록에 표시됩니다.`); }, onError: error => setMessage(`수집 실패: ${error.message}`) });
  const rows = useMemo(() => (candidates.data ?? []).filter(item => filter === 'all' || item.status === filter), [candidates.data, filter]);
  const counts = { pending: candidates.data?.filter(row => row.status === 'pending').length ?? 0, approved: candidates.data?.filter(row => row.status === 'approved').length ?? 0, rejected: candidates.data?.filter(row => row.status === 'rejected').length ?? 0 };
  const details = lastRun.data?.details && typeof lastRun.data.details === 'object' && !Array.isArray(lastRun.data.details) ? lastRun.data.details as Record<string, { saved?: number; skipped?: boolean; reason?: string; failed?: boolean }> : {};

  return <main>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold">소셜 AI 콘텐츠 수집</h1><p className="mt-1 text-muted-foreground">한국어 AI 게시물을 공식 API로 모아 검토합니다. 승인 전에는 사용자에게 노출되지 않습니다.</p></div><Button className="gap-2" disabled={collect.isPending} onClick={() => collect.mutate()}>{collect.isPending ? <Loader2 className="size-4 animate-spin" /> : <Play className="size-4" />}지금 전체 수집</Button></div>
    {message && <p role="status" className="mt-4 rounded-lg border bg-card px-4 py-3 text-sm">{message}</p>}
    <section className="mt-6 grid gap-3 sm:grid-cols-3">{(['youtube','instagram','threads'] as const).map(platform => { const detail = details[platform]; return <div key={platform} className="rounded-xl border bg-card p-4"><p className="font-semibold">{platformName[platform]}</p><p className="mt-1 text-sm text-muted-foreground">{detail?.skipped ? `연결 필요 · ${detail.reason}` : detail?.failed ? '최근 수집 실패' : detail ? `최근 ${detail.saved ?? 0}개 저장` : '실행 기록 없음'}</p></div>; })}</section>
    {lastRun.data && <p className="mt-3 text-xs text-muted-foreground">최근 자동수집: {new Date(lastRun.data.started_at).toLocaleString('ko-KR')} · {lastRun.data.message}</p>}
    <section className="mt-5 flex flex-wrap gap-2">{(['pending','approved','rejected','all'] as const).map(value => <Button key={value} variant={filter === value ? 'default' : 'outline'} onClick={() => setFilter(value)}>{value === 'pending' ? `검토 대기 ${counts.pending}` : value === 'approved' ? `승인 ${counts.approved}` : value === 'rejected' ? `제외 ${counts.rejected}` : `전체 ${candidates.data?.length ?? 0}`}</Button>)}</section>
    <section className="mt-5 space-y-3">
      {candidates.isLoading && <div className="flex justify-center py-12"><Loader2 className="size-7 animate-spin" /></div>}
      {rows.map(item => <CandidateCard key={item.id} item={item} busy={review.isPending} onReview={status => review.mutate({ id: item.id, status })} />)}
      {!candidates.isLoading && rows.length === 0 && <div className="rounded-xl border p-10 text-center text-muted-foreground">이 상태의 수집 게시물이 없습니다.</div>}
    </section>
  </main>;
}

function CandidateCard({ item, busy, onReview }: { item: Candidate; busy: boolean; onReview: (status: 'approved' | 'rejected') => void }) {
  return <article className="overflow-hidden rounded-xl border bg-card"><div className="grid md:grid-cols-[12rem_1fr]">{item.media_url ? <img className="h-48 w-full object-cover md:h-full" src={item.media_url} alt="" loading="lazy" /> : <div className="flex min-h-28 items-center justify-center bg-muted text-sm text-muted-foreground">텍스트 게시물</div>}<div className="p-4"><div className="flex flex-wrap items-center gap-2"><Badge>{platformName[item.platform]}</Badge><Badge variant="outline">AI 관련성 {item.ai_relevance_score}점</Badge><Badge variant="outline">{item.status === 'pending' ? '검토 대기' : item.status === 'approved' ? '승인' : '제외'}</Badge></div><h2 className="mt-3 font-semibold leading-6">{item.title}</h2><p className="mt-1 text-xs text-muted-foreground">{item.creator_name ?? '작성자 정보 없음'} · {item.published_at ? new Date(item.published_at).toLocaleString('ko-KR') : '게시일 없음'}</p>{item.body && <p className="mt-3 line-clamp-3 text-sm leading-6 text-muted-foreground">{item.body}</p>}<div className="mt-3 flex flex-wrap gap-1">{item.matched_keywords.map(keyword => <Badge key={keyword} variant="secondary">{keyword}</Badge>)}</div><div className="mt-4 flex flex-wrap items-center gap-2"><Button size="sm" variant="outline" asChild><a href={item.content_url} target="_blank" rel="noopener noreferrer"><ExternalLink className="mr-1 size-4" />원문 확인</a></Button>{item.view_count !== null && <span className="text-xs text-muted-foreground">조회 {item.view_count.toLocaleString('ko-KR')}</span>}{item.like_count !== null && <span className="flex items-center gap-1 text-xs text-muted-foreground"><ThumbsUp className="size-3" />{item.like_count.toLocaleString('ko-KR')}</span>}<span className="grow" />{item.status !== 'rejected' && <Button size="sm" variant="outline" disabled={busy} onClick={() => onReview('rejected')}><X className="mr-1 size-4" />제외</Button>}{item.status !== 'approved' && <Button size="sm" disabled={busy} onClick={() => onReview('approved')}><Check className="mr-1 size-4" />승인</Button>}</div></div></div></article>;
}
