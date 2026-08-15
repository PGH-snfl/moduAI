import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, Clock3, Database, Eye, Inbox, Loader2, MessageSquareText, MousePointerClick, Newspaper, RefreshCw, Sparkles, Users, Wrench } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAdminStats } from '@/hooks/useAdmin';
import { supabase } from '@/lib/supabaseClient';

type DailyTraffic = { date: string; visitors: number; page_views: number };
type PageTraffic = { path: string; views: number };
type AnalyticsSummary = { visitors_today: number; visitors_period: number; page_views_period: number; actions_period: number; reviews_period: number; submissions_period: number; daily: DailyTraffic[]; actions: Record<string, number>; top_pages: PageTraffic[] };

const actionLabels: Record<string, string> = { tool_click: '도구 상세·외부 링크 클릭', search: '검색', filter: '필터 사용', favorite_add: '즐겨찾기 추가', favorite_remove: '즐겨찾기 해제', content_click: '메인 콘텐츠 클릭' };

export function AdminOverviewPage() {
  const stats = useAdminStats();
  const content = useQuery({
    queryKey: ['admin-overview-content'],
    queryFn: async () => {
      const results = await Promise.all([
        supabase.from('featured_promotions').select('*', { count: 'exact', head: true }).eq('is_active', false),
        supabase.from('featured_promotions').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('featured_works').select('*', { count: 'exact', head: true }).eq('status', 'draft'),
        supabase.from('featured_works').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabase.from('ai_technology_trends').select('*', { count: 'exact', head: true }).eq('is_active', false).gt('paper_count_7d', 0),
        supabase.from('ai_technology_trends').select('*', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('admin_notifications').select('*', { count: 'exact', head: true }).eq('is_read', false),
        supabase.from('content_collection_runs').select('*').order('started_at', { ascending: false }).limit(1).maybeSingle(),
      ]);
      const error = results.find(result => result.error)?.error;
      if (error) throw error;
      return { promotionCandidates: results[0].count ?? 0, activePromotions: results[1].count ?? 0, workCandidates: results[2].count ?? 0, activeWorks: results[3].count ?? 0, trendCandidates: results[4].count ?? 0, activeTrends: results[5].count ?? 0, unreadNotifications: results[6].count ?? 0, lastRun: results[7].data };
    },
  });
  const analytics = useQuery({
    queryKey: ['admin-analytics', 7],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_analytics_summary', { p_days: 7 });
      if (error) throw error;
      return data as unknown as AnalyticsSummary;
    },
    staleTime: 60_000,
  });

  const pendingContent = (content.data?.promotionCandidates ?? 0) + (content.data?.workCandidates ?? 0) + (content.data?.trendCandidates ?? 0);
  const activeContent = (content.data?.activePromotions ?? 0) + (content.data?.activeWorks ?? 0) + (content.data?.activeTrends ?? 0);
  const loading = stats.isLoading || content.isLoading || analytics.isLoading;

  return <main>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
      <div><h1 className="text-3xl font-bold">관리자 대시보드</h1><p className="mt-1 text-muted-foreground">서비스 운영 현황과 처리할 작업을 한눈에 확인합니다.</p></div>
      <Button variant="outline" className="gap-2" onClick={() => { void stats.refetch(); void content.refetch(); void analytics.refetch(); }} disabled={loading}><RefreshCw className={`size-4 ${loading ? 'animate-spin' : ''}`} />새로고침</Button>
    </div>

    <section className="mt-6">
      <div className="mb-3"><h2 className="text-xl font-bold">방문·사용 현황</h2><p className="text-sm text-muted-foreground">최근 7일 기준이며 관리자 페이지 방문은 제외됩니다.</p></div>
      {analytics.isError && <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">방문 통계를 불러오지 못했습니다. 새로고침 후 다시 확인해주세요.</div>}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat title="오늘 방문자" value={analytics.data?.visitors_today ?? 0} description="익명 방문 세션 기준" icon={Users} loading={analytics.isLoading} />
        <Stat title="7일 방문자" value={analytics.data?.visitors_period ?? 0} description="중복 방문 제외" icon={Users} loading={analytics.isLoading} />
        <Stat title="7일 페이지 조회" value={analytics.data?.page_views_period ?? 0} description="사용자가 열어본 화면" icon={Eye} loading={analytics.isLoading} />
        <Stat title="7일 주요 행동" value={analytics.data?.actions_period ?? 0} description="클릭·검색·필터·저장" icon={MousePointerClick} loading={analytics.isLoading} />
      </div>
    </section>

    <section className="mt-5 grid gap-5 xl:grid-cols-[1.35fr_1fr]">
      <Card><CardHeader><CardTitle>일별 방문 추이</CardTitle><CardDescription>막대는 방문자 수, 숫자는 페이지 조회 수입니다.</CardDescription></CardHeader><CardContent><TrafficBars rows={analytics.data?.daily ?? []} loading={analytics.isLoading} /></CardContent></Card>
      <Card><CardHeader><CardTitle>사용자가 한 행동</CardTitle><CardDescription>최근 7일 동안 기록된 주요 기능 사용</CardDescription></CardHeader><CardContent className="space-y-2">{analytics.isLoading ? <Loader2 className="size-6 animate-spin" /> : Object.entries(analytics.data?.actions ?? {}).length ? Object.entries(analytics.data?.actions ?? {}).sort((a,b)=>b[1]-a[1]).map(([type,count])=><div key={type} className="flex items-center justify-between rounded-lg bg-muted/60 px-3 py-2"><span className="text-sm">{actionLabels[type] ?? type}</span><strong>{count.toLocaleString('ko-KR')}회</strong></div>) : <p className="text-sm text-muted-foreground">아직 기록된 행동이 없습니다.</p>}</CardContent></Card>
    </section>

    <section className="mt-5 grid gap-5 lg:grid-cols-2">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><MessageSquareText className="size-5" />리뷰·제보 등록</CardTitle><CardDescription>최근 7일 동안 사용자가 직접 등록한 정보</CardDescription></CardHeader><CardContent><div className="grid grid-cols-2 gap-3"><Mini label="새 리뷰" value={analytics.data?.reviews_period ?? 0} /><Mini label="새 도구 제보" value={analytics.data?.submissions_period ?? 0} /></div></CardContent></Card>
      <Card><CardHeader><CardTitle>많이 본 화면</CardTitle><CardDescription>최근 7일 페이지 조회 상위 5개</CardDescription></CardHeader><CardContent className="space-y-2">{(analytics.data?.top_pages ?? []).map(page=><div key={page.path} className="flex items-center justify-between gap-3 rounded-lg bg-muted/60 px-3 py-2"><span className="truncate text-sm" title={page.path}>{page.path}</span><strong className="shrink-0">{page.views.toLocaleString('ko-KR')}회</strong></div>)}{!analytics.isLoading && !(analytics.data?.top_pages.length) && <p className="text-sm text-muted-foreground">아직 페이지 조회 기록이 없습니다.</p>}</CardContent></Card>
    </section>

    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Stat title="승인 대기 도구" value={stats.data?.pendingTools ?? 0} description="사용자 제보 검토 필요" icon={Inbox} alert={(stats.data?.pendingTools ?? 0) > 0} loading={loading} />
      <Stat title="등록된 도구" value={stats.data?.totalTools ?? 0} description={`리뷰 ${stats.data?.totalReviews ?? 0}개`} icon={Wrench} loading={loading} />
      <Stat title="콘텐츠 후보" value={pendingContent} description="추천·작업물·논문 후보" icon={Clock3} alert={pendingContent > 0} loading={loading} />
      <Stat title="메인 노출 콘텐츠" value={activeContent} description="현재 활성 상태" icon={CheckCircle2} loading={loading} />
    </section>

    <section className="mt-6 grid gap-5 lg:grid-cols-2">
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="size-5 text-brand-purple" />도구 관리</CardTitle><CardDescription>제보 검토와 등록 도구 현황</CardDescription></CardHeader>
        <CardContent className="space-y-4"><div className="grid grid-cols-2 gap-3"><Mini label="승인 대기" value={stats.data?.pendingTools ?? 0} /><Mini label="전체 등록" value={stats.data?.totalTools ?? 0} /></div><Button asChild className="w-full"><Link to="/admin/tools">도구 관리로 이동</Link></Button></CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Newspaper className="size-5 text-brand-purple" />메인 콘텐츠</CardTitle><CardDescription>후보 검토와 실제 노출 현황</CardDescription></CardHeader>
        <CardContent className="space-y-4"><div className="grid grid-cols-3 gap-3"><Mini label="추천 후보" value={content.data?.promotionCandidates ?? 0} /><Mini label="작업물 후보" value={content.data?.workCandidates ?? 0} /><Mini label="논문 후보" value={content.data?.trendCandidates ?? 0} /></div><Button asChild className="w-full"><Link to="/admin/content">콘텐츠 관리로 이동</Link></Button></CardContent>
      </Card>
    </section>

    <section className="mt-6 grid gap-5 lg:grid-cols-[1.4fr_1fr]">
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Database className="size-5" />최근 자동수집</CardTitle></CardHeader><CardContent>{content.data?.lastRun ? <div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><Badge variant={content.data.lastRun.status === 'success' ? 'secondary' : 'destructive'}>{content.data.lastRun.status}</Badge><span className="text-sm text-muted-foreground">{new Date(content.data.lastRun.started_at).toLocaleString('ko-KR')}</span></div><p className="text-sm leading-6">{content.data.lastRun.message ?? '실행 기록이 있습니다.'}</p></div> : <p className="text-sm text-muted-foreground">자동수집 기록이 없습니다.</p>}</CardContent></Card>
      <Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="size-5" />확인할 알림</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{content.data?.unreadNotifications ?? 0}</p><p className="mt-1 text-sm text-muted-foreground">읽지 않은 관리자 알림</p></CardContent></Card>
    </section>
  </main>;
}

function Stat({ title, value, description, icon: Icon, alert, loading }: { title: string; value: number; description: string; icon: typeof Inbox; alert?: boolean; loading: boolean }) {
  return <Card><CardHeader className="flex flex-row items-center justify-between pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle><Icon className={`size-4 ${alert ? 'text-brand-purple' : 'text-muted-foreground'}`} /></CardHeader><CardContent>{loading ? <Loader2 className="size-6 animate-spin" /> : <p className="text-3xl font-bold">{value}</p>}<p className="mt-1 text-xs text-muted-foreground">{description}</p></CardContent></Card>;
}

function Mini({ label, value }: { label: string; value: number }) { return <div className="rounded-lg bg-muted/60 p-3 text-center"><p className="text-xl font-bold">{value}</p><p className="mt-1 text-xs text-muted-foreground">{label}</p></div>; }

function TrafficBars({ rows, loading }: { rows: DailyTraffic[]; loading: boolean }) {
  if (loading) return <div className="flex h-44 items-center justify-center"><Loader2 className="size-7 animate-spin" /></div>;
  if (!rows.length) return <div className="flex h-44 items-center justify-center text-sm text-muted-foreground">아직 방문 기록이 없습니다.</div>;
  const max = Math.max(1, ...rows.map(row => row.visitors));
  return <div className="flex h-48 items-end gap-2" aria-label="최근 7일 방문자 그래프">{rows.map(row => <div key={row.date} className="flex min-w-0 flex-1 flex-col items-center gap-1"><span className="text-xs font-semibold">{row.page_views}</span><div className="flex h-28 w-full items-end rounded-md bg-muted/50"><div className="w-full rounded-md bg-brand-purple transition-[height]" style={{ height: `${Math.max(row.visitors ? 8 : 0, row.visitors / max * 100)}%` }} title={`${row.visitors}명 방문 · ${row.page_views}회 조회`} /></div><span className="text-[11px] text-muted-foreground">{new Date(`${row.date}T00:00:00`).toLocaleDateString('ko-KR', { month:'numeric', day:'numeric' })}</span><strong className="text-xs">{row.visitors}명</strong></div>)}</div>;
}
