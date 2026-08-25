import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Newspaper, RefreshCw, Rss, Share2, ShieldCheck, Wrench } from 'lucide-react';
import { cn } from '@/lib/utils';

const sections = [
  { to: '/admin/dashboard', label: '대시보드', description: '전체 운영 현황', icon: LayoutDashboard },
  { to: '/admin/tools', label: '도구 관리', description: '제보 검토와 등록 도구', icon: Wrench },
  { to: '/admin/tool-updates', label: '정보 업데이트', description: '자동 감지 변경 검토', icon: RefreshCw },
  { to: '/admin/content', label: '메인 콘텐츠 관리', description: '추천·작업물·기술 트렌드', icon: Newspaper },
  { to: '/admin/news', label: '뉴스 관리', description: '기사 확인·수정·노출 관리', icon: Rss },
  { to: '/admin/social-content', label: '소셜 AI 수집', description: '유튜브·인스타·스레드 검토', icon: Share2 },
  { to: '/admin/security', label: '가입·보안 기록', description: '약관 동의와 로그인 감사', icon: ShieldCheck },
];

export function AdminSectionNav() {
  return (
    <nav aria-label="관리자 메뉴" className="grid gap-1">
      {sections.map(({ to, label, description, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => cn(
            'flex min-w-0 items-center gap-3 rounded-xl px-3 py-3 transition-colors hover:bg-muted/60',
            isActive && 'bg-brand-purple/10 text-brand-purple ring-1 ring-brand-purple/20',
          )}
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
            <Icon className="size-5" />
          </span>
          <span className="min-w-0">
            <span className="block font-semibold">{label}</span>
            <span className="block truncate text-xs text-muted-foreground">{description}</span>
          </span>
        </NavLink>
      ))}
    </nav>
  );
}
