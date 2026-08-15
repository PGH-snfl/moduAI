import { useEffect, useState } from 'react';
import type { FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Save } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Database } from '@/types/supabase';

type Tool = Database['public']['Tables']['tools']['Row'];

export function AdminToolEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [form, setForm] = useState<Partial<Tool>>({});
  const [message, setMessage] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const { data: tool, isLoading, error } = useQuery({
    queryKey: ['admin-tool', id],
    enabled: Boolean(id),
    queryFn: async () => {
      const { data, error } = await supabase.from('tools').select('*').eq('id', id!).single();
      if (error) throw error;
      return data as Tool;
    },
  });

  useEffect(() => { if (tool) setForm(tool); }, [tool]);

  const save = useMutation({
    mutationFn: async () => {
      const payload: Database['public']['Tables']['tools']['Update'] = {
        name: form.name?.trim(), description: form.description?.trim(),
        full_description: form.full_description?.trim() || null,
        url: form.url?.trim() || null, logo_url: form.logo_url?.trim() || null,
        pricing_type: form.pricing_type, pricing_start_at: form.pricing_start_at?.trim() || null,
        pricing_summary: form.pricing_summary?.trim() || null,
        pricing_url: form.pricing_url?.trim() || null,
        korean_support_level: form.korean_support_level,
        is_verified: form.is_verified, is_domestic: form.is_domestic,
        has_api: form.has_api, api_url: form.api_url?.trim() || null,
        tool_scope: form.tool_scope,
        primary_features: form.primary_features,
        secondary_features: form.secondary_features,
        key_benefits: form.key_benefits, updated_at: new Date().toISOString(),
      };
      const { error } = await supabase.from('tools').update(payload).eq('id', id!);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['all-tools'] }),
        queryClient.invalidateQueries({ queryKey: ['tools'] }),
        queryClient.invalidateQueries({ queryKey: ['tool', id] }),
      ]);
      setMessage('저장되었습니다.');
    },
    onError: (err) => setMessage(`저장 실패: ${err instanceof Error ? err.message : '알 수 없는 오류'}`),
  });

  const update = <K extends keyof Tool>(key: K, value: Tool[K]) => setForm(prev => ({ ...prev, [key]: value }));
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setMessage('');
    const errors: Record<string, string> = {};
    if (!form.name?.trim()) errors.name = '도구명을 입력해주세요.';
    if (!form.description?.trim()) errors.description = '한줄 설명을 입력해주세요.';
    const validateUrl = (key: string, value?: string | null) => {
      if (!value?.trim()) return;
      try {
        const url = new URL(value);
        if (!['http:', 'https:'].includes(url.protocol)) throw new Error();
      } catch { errors[key] = 'http:// 또는 https://로 시작하는 올바른 URL을 입력해주세요.'; }
    };
    validateUrl('url', form.url);
    validateUrl('logo_url', form.logo_url);
    validateUrl('pricing_url', form.pricing_url);
    validateUrl('api_url', form.api_url);
    if (form.pricing_type === 'Paid' && !form.pricing_start_at?.trim()) errors.pricing_start_at = '유료 도구의 시작 가격을 입력해주세요.';
    if (form.has_api && !form.api_url?.trim()) errors.api_url = 'API 제공 도구는 공식 API 안내 URL이 필요합니다.';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      setMessage('입력 내용을 확인해주세요.');
      return;
    }
    save.mutate();
  };

  if (isLoading) return <div className="flex min-h-[60vh] items-center justify-center"><Loader2 className="size-8 animate-spin" /></div>;
  if (error || !tool) return <div className="container py-20 text-center">도구 정보를 불러오지 못했습니다.</div>;

  return (
    <main className="container max-w-4xl py-8 sm:py-12">
      <Button variant="ghost" onClick={() => navigate('/admin/tools')} className="mb-6 gap-2"><ArrowLeft className="size-4" />도구 관리로 돌아가기</Button>
      <h1 className="text-3xl font-bold">{tool.name} 수정</h1>
      <form onSubmit={submit} className="mt-8 grid gap-6 rounded-xl border bg-card p-5 sm:p-8">
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="도구명" error={fieldErrors.name}><Input aria-invalid={Boolean(fieldErrors.name)} required value={form.name ?? ''} onChange={e => update('name', e.target.value)} /></Field>
          <Field label="공식 URL" error={fieldErrors.url}><Input aria-invalid={Boolean(fieldErrors.url)} type="url" value={form.url ?? ''} onChange={e => update('url', e.target.value)} /></Field>
        </div>
        <Field label="한줄 설명" error={fieldErrors.description}><Textarea aria-invalid={Boolean(fieldErrors.description)} required value={form.description ?? ''} onChange={e => update('description', e.target.value)} /></Field>
        <Field label="상세 설명"><Textarea rows={6} value={form.full_description ?? ''} onChange={e => update('full_description', e.target.value)} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="로고 URL" error={fieldErrors.logo_url}><Input aria-invalid={Boolean(fieldErrors.logo_url)} type="url" value={form.logo_url ?? ''} onChange={e => update('logo_url', e.target.value)} /></Field>
          <Field label="가격 안내 URL" error={fieldErrors.pricing_url}><Input aria-invalid={Boolean(fieldErrors.pricing_url)} type="url" value={form.pricing_url ?? ''} onChange={e => update('pricing_url', e.target.value)} /></Field>
          <Field label="가격 유형"><select className="h-10 rounded-md border bg-background px-3" value={form.pricing_type} onChange={e => update('pricing_type', e.target.value as Tool['pricing_type'])}>{['Free','Freemium','Paid','Contact'].map(v => <option key={v}>{v}</option>)}</select></Field>
          {form.pricing_type !== 'Contact' && <Field label="시작 가격" error={fieldErrors.pricing_start_at}><Input aria-invalid={Boolean(fieldErrors.pricing_start_at)} value={form.pricing_start_at ?? ''} onChange={e => update('pricing_start_at', e.target.value)} /></Field>}
          <Field label="가격 요약"><Input value={form.pricing_summary ?? ''} onChange={e => update('pricing_summary', e.target.value)} /></Field>
          <Field label="한국어 지원"><select className="h-10 rounded-md border bg-background px-3" value={form.korean_support_level} onChange={e => update('korean_support_level', e.target.value as Tool['korean_support_level'])}>{['None','UI only','Full Support'].map(v => <option key={v}>{v}</option>)}</select></Field>
        </div>
        <Field label="주요 기능 (한 줄에 하나)"><Textarea value={(form.key_benefits ?? []).join('\n')} onChange={e => update('key_benefits', e.target.value.split('\n').map(v => v.trim()).filter(Boolean))} /></Field>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="검색 노출 유형">
            <select className="h-10 rounded-md border bg-background px-3" value={form.tool_scope ?? 'specialized'} onChange={e => update('tool_scope', e.target.value as Tool['tool_scope'])}>
              <option value="specialized">전문 도구</option>
              <option value="general">범용 AI</option>
            </select>
          </Field>
          <div className="text-sm text-muted-foreground sm:self-end sm:pb-2">범용 AI는 기능 검색에서 관련성 점수에 0.65가 적용됩니다. 도구명을 직접 검색하면 감점하지 않습니다.</div>
        </div>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="핵심 검색 기능 (한 줄에 하나)"><Textarea value={(form.primary_features ?? []).join('\n')} onChange={e => update('primary_features', e.target.value.split('\n').map(v => v.trim()).filter(Boolean))} /></Field>
          <Field label="보조 검색 기능 (한 줄에 하나)"><Textarea value={(form.secondary_features ?? []).join('\n')} onChange={e => update('secondary_features', e.target.value.split('\n').map(v => v.trim()).filter(Boolean))} /></Field>
        </div>
        <div className="flex flex-wrap gap-5">
          <Check label="정보 검증 완료" checked={Boolean(form.is_verified)} onChange={v => update('is_verified', v)} />
          <Check label="국내 도구" checked={Boolean(form.is_domestic)} onChange={v => update('is_domestic', v)} />
          <Check label="API 제공" checked={Boolean(form.has_api)} onChange={v => update('has_api', v)} />
        </div>
        {form.has_api && <Field label="API 안내 URL" error={fieldErrors.api_url}><Input aria-invalid={Boolean(fieldErrors.api_url)} required type="url" value={form.api_url ?? ''} onChange={e => update('api_url', e.target.value)} /></Field>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-end">
          {message && <p role="status" className="mr-auto text-sm">{message}</p>}
          <Button type="button" variant="outline" onClick={() => navigate('/admin')}>취소</Button>
          <Button type="submit" disabled={save.isPending} className="gap-2">{save.isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}저장</Button>
        </div>
      </form>
    </main>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) { return <div className="grid gap-2"><Label>{label}</Label>{children}{error && <p className="text-xs text-red-600">{error}</p>}</div>; }
function Check({ label, checked, onChange }: { label: string; checked: boolean; onChange: (value: boolean) => void }) { return <label className="flex min-h-10 cursor-pointer items-center gap-2"><input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} className="size-4" />{label}</label>; }
