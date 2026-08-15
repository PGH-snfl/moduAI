import { Outlet } from 'react-router-dom';
import { AdminSectionNav } from '@/components/admin/AdminSectionNav';
import { AdminNotificationCenter } from '@/components/admin/AdminNotificationCenter';

export function AdminLayout() {
  return (
    <div className="container mx-auto min-h-[calc(100vh-5rem)] px-4 py-5 md:px-6 md:py-6">
      <div className="mb-5 flex items-center justify-between border-b pb-4"><p className="text-sm font-semibold text-muted-foreground">관리자 센터</p><AdminNotificationCenter /></div>
      <div className="grid gap-6 md:grid-cols-[15rem_minmax(0,1fr)]">
      <aside className="md:sticky md:top-24 md:h-fit">
        <div className="rounded-2xl border bg-card p-3 shadow-sm">
          <p className="px-3 pb-3 pt-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground">관리자 메뉴</p>
          <AdminSectionNav />
        </div>
      </aside>
      <div className="min-w-0"><Outlet /></div>
      </div>
    </div>
  );
}
