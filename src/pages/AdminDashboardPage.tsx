import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';
import { 
    usePendingTools, 
    useAllTools, 
    useApproveTool, 
    useRejectTool,
    useDeleteTool,
    useAdminStats 
} from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { 
    Card, 
    CardContent, 
    CardDescription, 
    CardHeader, 
    CardTitle 
} from '@/components/ui/card';
import { 
    CheckCircle, 
    XCircle, 
    Plus, 
    Trash2, 
    Edit, 
    RefreshCw,
    Inbox,
    BarChart3,
    Users,
    Newspaper,
    Sparkles,
    Loader2,
    ExternalLink,
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    UserCheck,
    AlertTriangle,
    ChevronDown,
    FileText,
    Link as LinkIcon,
    User,
    Clock,
    Circle
} from 'lucide-react';
import type { Database } from '@/types/supabase';

const REJECTION_REASONS = [
    'AI 도구 또는 AI 기능을 확인할 수 없음',
    '이미 등록되었거나 검토 중인 도구',
    '도구명·설명·URL 정보가 서로 일치하지 않음',
    '설명이 부족하거나 의미 없는 내용으로 작성됨',
    '공식 사이트에 접속할 수 없음',
    '위험하거나 부적절한 사이트로 확인됨',
    '기타',
] as const;

type PendingTool = Database['public']['Tables']['pending_tools']['Row'];

function verificationVariant(status: PendingTool['verification_status']): 'secondary' | 'destructive' | 'outline' {
    if (status === 'verified') return 'secondary';
    if (status === 'failed') return 'destructive';
    return 'outline';
}

function verificationPresentation(status: PendingTool['verification_status']) {
    if (status === 'verified') return {
        label: '자동 검증 통과',
        description: '기본 자동 검사에서 뚜렷한 위험 신호가 발견되지 않았습니다.',
        icon: ShieldCheck,
        panelClass: 'border-green-200 bg-green-50/70 dark:border-green-900 dark:bg-green-950/20',
        iconClass: 'text-green-600 dark:text-green-400',
    };
    if (status === 'failed') return {
        label: '자동 검증 실패',
        description: '접속 또는 안전 검사에 실패했습니다. 승인 전 직접 확인이 필요합니다.',
        icon: ShieldX,
        panelClass: 'border-red-200 bg-red-50/70 dark:border-red-900 dark:bg-red-950/20',
        iconClass: 'text-red-600 dark:text-red-400',
    };
    return {
        label: '관리자 확인 필요',
        description: '자동 검사는 완료됐지만 확인이 필요한 신호가 있습니다.',
        icon: ShieldAlert,
        panelClass: 'border-amber-200 bg-amber-50/70 dark:border-amber-900 dark:bg-amber-950/20',
        iconClass: 'text-amber-600 dark:text-amber-400',
    };
}

function scorePresentation(score: number) {
    if (score >= 80) return { label: '양호', color: 'bg-green-500', text: 'text-green-700 dark:text-green-300' };
    if (score >= 50) return { label: '주의', color: 'bg-amber-500', text: 'text-amber-700 dark:text-amber-300' };
    return { label: '위험', color: 'bg-red-500', text: 'text-red-700 dark:text-red-300' };
}

function trustPresentation(score: number) {
    if (score >= 70) return { label: '높음', color: 'bg-green-500', text: 'text-green-700 dark:text-green-300' };
    if (score >= 40) return { label: '보통', color: 'bg-blue-500', text: 'text-blue-700 dark:text-blue-300' };
    return { label: '낮음', color: 'bg-red-500', text: 'text-red-700 dark:text-red-300' };
}

