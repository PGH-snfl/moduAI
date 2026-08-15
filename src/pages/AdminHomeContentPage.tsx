import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { CheckCircle2, ExternalLink, Eye, Inbox, Loader2, Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import type { Database } from '@/types/supabase';

type Promotion = Database['public']['Tables']['featured_promotions']['Row'];
type Work = Database['public']['Tables']['featured_works']['Row'];
type Trend = Database['public']['Tables']['ai_technology_trends']['Row'];
type Tab = 'promotions' | 'works' | 'trends';
type View = 'candidates' | 'published' | 'create';

const nowLocal = () => new Date(Date.now() - new Date().getTimezoneOffset() * 60_000).toISOString().slice(0, 16);
const today = () => new Date().toISOString().slice(0, 10);
const lines = (value: string) => value.split('\n').map(item => item.trim()).filter(Boolean);

export function AdminHomeContentPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('works');
  const [view, setView] = useState<View>('candidates');
  const [message, setMessage] = useState('');
  const collect = useMutation({ mutationFn: async () => { const { data, error } = await supabase.functions.invoke('collect-home-content', { method: 'POST' }); if (error) throw error; return data as { saved?: number }; }, onSuccess: async data => { setMessage(`자동수집을 완료했습니다. 새 후보 ${data.saved ?? 0}개를 저장했습니다.`); await Promise.all([queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }), queryClient.invalidateQueries({ queryKey: ['admin-overview-content'] }), queryClient.invalidateQueries({ queryKey: ['admin-home-content'] })]); }, onError: error => setMessage(`자동수집 실패: ${error.message}`) });

  const tables = {
    promotions: 'featured_promotions',
    works: 'featured_works',
    trends: 'ai_technology_trends',
  } as const;

  const content = useQuery({
    queryKey: ['admin-home-content', tab],
    queryFn: async () => {
      const { data, error } = await supabase.from(tables[tab]).select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tables[tab]).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['admin-home-content', tab] });
      await queryClient.invalidateQueries({ queryKey: ['home-content'] });
      setMessage('삭제했습니다.');
    },
  });

  const changeVisibility = useMutation({
    mutationFn: async ({ id, publish }: { id: string; publish: boolean }) => {
      if (tab === 'promotions') {
        const { error } = await supabase.from('featured_promotions').update({ is_active: publish, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
      } else if (tab === 'works') {
        const { error } = await supabase.from('featured_works').update({ status: publish ? 'approved' : 'draft', updated_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ai_technology_trends').update({ is_active: publish, updated_at: new Date().toISOString() }).eq('id', id);
        if (error) throw error;
      }
    },
    onSuccess: async (_data, variables) => {
      await refresh();
      setMessage(variables.publish ? '콘텐츠를 승인하고 메인 노출 대상으로 등록했습니다.' : '메인 노출을 중지하고 후보로 이동했습니다.');
    },
    onError: error => setMessage(`상태 변경 실패: ${error.message}`),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-home-content', tab] });
    await queryClient.invalidateQueries({ queryKey: ['home-content'] });
  };

  const visibleContent = (content.data ?? []).filter(item => {
    const record = item as Promotion | Work | Trend;
    const active = 'is_active' in record ? record.is_active : record.status === 'approved';
    if (view === 'published') return active;
    if (view === 'candidates') return !active && (!('status' in record) || record.status === 'draft') && (!('paper_count_7d' in record) || record.paper_count_7d > 0);
    return false;
  });

  return (
    <main>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div><h1 className="text-3xl font-bold">메인 콘텐츠 관리</h1><p className="mt-1 text-muted-foreground">메인 화면에 노출할 추천 서비스, 인기 작업물과 기술 트렌드를 관리합니다.</p></div>
        {view === 'candidates' && <Button onClick={() => collect.mutate()} disabled={collect.isPending} className="gap-2">{collect.isPending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}지금 자동수집</Button>}
      </div>

      {message && <p role="status" className="mt-4 rounded-lg border bg-card px-4 py-3 text-sm">{message}</p>}
      <div className="mt-6 grid gap-3 md:grid-cols-3">
        {([
          ['candidates', '수집 후보 검토', '자동수집 콘텐츠를 확인하고 승인합니다.', Inbox],
          ['published', '등록 콘텐츠', '현재 메인 노출 대상을 확인합니다.', Eye],
          ['create', '직접 입력', '관리자가 콘텐츠를 직접 등록합니다.', Plus],
        ] as const).map(([value, label, description, Icon]) => <button key={value} type="button" onClick={() => { setView(value); setMessage(''); }} className={`rounded-xl border p-4 text-left transition-colors ${view === value ? 'border-brand-purple bg-brand-purple/10 ring-1 ring-brand-purple/20' : 'bg-card hover:bg-muted/40'}`}><span className="flex items-center gap-2 font-semibold"><Icon className="size-5" />{label}</span><span className="mt-1 block text-xs text-muted-foreground">{description}</span></button>)}
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto">
        {([['promotions','추천 서비스'],['works','인기 작업물'],['trends','기술 트렌드']] as const).map(([value,label]) => <Button key={value} variant={tab === value ? 'default' : 'outline'} onClick={() => { setTab(value); setMessage(''); }}>{label}</Button>)}
      </div>

      {view === 'create' ? <section className="mt-6 max-w-3xl">
          {tab === 'promotions' && <PromotionForm onSaved={refresh} onMessage={setMessage} />}
          {tab === 'works' && <WorkForm onSaved={refresh} onMessage={setMessage} />}
          {tab === 'trends' && <TrendForm onSaved={refresh} onMessage={setMessage} />}
        </section> : <section className="mt-6 space-y-3">
          <div><h2 className="text-lg font-semibold">{view === 'candidates' ? '승인 대기 후보' : '메인 등록 콘텐츠'}</h2><p className="mt-1 text-sm text-muted-foreground">{view === 'candidates' ? '내용을 확인한 뒤 승인하면 등록 콘텐츠로 이동합니다.' : '현재 메인 노출 대상이며 필요하면 노출을 중지할 수 있습니다.'}</p></div>
          {content.isLoading && <Loader2 className="size-6 animate-spin" />}
          {visibleContent.map(item => {
            const record = item as Promotion | Work | Trend;
            const title = 'headline' in record ? record.headline : 'title' in record ? record.title : `${record.short_name} · ${record.topic_name}`;
            const active = 'is_active' in record ? record.is_active : record.status === 'approved';
            return <article key={record.id} className="rounded-xl border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0"><p className="break-words font-semibold">{title}</p><div className="mt-2 flex flex-wrap gap-2"><Badge variant={active ? 'secondary' : 'outline'}>{active ? '메인 노출 중' : '승인 대기'}</Badge><Badge variant="outline">클릭 {record.click_count.toLocaleString()}</Badge></div></div>
                <div className="flex shrink-0 gap-2"><Button size="sm" variant={view === 'candidates' ? 'default' : 'outline'} className="gap-1" disabled={changeVisibility.isPending} onClick={() => changeVisibility.mutate({ id: record.id, publish: view === 'candidates' })}>{view === 'candidates' ? <><CheckCircle2 className="size-4" />승인</> : '노출 중지'}</Button><Button size="icon" variant="ghost" title="삭제" disabled={remove.isPending} onClick={() => { if (confirm(`"${title}" 콘텐츠를 삭제하시겠습니까?`)) remove.mutate(record.id); }}><Trash2 className="size-4 text-red-500" /></Button></div>
              </div>
              {'description' in record && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{record.description}</p>}
              {'summary' in record && <p className="mt-3 line-clamp-2 text-sm text-muted-foreground">{record.summary}</p>}
              {'representative_papers' in record && <div className="mt-4 rounded-lg border bg-muted/30 p-3"><div className="flex flex-wrap gap-2 text-xs"><Badge variant="outline">검증 통과 {record.paper_count_7d}편</Badge><Badge variant="outline">이전 기간 {record.previous_paper_count_7d}편</Badge><Badge variant="outline">변화 {record.growth_rate > 0 ? '+' : ''}{record.growth_rate}%</Badge></div><div className="mt-3 grid gap-2">{(Array.isArray(record.representative_papers) ? record.representative_papers : []).slice(0, 3).map((paper, index) => { const item = paper as { title?: string; url?: string; confidence_score?: number; cited_by_count?: number; source?: string }; return <a key={`${item.url ?? index}`} href={item.url} target="_blank" rel="noreferrer" className="flex min-w-0 items-start justify-between gap-3 rounded-md bg-background px-3 py-2 text-xs hover:ring-1 hover:ring-brand-purple/40"><span className="min-w-0"><span className="line-clamp-2 font-medium">{item.title ?? '제목 없음'}</span><span className="mt-1 block text-muted-foreground">{item.source ?? '출처 미상'} · 인용 {item.cited_by_count ?? 0}회{item.confidence_score ? ` · 신뢰도 ${item.confidence_score}점` : ''}</span></span><ExternalLink className="mt-0.5 size-3.5 shrink-0" /></a>; })}</div></div>}
            </article>;
          })}
          {!content.isLoading && visibleContent.length === 0 && <p className="rounded-xl border p-8 text-center text-muted-foreground">{view === 'candidates' ? '검토할 후보가 없습니다.' : '현재 등록된 콘텐츠가 없습니다.'}</p>}
        </section>}
    </main>
  );
}

function Shell({ title, children }: { title: string; children: React.ReactElement<{ onSubmit?: (event: FormEvent) => void }> }) { return <form onSubmit={event => children.props.onSubmit?.(event)} className="grid gap-4 rounded-xl border bg-card p-5"> <h2 className="flex items-center gap-2 text-lg font-semibold"><Plus className="size-4" />{title}</h2>{children}</form>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label>{label}</Label>{children}</div>; }
function SaveButton({ pending }: { pending: boolean }) { return <Button type="submit" disabled={pending} className="gap-2">{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}저장</Button>; }

function PromotionForm({ onSaved, onMessage }: { onSaved: () => Promise<void>; onMessage: (value: string) => void }) {
  const initial = { headline:'', description:'', eyebrow:'추천 AI 서비스', media_url:'', video_url:'', video_type:'youtube' as 'youtube' | 'direct', destination_url:'', button_text:'자세히 보기', starts_at:nowLocal(), ends_at:'', priority:'0', is_sponsored:false, is_active:true };
  const [form, setForm] = useState(initial);
  const save = useMutation({ mutationFn: async () => { const { error } = await supabase.from('featured_promotions').insert({ ...form, media_url: form.media_url || null, video_url: form.video_url || null, video_type: form.video_url ? form.video_type : null, starts_at: new Date(form.starts_at).toISOString(), ends_at: form.ends_at ? new Date(form.ends_at).toISOString() : null, priority:Number(form.priority) }); if (error) throw error; }, onSuccess: async () => { setForm(initial); await onSaved(); onMessage('추천 서비스를 저장했습니다.'); }, onError: e => onMessage(`저장 실패: ${e.message}`) });
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate(); };
  return <Shell title="추천 서비스 추가"><div onSubmit={submit} className="contents"><Field label="상단 라벨"><Input value={form.eyebrow} onChange={e => setForm({...form,eyebrow:e.target.value})} required /></Field><Field label="제목"><Input value={form.headline} onChange={e => setForm({...form,headline:e.target.value})} required /></Field><Field label="소개"><Textarea value={form.description} onChange={e => setForm({...form,description:e.target.value})} required /></Field><Field label="이미지 URL (영상이 없을 때 표시)"><Input type="url" value={form.media_url} onChange={e => setForm({...form,media_url:e.target.value})} /></Field><div className="grid gap-4 sm:grid-cols-[180px_1fr]"><Field label="영상 유형"><select className="h-10 rounded-md border bg-background px-3" value={form.video_type} onChange={e=>setForm({...form,video_type:e.target.value as 'youtube' | 'direct'})}><option value="youtube">YouTube</option><option value="direct">직접 영상 파일</option></select></Field><Field label="소개 영상 URL (선택)"><Input type="url" value={form.video_url} onChange={e => setForm({...form,video_url:e.target.value})} placeholder="https://www.youtube.com/watch?v=..." /></Field></div><Field label="이동 URL"><Input type="url" value={form.destination_url} onChange={e => setForm({...form,destination_url:e.target.value})} required /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="버튼 문구"><Input value={form.button_text} onChange={e => setForm({...form,button_text:e.target.value})} required /></Field><Field label="우선순위"><Input type="number" value={form.priority} onChange={e => setForm({...form,priority:e.target.value})} /></Field><Field label="노출 시작"><Input type="datetime-local" value={form.starts_at} onChange={e => setForm({...form,starts_at:e.target.value})} required /></Field><Field label="노출 종료"><Input type="datetime-local" value={form.ends_at} onChange={e => setForm({...form,ends_at:e.target.value})} /></Field></div><label className="flex gap-2 text-sm"><input type="checkbox" checked={form.is_sponsored} onChange={e => setForm({...form,is_sponsored:e.target.checked})} />Sponsored 표시</label><label className="flex gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e => setForm({...form,is_active:e.target.checked})} />활성화</label><SaveButton pending={save.isPending} /></div></Shell>;
}

function WorkForm({ onSaved, onMessage }: { onSaved: () => Promise<void>; onMessage: (value: string) => void }) {
  const initial = { platform:'YouTube' as Work['platform'], title:'', creator_name:'', description:'', thumbnail_url:'', content_url:'', view_count:'', like_count:'', comment_count:'', status:'draft' as Work['status'], featured_from:today(), featured_until:'', display_order:'0' };
  const [form,setForm] = useState(initial);
  const save = useMutation({ mutationFn: async () => { const { error } = await supabase.from('featured_works').insert({ ...form, view_count:form.view_count ? Number(form.view_count):null, like_count:form.like_count ? Number(form.like_count):null, comment_count:form.comment_count ? Number(form.comment_count):null, featured_until:form.featured_until||null, display_order:Number(form.display_order) }); if(error) throw error; }, onSuccess:async()=>{setForm(initial);await onSaved();onMessage('인기 작업물을 저장했습니다.');},onError:e=>onMessage(`저장 실패: ${e.message}`)});
  return <Shell title="인기 작업물 추가"><div onSubmit={e=>{e.preventDefault();save.mutate();}} className="contents"><div className="grid gap-4 sm:grid-cols-2"><Field label="플랫폼"><select className="h-10 rounded-md border bg-background px-3" value={form.platform} onChange={e=>setForm({...form,platform:e.target.value as Work['platform']})}>{['YouTube','Instagram','TikTok','Other'].map(v=><option key={v}>{v}</option>)}</select></Field><Field label="노출 상태"><select className="h-10 rounded-md border bg-background px-3" value={form.status} onChange={e=>setForm({...form,status:e.target.value as Work['status']})}><option value="draft">검토 중</option><option value="approved">승인·노출</option><option value="rejected">거절</option></select></Field></div><Field label="제목"><Input value={form.title} onChange={e=>setForm({...form,title:e.target.value})} required /></Field><Field label="제작자"><Input value={form.creator_name} onChange={e=>setForm({...form,creator_name:e.target.value})} required /></Field><Field label="설명"><Textarea value={form.description} onChange={e=>setForm({...form,description:e.target.value})} required /></Field><Field label="썸네일 URL"><Input type="url" value={form.thumbnail_url} onChange={e=>setForm({...form,thumbnail_url:e.target.value})} required /></Field><Field label="콘텐츠 URL"><Input type="url" value={form.content_url} onChange={e=>setForm({...form,content_url:e.target.value})} required /></Field><div className="grid grid-cols-3 gap-3"><Field label="조회수"><Input type="number" min="0" value={form.view_count} onChange={e=>setForm({...form,view_count:e.target.value})} /></Field><Field label="좋아요"><Input type="number" min="0" value={form.like_count} onChange={e=>setForm({...form,like_count:e.target.value})} /></Field><Field label="댓글"><Input type="number" min="0" value={form.comment_count} onChange={e=>setForm({...form,comment_count:e.target.value})} /></Field></div><div className="grid gap-4 sm:grid-cols-3"><Field label="노출 시작"><Input type="date" value={form.featured_from} onChange={e=>setForm({...form,featured_from:e.target.value})} /></Field><Field label="노출 종료"><Input type="date" value={form.featured_until} onChange={e=>setForm({...form,featured_until:e.target.value})} /></Field><Field label="순서"><Input type="number" value={form.display_order} onChange={e=>setForm({...form,display_order:e.target.value})} /></Field></div><SaveButton pending={save.isPending} /></div></Shell>;
}

function TrendForm({ onSaved, onMessage }: { onSaved: () => Promise<void>; onMessage: (value: string) => void }) {
  const initial={topic_name:'',short_name:'',summary:'',source_label:'',source_url:'',image_url:'',paper_count_7d:'0',previous_paper_count_7d:'0',growth_rate:'0',representative_papers:'',display_order:'0',is_active:true};
  const [form,setForm]=useState(initial);
  const save=useMutation({mutationFn:async()=>{const papers=lines(form.representative_papers).map(value=>({url:value}));const {error}=await supabase.from('ai_technology_trends').insert({...form,image_url:form.image_url||null,paper_count_7d:Number(form.paper_count_7d),previous_paper_count_7d:Number(form.previous_paper_count_7d),growth_rate:Number(form.growth_rate),representative_papers:papers,display_order:Number(form.display_order)});if(error)throw error;},onSuccess:async()=>{setForm(initial);await onSaved();onMessage('기술 트렌드를 저장했습니다.');},onError:e=>onMessage(`저장 실패: ${e.message}`)});
  return <Shell title="기술 트렌드 추가"><div onSubmit={e=>{e.preventDefault();save.mutate();}} className="contents"><div className="grid gap-4 sm:grid-cols-2"><Field label="짧은 이름"><Input value={form.short_name} onChange={e=>setForm({...form,short_name:e.target.value})} placeholder="예: CVPR" required /></Field><Field label="기술 주제"><Input value={form.topic_name} onChange={e=>setForm({...form,topic_name:e.target.value})} required /></Field></div><Field label="설명"><Textarea value={form.summary} onChange={e=>setForm({...form,summary:e.target.value})} required /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="출처 이름"><Input value={form.source_label} onChange={e=>setForm({...form,source_label:e.target.value})} required /></Field><Field label="출처 URL"><Input type="url" value={form.source_url} onChange={e=>setForm({...form,source_url:e.target.value})} required /></Field></div><Field label="이미지 URL"><Input type="url" value={form.image_url} onChange={e=>setForm({...form,image_url:e.target.value})} /></Field><div className="grid grid-cols-3 gap-3"><Field label="최근 논문"><Input type="number" min="0" value={form.paper_count_7d} onChange={e=>setForm({...form,paper_count_7d:e.target.value})} /></Field><Field label="이전 논문"><Input type="number" min="0" value={form.previous_paper_count_7d} onChange={e=>setForm({...form,previous_paper_count_7d:e.target.value})} /></Field><Field label="증가율 %"><Input type="number" value={form.growth_rate} onChange={e=>setForm({...form,growth_rate:e.target.value})} /></Field></div><Field label="대표 논문 URL (한 줄에 하나)"><Textarea value={form.representative_papers} onChange={e=>setForm({...form,representative_papers:e.target.value})} /></Field><Field label="노출 순서"><Input type="number" value={form.display_order} onChange={e=>setForm({...form,display_order:e.target.value})} /></Field><label className="flex gap-2 text-sm"><input type="checkbox" checked={form.is_active} onChange={e=>setForm({...form,is_active:e.target.checked})} />활성화</label><SaveButton pending={save.isPending} /></div></Shell>;
}
