import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { Bell, CheckCheck, ChevronRight, Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabaseClient';

const notificationRoutes: Record<string, string> = {
  content_collection: '/admin/content',
  youtube_auto_rotation: '/admin/content',
  news_collection: '/admin/news',
  news_review: '/admin/news',
  tool_submission: '/admin/tools',
  pending_tool: '/admin/tools',
  security_alert: '/admin/security',
  auth_audit: '/admin/security',
  tool_information_update: '/admin/tool-updates',
  social_content_collection: '/admin/social-content',
};

function getNotificationRoute(notificationType: string, metadata: unknown) {
  if (metadata && typeof metadata === 'object' && !Array.isArray(metadata)) {
    const targetPath = (metadata as Record<string, unknown>).target_path;
    if (typeof targetPath === 'string' && /^\/admin(?:\/|$)/.test(targetPath)) {
      return targetPath;
    }
  }

  return notificationRoutes[notificationType] ?? '/admin/dashboard';
}

export function AdminNotificationCenter() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const notifications = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => {
      const { data, error } = await supabase.from('admin_notifications').select('*').order('created_at', { ascending: false }).limit(50);
      if (error) throw error;
      return data ?? [];
    },
  });
  const markRead = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('admin_notifications').update({ is_read: true }).eq('is_read', false);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-overview-content'] }),
      ]);
    },
  });
  const markNotificationRead = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase.from('admin_notifications').update({ is_read: true }).eq('id', notificationId);
      if (error) throw error;
    },
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['admin-overview-content'] }),
      ]);
    },
  });
  const unreadCount = notifications.data?.filter(item => !item.is_read).length ?? 0;

  const handleNotificationClick = (notification: NonNullable<typeof notifications.data>[number]) => {
    if (!notification.is_read) markNotificationRead.mutate(notification.id);
    setOpen(false);
    navigate(getNotificationRoute(notification.notification_type, notification.metadata));
  };

  return <div className="relative">
    <Button type="button" variant="outline" className="relative gap-2" aria-expanded={open} onClick={() => setOpen(value => !value)}>
      <Bell className="size-4" />전체 알림
      {unreadCount > 0 && <span className="flex min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[11px] font-bold text-white">{unreadCount > 99 ? '99+' : unreadCount}</span>}
    </Button>
    {open && <div className="absolute right-0 top-12 z-40 w-[min(34rem,calc(100vw-2rem))] rounded-2xl border bg-card p-4 shadow-2xl">
      <div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">관리자 전체 알림</h2><p className="mt-0.5 text-xs text-muted-foreground">최근 알림 최대 50개</p></div><div className="flex items-center gap-1">{unreadCount > 0 && <Button size="sm" variant="ghost" className="gap-1" disabled={markRead.isPending} onClick={() => markRead.mutate()}>{markRead.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCheck className="size-4" />}모두 읽음</Button>}<Button size="icon" variant="ghost" aria-label="알림 닫기" onClick={() => setOpen(false)}><X className="size-4" /></Button></div></div>
      <div className="mt-3 grid max-h-[65vh] gap-2 overflow-y-auto pr-1">
        {notifications.isLoading && <div className="flex justify-center py-10"><Loader2 className="size-6 animate-spin" /></div>}
        {notifications.data?.map(notification => <button type="button" key={notification.id} onClick={() => handleNotificationClick(notification)} className={`group w-full rounded-xl px-3 py-3 text-left transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${notification.is_read ? 'bg-muted/40' : 'border border-brand-purple/30 bg-brand-purple/5'}`}><div className="flex items-start justify-between gap-3"><p className="flex min-w-0 items-center gap-2 text-sm font-semibold">{!notification.is_read && <span className="size-2 shrink-0 rounded-full bg-red-500" />}<span className="break-words">{notification.title}</span></p><div className="flex shrink-0 items-center gap-1"><time className="text-[11px] text-muted-foreground">{new Date(notification.created_at).toLocaleString('ko-KR')}</time><ChevronRight className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" /></div></div><p className="mt-1.5 pr-5 text-xs leading-5 text-muted-foreground">{notification.message}</p></button>)}
        {!notifications.isLoading && notifications.data?.length === 0 && <p className="py-10 text-center text-sm text-muted-foreground">확인할 알림이 없습니다.</p>}
      </div>
    </div>}
  </div>;
}