function SubmissionVerificationPanel({ tool }: { tool: PendingTool }) {
    const verification = verificationPresentation(tool.verification_status);
    const score = scorePresentation(tool.verification_score);
    const trust = trustPresentation(tool.submitter_trust_score);
    const VerificationIcon = verification.icon;
    const signals = Array.isArray(tool.verification_signals) ? tool.verification_signals : [];
    const metadata = tool.source_metadata && typeof tool.source_metadata === 'object' && !Array.isArray(tool.source_metadata)
        ? tool.source_metadata as Record<string, unknown>
        : {};
    const rawBreakdown = metadata.verification_breakdown && typeof metadata.verification_breakdown === 'object' && !Array.isArray(metadata.verification_breakdown)
        ? metadata.verification_breakdown as Record<string, unknown>
        : null;
    const breakdown = rawBreakdown ? [
        ['사이트 안전성', Number(rawBreakdown.safety ?? 0), 30],
        ['서비스 실체', Number(rawBreakdown.legitimacy ?? 0), 25],
        ['AI 도구 관련성', Number(rawBreakdown.ai_relevance ?? 0), 25],
        ['제보 품질', Number(rawBreakdown.submission_quality ?? 0), 20],
    ] as const : [];

    return (
        <div className={`mt-4 rounded-xl border ${verification.panelClass}`}>
            <div className="flex items-start gap-3 p-4 pb-3">
                <div className="rounded-lg bg-background/80 p-2 shadow-sm">
                    <VerificationIcon className={`size-5 ${verification.iconClass}`} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{verification.label}</p>
                        <Badge variant={verificationVariant(tool.verification_status)}>{tool.verification_score}점</Badge>
                    </div>
                    <p className="mt-1 text-xs leading-5 text-muted-foreground">{verification.description}</p>
                </div>
            </div>

            <div className="grid gap-3 px-4 pb-4 sm:grid-cols-2">
                <div className="rounded-lg border bg-background/80 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="font-medium">도구 검증 점수</span>
                        <span className={`font-bold ${score.text}`}>{tool.verification_score}/100 · {score.label}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${score.color}`} style={{ width: `${tool.verification_score}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">80점 이상 양호 · 50~79점 주의 · 49점 이하 위험</p>
                </div>

                <div className="rounded-lg border bg-background/80 p-3">
                    <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-1.5 font-medium"><UserCheck className="size-4" />제보자 신뢰도</span>
                        <span className={`font-bold ${trust.text}`}>{tool.submitter_trust_score}/100 · {trust.label}</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div className={`h-full rounded-full ${trust.color}`} style={{ width: `${tool.submitter_trust_score}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">최초 50점 · 승인 +5 · 거절 -15 · 20점 이하 7일 제한</p>
                </div>
            </div>

        <details className="group border-t border-current/10">
            <summary className="flex cursor-pointer list-none items-center gap-3 px-4 py-3 [&::-webkit-details-marker]:hidden">
                <span className="min-w-0 flex-1 text-sm font-semibold">영역별 점수와 상세 판정 기준 확인</span>
                <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>

            <div className="border-t border-current/10 px-4 pb-4">
            {breakdown.length > 0 && (
                <div className="mt-3 rounded-lg border bg-background/80 p-3">
                    <p className="text-sm font-semibold">영역별 자동 검증 결과</p>
                    <div className="mt-3 grid gap-2 sm:grid-cols-2">
                        {breakdown.map(([label, value, maximum]) => (
                            <div key={label} className="rounded-md bg-muted/50 px-3 py-2">
                                <div className="flex items-center justify-between gap-2 text-xs">
                                    <span>{label}</span>
                                    <span className="font-bold">{value}/{maximum}</span>
                                </div>
                                <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-background">
                                    <div className="h-full rounded-full bg-primary" style={{ width: `${Math.max(0, Math.min(100, value / maximum * 100))}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">확인하지 못한 정보는 ‘미확인’으로 감점하며, 실제 위험이 발견된 경우에만 검증 실패로 처리합니다.</p>
                </div>
            )}

            {tool.verification_summary && (
                <p className="mt-3 rounded-lg bg-background/70 px-3 py-2 text-sm">{tool.verification_summary}</p>
            )}

            {signals.length > 0 ? (
                <div className="mt-3 rounded-lg border border-amber-300/70 bg-amber-100/60 p-3 dark:border-amber-800 dark:bg-amber-950/30">
                    <p className="flex items-center gap-2 text-sm font-semibold text-amber-900 dark:text-amber-200">
                        <AlertTriangle className="size-4" />확인 필요 항목 {signals.length}개
                    </p>
                    <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-800 dark:text-amber-300">
                        {signals.map((signal, index) => <li key={`${tool.id}-signal-${index}`}>{String(signal)}</li>)}
                    </ul>
                </div>
            ) : (
                <p className="mt-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-300">
                    <ShieldCheck className="size-4" />현재 자동 검사에서 별도 위험 신호가 없습니다.
                </p>
            )}
            <div className="mt-3 rounded-lg border bg-background/80 p-3 text-xs leading-5 text-muted-foreground">
                <p className="font-semibold text-foreground">판정 기준</p>
                <p className="mt-1">80~100점 양호 · 60~79점 관리자 확인 · 40~59점 주의 확인 · 0~39점 위험 또는 정보 부족</p>
                <p>AI 관련성이 미확인되면 80점 이상이어도 자동 통과하지 않습니다. 접속 불가·악성 도메인 등 실제 위험은 점수와 관계없이 검증 실패입니다.</p>
            </div>
            </div>
        </details>
        </div>
    );
}

