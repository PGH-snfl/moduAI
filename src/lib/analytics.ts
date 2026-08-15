import { supabase } from '@/lib/supabaseClient';

export type AnalyticsEvent = 'page_view' | 'tool_click' | 'search' | 'filter' | 'favorite_add' | 'favorite_remove' | 'content_click';

const SESSION_KEY = 'moduai_analytics_session';
const SESSION_TTL = 30 * 24 * 60 * 60 * 1000;

function sessionId() {
  try {
    const stored = JSON.parse(localStorage.getItem(SESSION_KEY) ?? 'null') as { id?: string; expiresAt?: number } | null;
    if (stored?.id && stored.expiresAt && stored.expiresAt > Date.now()) return stored.id;
    const next = { id: crypto.randomUUID(), expiresAt: Date.now() + SESSION_TTL };
    localStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return next.id;
  } catch {
    return crypto.randomUUID();
  }
}

export function recordAnalytics(eventType: AnalyticsEvent, path?: string, metadata: Record<string, string | number | boolean> = {}) {
  void supabase.rpc('record_analytics_event', {
    p_session_id: sessionId(),
    p_event_type: eventType,
    p_path: path ?? null,
    p_metadata: metadata,
  }).then(({ error }) => {
    if (error && import.meta.env.DEV) console.warn('Analytics event was not recorded:', error.message);
  });
}
