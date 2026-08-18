import { useEffect, useState } from 'react';
import { Bot, Check, RotateCcw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { RecommendationPreferences } from '@/lib/recommendation';

type Draft = Partial<RecommendationPreferences>;

const questions = [
  { key: 'budget', text: '비용은 어느 정도까지 생각하고 있나요?', options: [
    ['free_or_paid', '무료로 먼저 사용'], ['free', '완전 무료만'], ['paid', '유료 전문 도구'], ['any', '가격 무관'],
  ] },
  { key: 'korean', text: '한국어 지원은 얼마나 중요한가요?', options: [
    ['required', '반드시 필요'], ['preferred', '지원하면 좋음'], ['any', '상관없음'],
  ] },
  { key: 'api', text: '다른 서비스와 연결할 API가 필요한가요?', options: [
    ['required', '반드시 필요'], ['preferred', '있으면 좋음'], ['any', '필요 없음'],
  ] },
  { key: 'priority', text: '추천에서 가장 중요하게 볼 기준은 무엇인가요?', options: [
    ['balanced', '전체 균형'], ['quality', '평판과 품질'], ['easy', '쉬운 사용'], ['verified', '공식 검증'],
  ] },
] as const;

interface Props {
  query: string;
  applied: RecommendationPreferences | null;
  onApply: (preferences: RecommendationPreferences) => void;
  onReset: () => void;
}

export function RecommendationAssistant({ query, applied, onApply, onReset }: Props) {
  const [step, setStep] = useState(0);
  const [draft, setDraft] = useState<Draft>({});

  useEffect(() => { setStep(0); setDraft({}); }, [query]);

  if (!query.trim()) return null;
  if (applied) return <section className="mb-5 rounded-2xl border border-brand-purple/25 bg-brand-purple/5 p-4 sm:p-5">
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="flex items-center gap-2 font-bold"><Sparkles className="size-4 text-brand-purple" />“{query}” 맞춤 추천 결과</p><p className="mt-1 text-sm text-muted-foreground">필수 조건은 필터링하고, 선호 조건과 검색 일치도를 합산해 100점 만점으로 정렬했습니다.</p></div><Button variant="outline" size="sm" className="gap-1" onClick={onReset}><RotateCcw className="size-3.5" />조건 다시 선택</Button></div>
  </section>;

  const question = questions[step];
  const choose = (value: string) => {
    const next = { ...draft, [question.key]: value } as Draft;
    setDraft(next);
    if (step < questions.length - 1) setStep(value => value + 1);
    else onApply(next as RecommendationPreferences);
  };

  return <section className="mb-5 overflow-hidden rounded-2xl border border-brand-purple/30 bg-card shadow-sm">
    <div className="flex items-start gap-3 border-b bg-brand-purple/5 p-4 sm:p-5"><span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-purple text-white"><Bot className="size-5" /></span><div><p className="font-bold">“{query}”에 맞는 도구를 함께 찾아볼게요</p><p className="mt-1 text-sm text-muted-foreground">{question.text}</p></div></div>
    <div className="p-4 sm:p-5"><div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">{question.options.map(([value, label]) => <Button key={value} variant="outline" className="h-auto min-h-11 justify-start whitespace-normal py-2 text-left" onClick={() => choose(value)}>{label}</Button>)}</div><div className="mt-4 flex items-center gap-1.5" aria-label={`${step + 1}/${questions.length} 단계`}>{questions.map((_, index) => <span key={index} className={`h-1.5 flex-1 rounded-full ${index <= step ? 'bg-brand-purple' : 'bg-muted'}`} />)}</div>{step > 0 && <Button variant="ghost" size="sm" className="mt-2 px-0 text-muted-foreground" onClick={() => setStep(value => value - 1)}><Check className="mr-1 size-3.5" />이전 답변 수정</Button>}</div>
  </section>;
}