export function AdminDashboardPage() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'overview' | 'pending' | 'tools'>('overview');
    const [rejectingTool, setRejectingTool] = useState<PendingTool | null>(null);
    const [rejectionReason, setRejectionReason] = useState('');
    const [customRejectionReason, setCustomRejectionReason] = useState('');
    
    // Data fetching
    const { data: stats, isLoading: statsLoading } = useAdminStats();
    const { data: pendingTools, isLoading: pendingLoading } = usePendingTools();
    const { data: allTools, isLoading: toolsLoading } = useAllTools();
    
    // Mutations
    const approveTool = useApproveTool();
    const rejectTool = useRejectTool();
    const deleteTool = useDeleteTool();

    const handleApprove = async (pendingTool: PendingTool) => {
        try {
            await approveTool.mutateAsync({
                pendingToolId: pendingTool.id,
                toolData: {
                    name: pendingTool.name || 'Untitled Tool',
                    description: pendingTool.description || 'No description provided',
                    url: pendingTool.url,
                    logo_url: pendingTool.logo_url,
                }
            });
            alert('도구가 성공적으로 승인되었습니다!');
        } catch {
            alert('승인 중 오류가 발생했습니다.');
        }
    };

    const openRejectCard = (tool: PendingTool) => {
        setRejectingTool(tool);
        setRejectionReason('');
        setCustomRejectionReason('');
    };

    const closeRejectCard = () => {
        if (rejectTool.isPending) return;
        setRejectingTool(null);
        setRejectionReason('');
        setCustomRejectionReason('');
    };

    const handleReject = async () => {
        if (!rejectingTool) return;
        const reason = rejectionReason === '기타' ? customRejectionReason.trim() : rejectionReason;
        if (!reason) return;
        try {
            await rejectTool.mutateAsync({
                pendingToolId: rejectingTool.id,
                adminNotes: reason,
            });
            setRejectingTool(null);
            setRejectionReason('');
            setCustomRejectionReason('');
            alert('도구가 거절되었습니다.');
        } catch {
            alert('거절 중 오류가 발생했습니다.');
        }
    };

    const handleDelete = async (toolId: string, toolName: string) => {
        if (!confirm(`정말로 "${toolName}"을(를) 삭제하시겠습니까?`)) return;
        try {
            await deleteTool.mutateAsync(toolId);
            alert('도구가 삭제되었습니다.');
        } catch {
            alert('삭제 중 오류가 발생했습니다.');
        }
    };

    return (
        <main>
            <Dialog.Root open={Boolean(rejectingTool)} onOpenChange={(open) => { if (!open) closeRejectCard(); }}>
                <Dialog.Portal>
                    <Dialog.Overlay className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm" />
                    <Dialog.Content className="fixed left-1/2 top-1/2 z-50 max-h-[90vh] w-[calc(100%-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-2xl border bg-card p-5 shadow-2xl sm:p-6">
                        <Dialog.Title className="text-xl font-bold">도구 제보 거절</Dialog.Title>
                        <Dialog.Description className="mt-1 text-sm text-muted-foreground">
                            <span className="font-medium text-foreground">{rejectingTool?.name || '이름 없음'}</span>을(를) 거절하는 이유를 하나 선택해주세요.
                        </Dialog.Description>

                        <div className="mt-5 grid gap-2" role="radiogroup" aria-label="거절 사유">
                            {REJECTION_REASONS.map((reason) => {
                                const selected = rejectionReason === reason;
                                return (
                                    <button
                                        key={reason}
                                        type="button"
                                        role="radio"
                                        aria-checked={selected}
                                        onClick={() => setRejectionReason(reason)}
                                        className={`flex min-h-11 items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors ${selected ? 'border-red-500 bg-red-50 text-red-800 dark:bg-red-950/30 dark:text-red-200' : 'bg-background hover:bg-muted'}`}
                                    >
                                        <span className={`flex size-4 shrink-0 items-center justify-center rounded-full border ${selected ? 'border-red-600' : 'border-muted-foreground/50'}`}>
                                            {selected && <Circle className="size-2 fill-current text-red-600" />}
                                        </span>
                                        {reason}
                                    </button>
                                );
                            })}
                        </div>

                        {rejectionReason === '기타' && (
                            <div className="mt-4">
                                <label htmlFor="custom-rejection-reason" className="text-sm font-medium">기타 거절 사유</label>
                                <Textarea
                                    id="custom-rejection-reason"
                                    className="mt-2 min-h-24"
                                    maxLength={500}
                                    value={customRejectionReason}
                                    onChange={(event) => setCustomRejectionReason(event.target.value)}
                                    placeholder="거절 사유를 구체적으로 입력해주세요."
                                    autoFocus
                                />
                                <p className="mt-1 text-right text-xs text-muted-foreground">{customRejectionReason.length}/500</p>
                            </div>
                        )}

                        <p className="mt-4 rounded-lg bg-muted px-3 py-2 text-xs leading-5 text-muted-foreground">
                            선택한 사유는 관리자 기록에 저장되며, 거절 시 제보자 신뢰도가 15점 차감됩니다.
                        </p>

                        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
                            <Button type="button" variant="outline" onClick={closeRejectCard} disabled={rejectTool.isPending}>취소</Button>
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleReject}
                                disabled={rejectTool.isPending || !rejectionReason || (rejectionReason === '기타' && !customRejectionReason.trim())}
                            >
                                {rejectTool.isPending && <Loader2 className="mr-2 size-4 animate-spin" />}
                                거절 확정
                            </Button>
                        </div>
                    </Dialog.Content>
                </Dialog.Portal>
            </Dialog.Root>
            <div className="flex flex-col gap-6 sm:gap-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl sm:text-3xl font-bold">도구 관리</h1>
                        <p className="text-muted-foreground mt-1">
                            사용자 제보를 검토하고 등록된 AI 도구를 관리합니다.
                        </p>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                        <Button 
                            variant={activeTab === 'overview' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('overview')}
                            className="gap-2 shrink-0"
                        >
                            <BarChart3 className="size-4" />
                            개요
                        </Button>
                        <Button 
                            variant={activeTab === 'pending' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('pending')}
                            className="gap-2 shrink-0"
                        >
                            <Inbox className="size-4" />
                            대기 중
                            {(stats?.pendingTools ?? 0) > 0 && (
                                <Badge variant="destructive" className="ml-1">
                                    {stats?.pendingTools}
                                </Badge>
                            )}
                        </Button>
                        <Button 
                            variant={activeTab === 'tools' ? 'default' : 'outline'}
                            onClick={() => setActiveTab('tools')}
                            className="gap-2 shrink-0"
                        >
                            <Sparkles className="size-4" />
                            도구 관리
                        </Button>
                    </div>
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    전체 도구
                                </CardTitle>
                                <Sparkles className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {statsLoading ? (
                                        <Loader2 className="size-6 animate-spin" />
                                    ) : (
                                        stats?.totalTools || 0
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    등록된 AI 도구
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    대기 중인 제출
                                </CardTitle>
                                <Inbox className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-brand-purple">
                                    {statsLoading ? (
                                        <Loader2 className="size-6 animate-spin" />
                                    ) : (
                                        stats?.pendingTools || 0
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    승인 대기 중
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    사용자 리뷰
                                </CardTitle>
                                <Users className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {statsLoading ? (
                                        <Loader2 className="size-6 animate-spin" />
                                    ) : (
                                        stats?.totalReviews || 0
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    총 리뷰 수
                                </p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">
                                    뉴스 기사
                                </CardTitle>
                                <Newspaper className="size-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">
                                    {statsLoading ? (
                                        <Loader2 className="size-6 animate-spin" />
                                    ) : (
                                        stats?.totalNews || 0
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground">
                                    수집된 뉴스
                                </p>
                            </CardContent>
                        </Card>

                        {/* Quick Actions */}
                        <Card className="md:col-span-2 lg:col-span-4">
                            <CardHeader>
                                <CardTitle>빠른 작업</CardTitle>
                                <CardDescription>
                                    자주 사용하는 관리 작업
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="grid gap-3 sm:flex sm:flex-wrap sm:gap-4 [&>button]:w-full sm:[&>button]:w-auto">
                                <Button 
                                    onClick={() => navigate('/submit')}
                                    className="gap-2"
                                >
                                    <Plus className="size-4" />
                                    새 도구 추가
                                </Button>
                                <Button 
                                    variant="outline" 
                                    onClick={() => setActiveTab('pending')}
                                    className="gap-2"
                                >
                                    <Inbox className="size-4" />
                                    대기 중인 도구 확인
                                {(stats?.pendingTools ?? 0) > 0 && (
                                    <Badge variant="secondary" className="ml-1">
                                        {stats?.pendingTools}
                                    </Badge>
                                )}
                                </Button>
                                <Button 
                                    variant="outline"
                                    onClick={() => window.location.reload()}
                                    className="gap-2"
                                >
                                    <RefreshCw className="size-4" />
                                    새로고침
                                </Button>
                                <Button variant="outline" onClick={() => navigate('/admin/content')} className="gap-2">
                                    <Newspaper className="size-4" />
                                    메인 콘텐츠 관리
                                </Button>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Pending Tools Tab */}
                {activeTab === 'pending' && (
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold">승인 대기 중인 도구</h2>
                        {pendingLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="size-8 animate-spin text-brand-purple" />
                            </div>
                        ) : pendingTools && pendingTools.length > 0 ? (
                            <div className="grid gap-4">
                                {pendingTools.map((tool) => (
                                    <Card key={tool.id}>
                                        <CardHeader className="p-4 sm:p-6">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                                    {tool.logo_url ? (
                                                        <img 
                                                            src={tool.logo_url} 
                                                            alt={tool.name || ''}
                                                            className="size-12 rounded-lg object-contain bg-muted"
                                                        />
                                                    ) : (
                                                        <div className="size-12 rounded-lg bg-brand-purple/10 flex items-center justify-center">
                                                            <Sparkles className="size-6 text-brand-purple" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <CardTitle className="text-lg">
                                                            {tool.name || '이름 없음'}
                                                        </CardTitle>
                                                        <CardDescription className="break-all">
                                                            제출자: {tool.submitted_by || '익명'} · 
                                                            {' '}{new Date(tool.created_at).toLocaleDateString('ko-KR', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '.')}
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1 px-2 sm:px-3"
                                                        onClick={() => window.open(tool.url, '_blank')}
                                                    >
                                                        <ExternalLink className="size-3" />
                                                        방문
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="default"
                                                        className="gap-1 px-2 sm:px-3 bg-green-600 hover:bg-green-700"
                                                        onClick={() => handleApprove(tool)}
                                                        disabled={approveTool.isPending}
                                                    >
                                                        <CheckCircle className="size-3" />
                                                        승인
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="gap-1 px-2 sm:px-3"
                                                        onClick={() => openRejectCard(tool)}
                                                        disabled={rejectTool.isPending}
                                                    >
                                                        <XCircle className="size-3" />
                                                        거절
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="px-4 pb-4 sm:px-6 sm:pb-6">
                                            <div className="rounded-xl border bg-muted/25 p-4">
                                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">사용자가 제보한 정보</p>
                                                <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-[7rem_minmax(0,1fr)] sm:gap-x-4">
                                                    <dt className="flex items-center gap-2 font-medium text-muted-foreground"><FileText className="size-4" />도구명</dt>
                                                    <dd className="break-words font-semibold text-foreground">{tool.name || '이름 없음'}</dd>

                                                    <dt className="flex items-center gap-2 font-medium text-muted-foreground"><FileText className="size-4" />한 줄 설명</dt>
                                                    <dd className="whitespace-pre-wrap break-words rounded-md bg-background px-3 py-2 leading-6 text-foreground">{tool.description || '설명이 제공되지 않았습니다.'}</dd>

                                                    <dt className="flex items-center gap-2 font-medium text-muted-foreground"><LinkIcon className="size-4" />제출 URL</dt>
                                                    <dd className="min-w-0"><a href={tool.url} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-brand-purple underline-offset-4 hover:underline">{tool.url}</a></dd>

                                                    <dt className="flex items-center gap-2 font-medium text-muted-foreground"><User className="size-4" />제출자</dt>
                                                    <dd className="break-all text-foreground">{tool.submitted_by || '익명'}</dd>

                                                    <dt className="flex items-center gap-2 font-medium text-muted-foreground"><Clock className="size-4" />제출 시각</dt>
                                                    <dd className="text-foreground">{new Date(tool.created_at).toLocaleString('ko-KR', { dateStyle: 'long', timeStyle: 'short' })}</dd>
                                                </dl>
                                            </div>
                                            <SubmissionVerificationPanel tool={tool} />
                                        </CardContent>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="py-12">
                                <CardContent className="text-center">
                                    <Inbox className="size-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-lg font-medium">대기 중인 도구가 없습니다</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        새로운 제출이 들어오면 여기에 표시됩니다.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}

                {/* All Tools Tab */}
                {activeTab === 'tools' && (
                    <div className="space-y-4">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                            <h2 className="text-xl font-semibold">전체 도구 관리</h2>
                            <Button onClick={() => navigate('/submit')} className="gap-2 w-full sm:w-auto">
                                <Plus className="size-4" />
                                새 도구 추가
                            </Button>
                        </div>
                        {toolsLoading ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="size-8 animate-spin text-brand-purple" />
                            </div>
                        ) : allTools && allTools.length > 0 ? (
                            <div className="grid gap-4">
                                {allTools.map((tool) => (
                                    <Card key={tool.id}>
                                        <CardHeader className="p-4 sm:p-6">
                                            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                                                <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                                                    {tool.logo_url ? (
                                                        <img 
                                                            src={tool.logo_url} 
                                                            alt={tool.name}
                                                            className="size-12 rounded-lg object-contain bg-muted"
                                                        />
                                                    ) : (
                                                        <div className="size-12 rounded-lg bg-brand-purple/10 flex items-center justify-center">
                                                            <Sparkles className="size-6 text-brand-purple" />
                                                        </div>
                                                    )}
                                                    <div className="min-w-0">
                                                        <CardTitle className="text-lg flex flex-wrap items-center gap-2">
                                                            {tool.name}
                                                            {tool.is_verified && (
                                                                <Badge variant="secondary">인증</Badge>
                                                            )}
                                                        </CardTitle>
                                                        <CardDescription className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                                            <span>⭐ {tool.average_rating.toFixed(1)}</span>
                                                            <span>({tool.review_count} 리뷰)</span>
                                                            <span>•</span>
                                                            <span>{tool.visit_count.toLocaleString()} 방문</span>
                                                        </CardDescription>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-3 gap-2 sm:flex sm:shrink-0">
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1 px-2 sm:px-3"
                                                        onClick={() => navigate(`/tool/${tool.id}`)}
                                                    >
                                                        <ExternalLink className="size-3" />
                                                        보기
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="gap-1 px-2 sm:px-3"
                                                        onClick={() => navigate(`/admin/tools/${tool.id}/edit`)}
                                                    >
                                                        <Edit className="size-3" />
                                                        수정
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        className="gap-1 px-2 sm:px-3"
                                                        onClick={() => handleDelete(tool.id, tool.name)}
                                                        disabled={deleteTool.isPending}
                                                    >
                                                        <Trash2 className="size-3" />
                                                        삭제
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardHeader>
                                    </Card>
                                ))}
                            </div>
                        ) : (
                            <Card className="py-12">
                                <CardContent className="text-center">
                                    <Sparkles className="size-12 mx-auto text-muted-foreground mb-4" />
                                    <p className="text-lg font-medium">등록된 도구가 없습니다</p>
                                    <Button 
                                        className="mt-4" 
                                        onClick={() => navigate('/submit')}
                                    >
                                        첫 도구 추가하기
                                    </Button>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
}
