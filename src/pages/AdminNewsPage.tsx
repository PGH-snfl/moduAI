import { useMemo, useState, type FormEvent } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Edit3, ExternalLink, Eye, EyeOff, Loader2, Plus, Search, Trash2, X } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';

type News = Database['public']['Tables']['news']['Row'];
type StatusFilter = 'all' | 'published' | 'hidden';
type CategoryFilter = 'all' | News['category'];
type NewsForm = Pick<News, 'title' | 'source' | 'url' | 'published_date' | 'badge' | 'category' | 'summary' | 'is_published'>;

const emptyForm = (): NewsForm => ({ title: '', source: '', url: '', published_date: new Date().toISOString().slice(0, 10).replaceAll('-', '.'), badge: null, category: 'domestic', summary: '', is_published: true });

export function AdminNewsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<StatusFilter>('all');
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [editing, setEditing] = useState<News | 'new' | null>(null);
  const [deleting, setDeleting] = useState<News | null>(null);
  const [message, setMessage] = useState('');

  const news = useQuery({ queryKey: ['admin-news'], queryFn: async () => { const { data, error } = await supabase.from('news').select('*').eq('is_deleted', false).order('published_date', { ascending: false }).order('created_at', { ascending: false }); if (error) throw error; return data ?? []; } });
  const refresh = async () => { await Promise.all([queryClient.invalidateQueries({ queryKey: ['admin-news'] }), queryClient.invalidateQueries({ queryKey: ['report-news'] }), queryClient.invalidateQueries({ queryKey: ['news'] }), queryClient.invalidateQueries({ queryKey: ['latest-news'] })]); };
  const toggle = useMutation({ mutationFn: async (item: News) => { const { error } = await supabase.from('news').update({ is_published: !item.is_published, is_manually_managed: true, updated_at: new Date().toISOString() }).eq('id', item.id); if (error) throw error; }, onSuccess: async () => { await refresh(); setMessage('뉴스 노출 상태를 변경했습니다.'); }, onError: error => setMessage(`상태 변경 실패: ${error.message}`) });
  const remove = useMutation({ mutationFn: async (id: string) => { const { error } = await supabase.from('news').update({ is_deleted: true, is_published: false, is_manually_managed: true, updated_at: new Date().toISOString() }).eq('id', id); if (error) throw error; }, onSuccess: async () => { setDeleting(null); await refresh(); setMessage('뉴스를 삭제했습니다. 자동수집에서도 다시 노출되지 않습니다.'); }, onError: error => setMessage(`삭제 실패: ${error.message}`) });

  const visible = useMemo(() => (news.data ?? []).filter(item => {
    const term = search.trim().toLowerCase();
    if (term && !`${item.title} ${item.source} ${item.summary ?? ''}`.toLowerCase().includes(term)) return false;
    if (status === 'published' && !item.is_published) return false;
    if (status === 'hidden' && item.is_published) return false;
    return category === 'all' || item.category === category;
  }), [news.data, search, status, category]);

  const counts = { total: news.data?.length ?? 0, published: news.data?.filter(item => item.is_published).length ?? 0, hidden: news.data?.filter(item => !item.is_published).length ?? 0 };

  return <main>
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between"><div><h1 className="text-3xl font-bold">뉴스 관리</h1><p className="mt-1 text-muted-foreground">자동수집 뉴스와 직접 등록한 뉴스를 확인하고 사용자 노출을 관리합니다.</p></div><Button className="gap-2" onClick={() => setEditing('new')}><Plus className="size-4" />뉴스 직접 등록</Button></div>
    {message && <p role="status" className="mt-4 rounded-lg border bg-card px-4 py-3 text-sm">{message}</p>}
    <section className="mt-6 grid gap-3 sm:grid-cols-3"><Summary label="전체 뉴스" value={counts.total} /><Summary label="현재 노출" value={counts.published} /><Summary label="숨김" value={counts.hidden} /></section>
    <section className="mt-5 grid gap-3 rounded-xl border bg-card p-4 lg:grid-cols-[1fr_auto_auto]">
      <label className="relative"><Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={event => setSearch(event.target.value)} placeholder="제목, 출처, 요약 검색" /></label>
      <div className="flex gap-2">{(['all','published','hidden'] as const).map(value => <Button key={value} variant={status === value ? 'default' : 'outline'} onClick={() => setStatus(value)}>{value === 'all' ? '전체' : value === 'published' ? '노출 중' : '숨김'}</Button>)}</div>
      <div className="flex gap-2">{(['all','domestic','global'] as const).map(value => <Button key={value} variant={category === value ? 'secondary' : 'outline'} onClick={() => setCategory(value)}>{value === 'all' ? '국내외' : value === 'domestic' ? '국내' : '해외'}</Button>)}</div>
    </section>
    <section className="mt-5 space-y-3">
      {news.isLoading && <div className="flex justify-center py-12"><Loader2 className="size-7 animate-spin" /></div>}
      {visible.map(item => <article key={item.id} className="rounded-xl border bg-card p-4"><div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between"><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><Badge variant={item.is_published ? 'secondary' : 'outline'}>{item.is_published ? '노출 중' : '숨김'}</Badge><Badge variant="outline">{item.category === 'domestic' ? '국내' : '해외'}</Badge><Badge variant="outline">{item.is_auto_collected ? '자동수집' : '직접 등록'}</Badge>{item.badge && <Badge>{item.badge}</Badge>}</div><h2 className="mt-3 break-words font-semibold">{item.title}</h2><p className="mt-1 text-xs text-muted-foreground">{item.source} · {item.published_date ?? '날짜 없음'}</p>{item.summary && <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted-foreground">{item.summary}</p>}</div><div className="flex shrink-0 flex-wrap gap-2"><Button size="sm" variant="outline" className="gap-1" onClick={() => toggle.mutate(item)} disabled={toggle.isPending}>{item.is_published ? <><EyeOff className="size-4" />숨기기</> : <><Eye className="size-4" />노출하기</>}</Button><Button size="sm" variant="outline" className="gap-1" onClick={() => setEditing(item)}><Edit3 className="size-4" />수정</Button><Button size="icon" variant="outline" asChild><a href={item.url} target="_blank" rel="noopener noreferrer" aria-label="기사 원문"><ExternalLink className="size-4" /></a></Button><Button size="icon" variant="ghost" aria-label="뉴스 삭제" onClick={() => setDeleting(item)}><Trash2 className="size-4 text-red-500" /></Button></div></div></article>)}
      {!news.isLoading && visible.length === 0 && <div className="rounded-xl border p-10 text-center text-muted-foreground">조건에 맞는 뉴스가 없습니다.</div>}
    </section>
    <NewsEditor key={editing === 'new' ? 'new' : editing?.id ?? 'closed'} item={editing} onClose={() => setEditing(null)} onSaved={async text => { setEditing(null); await refresh(); setMessage(text); }} />
    <Dialog.Root open={Boolean(deleting)} onOpenChange={open => { if (!open && !remove.isPending) setDeleting(null); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-2xl border bg-card p-6 shadow-2xl"><Dialog.Title className="text-xl font-bold">뉴스 삭제</Dialog.Title><Dialog.Description className="mt-2 text-sm leading-6 text-muted-foreground">“{deleting?.title}”을 삭제합니다. 삭제한 뉴스는 복구할 수 없습니다.</Dialog.Description><div className="mt-5 flex justify-end gap-2"><Button variant="outline" onClick={() => setDeleting(null)} disabled={remove.isPending}>취소</Button><Button variant="destructive" onClick={() => deleting && remove.mutate(deleting.id)} disabled={remove.isPending}>{remove.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}삭제</Button></div></Dialog.Content></Dialog.Portal></Dialog.Root>
  </main>;
}

function NewsEditor({ item, onClose, onSaved }: { item: News | 'new' | null; onClose: () => void; onSaved: (message: string) => Promise<void> }) {
  const initial = item && item !== 'new' ? { title:item.title, source:item.source, url:item.url, published_date:item.published_date, badge:item.badge, category:item.category, summary:item.summary, is_published:item.is_published } : emptyForm();
  const [form, setForm] = useState<NewsForm>(initial);
  const save = useMutation({ mutationFn: async () => { if (!item) return; const payload = { ...form, badge: form.badge || null, summary: form.summary || null, published_date: form.published_date || null, is_manually_managed: true, updated_at: new Date().toISOString() }; const result = item === 'new' ? await supabase.from('news').insert({ ...payload, is_auto_collected: false }) : await supabase.from('news').update(payload).eq('id', item.id); if (result.error) throw result.error; }, onSuccess: () => void onSaved(item === 'new' ? '뉴스를 등록했습니다.' : '뉴스를 수정했습니다.') });
  const submit = (event: FormEvent) => { event.preventDefault(); save.mutate(); };
  return <Dialog.Root key={item === 'new' ? 'new' : item?.id ?? 'closed'} open={Boolean(item)} onOpenChange={open => { if (!open && !save.isPending) onClose(); }}><Dialog.Portal><Dialog.Overlay className="fixed inset-0 z-50 bg-black/60" /><Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-2xl -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-6 shadow-2xl"><Dialog.Title className="text-xl font-bold">{item === 'new' ? '뉴스 직접 등록' : '뉴스 수정'}</Dialog.Title><Dialog.Description className="mt-1 text-sm text-muted-foreground">기사 정보와 사용자 노출 상태를 관리합니다.</Dialog.Description><form onSubmit={submit} className="mt-5 grid gap-4"><Field label="제목"><Input required value={form.title} onChange={event => setForm({...form,title:event.target.value})} /></Field><div className="grid gap-4 sm:grid-cols-2"><Field label="출처"><Input required value={form.source} onChange={event => setForm({...form,source:event.target.value})} /></Field><Field label="게시일"><Input placeholder="YYYY.MM.DD" value={form.published_date ?? ''} onChange={event => setForm({...form,published_date:event.target.value})} /></Field></div><Field label="기사 URL"><Input required type="url" value={form.url} onChange={event => setForm({...form,url:event.target.value})} /></Field><Field label="요약"><Textarea rows={4} value={form.summary ?? ''} onChange={event => setForm({...form,summary:event.target.value})} /></Field><div className="grid gap-4 sm:grid-cols-3"><Field label="분류"><select className="h-10 rounded-md border bg-background px-3" value={form.category} onChange={event => setForm({...form,category:event.target.value as News['category']})}><option value="domestic">국내</option><option value="global">해외</option></select></Field><Field label="배지"><Input value={form.badge ?? ''} onChange={event => setForm({...form,badge:event.target.value})} placeholder="New, Hot 등" /></Field><label className="flex items-end gap-2 pb-2 text-sm"><input type="checkbox" checked={form.is_published} onChange={event => setForm({...form,is_published:event.target.checked})} />사용자에게 노출</label></div>{save.isError && <p className="text-sm text-red-600">저장 실패: {save.error.message}</p>}<div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={onClose} disabled={save.isPending}>취소</Button><Button type="submit" disabled={save.isPending}>{save.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}저장</Button></div></form><Dialog.Close asChild><Button size="icon" variant="ghost" className="absolute right-3 top-3" aria-label="닫기"><X className="size-5" /></Button></Dialog.Close></Dialog.Content></Dialog.Portal></Dialog.Root>;
}

function Summary({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border bg-card p-4"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-1 text-2xl font-bold">{value.toLocaleString('ko-KR')}</p></div>; }
function Field({ label, children }: { label: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label>{label}</Label>{children}</div>; }
