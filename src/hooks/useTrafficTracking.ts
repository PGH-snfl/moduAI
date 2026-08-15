import { useCallback } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { recordAnalytics } from '@/lib/analytics';

// Extend Window interface for gtag
declare global {
    interface Window {
        gtag?: (...args: unknown[]) => void;
    }
}

// Track tool view/click
export function useTrafficTracking() {
    const trackToolClick = useCallback(async (toolId: string, toolName: string) => {
        try {
            // The RPC only permits an atomic +1 for an existing tool. Clients
            // cannot directly insert or overwrite traffic rows.
            supabase
                .rpc('record_tool_visit', { p_tool_id: toolId })
                .then(({ error }) => {
                    if (error) {
                        console.error('Failed to track tool click:', error);
                    }
                });
            recordAnalytics('tool_click', window.location.pathname, { tool_id: toolId, tool_name: toolName.slice(0, 80) });
            
            // Also track in analytics if available
            if (window.gtag) {
                window.gtag('event', 'tool_click', {
                    event_category: 'engagement',
                    event_label: toolName,
                    tool_id: toolId
                });
            }
        } catch (err) {
            // Silent fail - don't break user experience
            console.error('Traffic tracking error:', err);
        }
    }, []);
    
    const trackSearch = useCallback(async (query: string, resultCount: number) => {
        try {
            recordAnalytics('search', window.location.pathname, { query_length: query.trim().length, result_count: resultCount });
            if (window.gtag) {
                window.gtag('event', 'search', {
                    event_category: 'engagement',
                    event_label: query,
                    value: resultCount
                });
            }
        } catch (err) {
            console.error('Search tracking error:', err);
        }
    }, []);
    
    const trackFilter = useCallback(async (filterType: string, value: string) => {
        try {
            recordAnalytics('filter', window.location.pathname, { filter_type: filterType, value: value.slice(0, 80) });
            if (window.gtag) {
                window.gtag('event', 'filter_use', {
                    event_category: 'engagement',
                    event_label: `${filterType}: ${value}`
                });
            }
        } catch (err) {
            console.error('Filter tracking error:', err);
        }
    }, []);
    
    return {
        trackToolClick,
        trackSearch,
        trackFilter
    };
}

// Get weekly traffic data for charts
export function useWeeklyTraffic(toolId: string | undefined) {
    return useCallback(async () => {
        if (!toolId) return null;
        
        try {
            const { data, error } = await supabase
                .from('traffic_stats')
                .select('*')
                .eq('tool_id', toolId)
                .gte('date', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
                .order('date', { ascending: true });
            
            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Failed to fetch traffic:', err);
            return null;
        }
    }, [toolId]);
}
