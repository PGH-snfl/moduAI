import { Link } from 'react-router-dom';

export function Footer() {
    return (
        <footer className="border-t bg-muted/50 py-10">
            <div className="container flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex flex-col gap-2 text-center md:text-left">
                    <span className="text-lg font-bold">모두의 AI</span>
                    <p className="text-sm text-muted-foreground w-full md:w-[300px]">
                        한국 사용자를 위한 최적의 생성형 AI 도구 검색 플랫폼.
                    </p>
                </div>

                <div className="flex gap-8 text-sm text-muted-foreground">
                    <div className="flex flex-col gap-2">
                        <span className="font-semibold text-foreground">서비스</span>
                        <Link to="/about" className="hover:underline">소개</Link>
                        <Link to="/submit" className="hover:underline">도구 등록</Link>
                    </div>
                    <div className="flex flex-col gap-2">
                        <span className="font-semibold text-foreground">법적 고지</span>
                        <Link to="/privacy" className="hover:underline">개인정보처리방침</Link>
                        <Link to="/terms" className="hover:underline">이용약관</Link>
                    </div>
                </div>
            </div>
            <div className="container mt-10 pt-4 border-t text-center text-xs text-muted-foreground">
                © 2026 모두의 AI. All rights reserved.
            </div>
        </footer>
    );
}
