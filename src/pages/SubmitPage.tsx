import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

interface SubmissionStatus {
    type: 'idle' | 'loading' | 'success' | 'error';
    message?: string;
}

export function SubmitPage() {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [url, setUrl] = useState('');
    const [logoUrl, setLogoUrl] = useState('');
    const [status, setStatus] = useState<SubmissionStatus>({ type: 'idle' });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!name.trim() || !description.trim() || !url.trim()) {
            setStatus({ type: 'error', message: '도구명, 한 줄 설명, URL을 입력해주세요.' });
            return;
        }

        setStatus({ type: 'loading' });

        try {
            // Basic URL validation
            let validatedUrl = url.trim();
            if (!validatedUrl.startsWith('http://') && !validatedUrl.startsWith('https://')) {
                validatedUrl = 'https://' + validatedUrl;
            }

            // All submissions go through the authenticated server-side verifier.
            const { data, error } = await supabase.functions.invoke('submit-tool', {
                body: {
                    name: name.trim(),
                    description: description.trim(),
                    url: validatedUrl,
                    logo_url: logoUrl.trim() || null,
                },
            });

            if (error) {
                const context = error.context as Response | undefined;
                let serverMessage = '';
                if (context) {
                    try {
                        const body = await context.clone().json() as { error?: string };
                        serverMessage = body.error || '';
                    } catch { /* Use the generic message below. */ }
                }
                if (context?.status === 409) {
                    setStatus({ 
                        type: 'error', 
                        message: serverMessage || '이미 등록되었거나 관리자가 검토 중인 서비스입니다.'
                    });
                } else {
                    throw new Error(serverMessage || error.message);
                }
                return;
            }

            setStatus({ 
                type: 'success', 
                message: (data as { message?: string } | null)?.message || '제보가 성공적으로 접수되었습니다! 관리자 검토 후 등록됩니다.'
            });
            
            // Reset form
            setName('');
            setDescription('');
            setUrl('');
            setLogoUrl('');

            // Track submission in analytics
            if (window.gtag) {
                window.gtag('event', 'tool_submission', {
                    event_category: 'engagement',
                    event_label: validatedUrl
                });
            }

        } catch (err) {
            console.error('Submission error:', err);
            setStatus({ 
                type: 'error', 
                message: '제보 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.' 
            });
        }
    };

    return (
        <div className="container max-w-xl px-4 py-8 sm:px-6 sm:py-16 lg:py-20">
            <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-6">새로운 AI 도구 제보하기</h1>
            <p className="text-muted-foreground mb-8">
                알고 있는 유용한 AI 서비스를 공유해주세요. <br />
                접수된 정보는 관리자 검토 후 공개됩니다.
            </p>

            <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6 border p-4 sm:p-8 rounded-xl bg-card">
                <div className="space-y-2">
                    <Label htmlFor="name">도구명 *</Label>
                    <Input
                        id="name"
                        placeholder="예: AI 서비스 이름"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        disabled={status.type === 'loading'}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="description">한 줄 설명 *</Label>
                    <Input
                        id="description"
                        placeholder="예: AI 채팅과 검색, 이미지 생성을 제공하는 서비스"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        required
                        disabled={status.type === 'loading'}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="url">서비스 웹사이트 URL *</Label>
                    <Input
                        id="url"
                        type="url"
                        placeholder="https://example.com"
                        value={url}
                        onChange={(e) => setUrl(e.target.value)}
                        required
                        disabled={status.type === 'loading'}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="logoUrl">로고 이미지 URL (선택)</Label>
                    <Input
                        id="logoUrl"
                        type="url"
                        placeholder="https://example.com/logo.png"
                        value={logoUrl}
                        onChange={(e) => setLogoUrl(e.target.value)}
                        disabled={status.type === 'loading'}
                    />
                </div>

                {/* Status Messages */}
                {status.type === 'error' && (
                    <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                        <AlertCircle className="size-5" />
                        <span className="text-sm">{status.message}</span>
                    </div>
                )}

                {status.type === 'success' && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg">
                        <CheckCircle className="size-5" />
                        <span className="text-sm">{status.message}</span>
                    </div>
                )}

                <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={status.type === 'loading'}
                    variant="brand"
                >
                    {status.type === 'loading' ? (
                        <>
                            <Loader2 className="mr-2 size-4 animate-spin" />
                            처리 중...
                        </>
                    ) : (
                        '제보하기'
                    )}
                </Button>

                <p className="text-xs text-muted-foreground text-center">
                    제출 시 이용약관에 동의하는 것으로 간주합니다.
                </p>
            </form>

            {/* Submission Guidelines */}
            <div className="mt-8 sm:mt-12 space-y-4 text-sm text-muted-foreground">
                <h3 className="font-semibold text-foreground">제보 가이드라인</h3>
                <ul className="space-y-2 list-disc list-inside">
                    <li>AI 기능이 핵심인 서비스만 제보해주세요</li>
                    <li>활발히 운영 중인 서비스를 추천합니다</li>
                    <li>한국어 지원 여부를 알려주시면 빠른 검토에 도움이 됩니다</li>
                    <li>URL과 제출 내용은 자동 안전·중복 검사를 거칩니다</li>
                    <li>제보 후 관리자 검토까지 최대 3일이 소요될 수 있습니다</li>
                </ul>
            </div>
        </div>
    );
}
