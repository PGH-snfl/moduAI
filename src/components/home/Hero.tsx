import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function Hero() {
    const navigate = useNavigate();

    return (
        <section className="relative overflow-hidden bg-background py-20 text-center md:py-32">
            <div className="container relative z-10 mx-auto px-4">
                <h1 className="mb-6 break-keep text-balance font-jalnan text-4xl leading-[1.45] tracking-tight text-foreground sm:text-5xl md:text-6xl">
                    많아도 너~~~무 많아!!<br />
                    나에게 꼭 맞는 <span className="text-brand-purple">생성형 AI 서비스</span> 검색
                </h1>
                <p className="mx-auto mb-12 max-w-2xl text-xl text-muted-foreground text-balance font-arita">
                    검색할 시간도 없습니다! <br className="hidden sm:block" />
                    여러분의 업무 시간을 단축시켜 줄 최고의 AI 도구를 찾으세요.
                </p>

                {/* CTA Button */}
                <div className="flex justify-center">
                    <Button
                        size="lg"
                        className="h-auto min-h-14 max-w-full whitespace-normal rounded-full px-6 py-3 text-base font-bold leading-snug shadow-xl transition-transform hover:scale-105 sm:px-8 sm:text-lg"
                        onClick={() => navigate('/tools')}
                    >
                        나에게 딱 맞는 생성형 AI서비스 찾기 <ArrowRight className="ml-2 size-5" />
                    </Button>
                </div>
            </div>

            {/* Background Decor (Optional Grid or Gradient) */}
            <div className="absolute inset-x-0 top-0 -z-10 h-full w-full bg-[#0F172A] opacity-50 [mask-image:radial-gradient(ellipse_at_center,transparent_20%,black)]" />
            <div className="absolute left-1/2 top-1/2 -z-10 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-brand-purple/10 blur-3xl opacity-30" />
        </section>
    );
}
