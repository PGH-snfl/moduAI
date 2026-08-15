import React, { useState } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { X, ExternalLink, CheckCircle2, Star, Code, Terminal, Lock, Globe2, Building2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Tool } from '../../hooks/useTools';
import { Button } from '@/components/ui/button';

interface ToolDetailModalProps {
    tool: Tool | null;
    open: boolean;
    onClose: () => void;
}

export const ToolDetailModal: React.FC<ToolDetailModalProps> = ({ tool, open, onClose }) => {
    const [activeTab, setActiveTab] = useState<'info' | 'api'>('info'); // New Tab State

    if (!tool) return null;

    return (
        <Dialog.Root open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
            <Dialog.Portal>
                {/* Backdrop */}
                <Dialog.Overlay className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />

                {/* Modal Content */}
                <Dialog.Content className="fixed left-[50%] top-[50%] z-50 w-[calc(100%-1rem)] max-w-3xl translate-x-[-50%] translate-y-[-50%] duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[state=closed]:slide-out-to-left-1/2 data-[state=closed]:slide-out-to-top-[48%] data-[state=open]:slide-in-from-left-1/2 data-[state=open]:slide-in-from-top-[48%] outline-none sm:w-full">

                    <div className="bg-slate-50 dark:bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col max-h-[90vh]">

                        {/* 1. Header Section */}
                        <div className="p-4 sm:p-6 sm:pb-4 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-start gap-3 shrink-0">
                            <div className="flex min-w-0 gap-3 sm:gap-5">
                                <div className="size-14 sm:size-20 shrink-0 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700 shadow-sm overflow-hidden p-1">
                                    <img src={tool.logo_url || ''} alt={tool.name} className="size-full object-cover rounded-lg" />
                                </div>
                                <div>
                                    <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-slate-100 font-tmon mb-1 break-words">{tool.name}</h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium mb-2">{tool.description?.split('#')[0]}</p>
                                    <div className="flex gap-2">
                                        {tool.is_verified && (
                                            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 text-xs font-semibold text-blue-600 dark:text-blue-400">
                                                <CheckCircle2 className="size-3" /> Verified
                                            </span>
                                        )}
                                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 dark:bg-slate-800 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-300">
                                            {tool.pricing_type}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <Dialog.Close className="rounded-full p-2 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer">
                                <X className="size-5 text-slate-500" />
                            </Dialog.Close>
                        </div>

                        {/* Tab Switcher */}
                        <div className="px-6 py-2 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-800 flex gap-4">
                            <button
                                onClick={() => setActiveTab('info')}
                                className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'info' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                상세 정보
                            </button>
                            <button
                                onClick={() => setActiveTab('api')}
                                className={`pb-2 text-sm font-bold border-b-2 transition-colors ${activeTab === 'api' ? 'border-brand-purple text-brand-purple' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                            >
                                API / 개발자
                            </button>
                        </div>

                        {/* 2. Scrollable Body */}
                        <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-950 overflow-y-auto flex-1">

                            {activeTab === 'info' ? (
                                <>
                                    {/* Key Benefits (New) */}
                                    {tool.key_benefits && tool.key_benefits.length > 0 && (
                                        <div className="mb-6 p-5 bg-brand-purple/5 border border-brand-purple/10 rounded-xl">
                                            <h4 className="font-bold text-sm mb-3 flex items-center gap-2 text-brand-purple">
                                                <Star className="size-4 fill-brand-purple" />
                                                이 서비스의 매력 포인트
                                            </h4>
                                            <ul className="space-y-2">
                                                {tool.key_benefits.map((benefit, index) => (
                                                    <li key={index} className="flex items-start gap-2 text-sm text-slate-700 dark:text-slate-300">
                                                        <div className="mt-1.5 size-1.5 rounded-full bg-brand-purple shrink-0" />
                                                        <span>{benefit}</span>
                                                    </li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4 mb-6">
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                                            <Globe2 className="size-5 text-brand-purple mx-auto mb-2" />
                                            <p className="text-xs text-slate-500 mb-1">한국어 지원</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">{tool.korean_support_level === 'Full Support' ? '전체 지원' : tool.korean_support_level === 'UI only' ? 'UI 지원' : '미지원'}</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                                            <Building2 className="size-5 text-brand-purple mx-auto mb-2" />
                                            <p className="text-xs text-slate-500 mb-1">서비스 구분</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">{tool.is_domestic ? '국내 AI' : '글로벌 AI'}</p>
                                        </div>
                                        <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm text-center">
                                            <Code className="size-5 text-brand-purple mx-auto mb-2" />
                                            <p className="text-xs text-slate-500 mb-1">공개 API</p>
                                            <p className="font-bold text-slate-900 dark:text-slate-100">{tool.has_api ? '지원' : '공개 API 확인 안 됨'}</p>
                                        </div>
                                    </div>
                                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-3">서비스 소개</h3>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 leading-6">{tool.full_description || tool.description}</p>
                                    </div>
                                    <div className="mt-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 sm:p-6">
                                        <h3 className="font-bold text-slate-900 dark:text-slate-100 text-base mb-3">가격 요약</h3>
                                        <p className="text-sm font-semibold text-brand-purple mb-3">{tool.pricing_summary || tool.pricing_start_at || '가격 확인 필요'}</p>
                                        {tool.pricing_details && (
                                            <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
                                                {tool.pricing_details.map((detail) => <li key={detail}>• {detail}</li>)}
                                            </ul>
                                        )}
                                    </div>
                                </>
                            ) : (
                                <div className="space-y-6">
                                    {tool.has_api ? (
                                        <>
                                            <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200 dark:border-slate-800 text-center">
                                                <div className="size-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                                    <Code className="size-8 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">{tool.name} API</h3>
                                                <p className="text-slate-600 dark:text-slate-400 mb-6 text-sm max-w-md mx-auto">
                                                    이 서비스는 공식 API를 지원합니다. <br />
                                                    자체 애플리케이션에 {tool.name}의 기능을 연동하여 사용할 수 있습니다.
                                                </p>
                                                {tool.api_url ? <a href={tool.api_url} target="_blank" rel="noopener noreferrer">
                                                    <Button variant="outline" className="gap-2">
                                                        공식 API 문서 보러가기 <ExternalLink className="size-3" />
                                                    </Button>
                                                </a> : <Button variant="outline" disabled>API 문서 확인 중</Button>}
                                            </div>

                                            <div className="bg-slate-100 dark:bg-slate-800/50 p-6 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700">
                                                <h4 className="font-bold text-slate-700 dark:text-slate-300 mb-4 flex items-center gap-2">
                                                    <Terminal className="size-4" /> 빠른 시작 튜토리얼
                                                </h4>
                                                <div className="space-y-2">
                                                    {(tool.api_tutorial_key || tool.api_url) && <a
                                                        href={tool.api_tutorial_key || tool.api_url!}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block"
                                                    >
                                                        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                                            <span className="group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">1. API Key 발급받는 방법</span>
                                                            <ExternalLink className="size-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    </a>
                                                    }

                                                    {(tool.api_tutorial_example || tool.api_url) && <a
                                                        href={tool.api_tutorial_example || tool.api_url!}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block"
                                                    >
                                                        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                                            <span className="group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">2. Python/Node.js 연동 예제</span>
                                                            <ExternalLink className="size-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    </a>
                                                    }

                                                    {(tool.api_tutorial_pricing || tool.api_url) && <a
                                                        href={tool.api_tutorial_pricing || tool.api_url!}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="block"
                                                    >
                                                        <div className="bg-white dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 flex justify-between items-center cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors group">
                                                            <span className="group-hover:text-slate-900 dark:group-hover:text-slate-200 transition-colors">3. 요금제 및 할당량 가이드</span>
                                                            <ExternalLink className="size-3 opacity-50 group-hover:opacity-100 transition-opacity" />
                                                        </div>
                                                    </a>
                                                    }
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <div className="py-20 text-center">
                                            <div className="size-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <Lock className="size-8 text-slate-400" />
                                            </div>
                                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">API 미지원</h3>
                                            <p className="text-slate-500 text-sm">이 서비스는 현재 공개된 API를 제공하지 않습니다.</p>
                                        </div>
                                    )}
                                </div>
                            )}

                        </div>

                        {/* Footer Action */}
                        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col-reverse sm:flex-row justify-end gap-2 shrink-0">
                            <Button asChild variant="outline" size="lg" className="w-full sm:w-auto">
                                <Link to={`/tool/${tool.id}`} onClick={onClose}>상세보기</Link>
                            </Button>
                            {tool.url ? <a
                                href={tool.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full sm:w-auto"
                            >
                                <Button size="lg" className="w-full bg-brand-purple hover:bg-violet-700 text-white font-bold shadow-lg shadow-violet-200 dark:shadow-none">
                                    서비스 방문하기 <ExternalLink className="ml-2 size-4" />
                                </Button>
                            </a>
                            : <Button size="lg" disabled className="w-full sm:w-auto">서비스 링크 확인 중</Button>}
                        </div>

                    </div>

                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};
