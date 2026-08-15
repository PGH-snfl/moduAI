import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';
import { recordAnalytics } from '@/lib/analytics';

export type FeaturedPromotion = Database['public']['Tables']['featured_promotions']['Row'];
export type FeaturedWork = Database['public']['Tables']['featured_works']['Row'];
export type TechnologyTrend = Database['public']['Tables']['ai_technology_trends']['Row'];

export function useFeaturedPromotion() {
  return useQuery({
    queryKey: ['home-content', 'promotion'],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase.from('featured_promotions').select('*').eq('is_active', true).lte('starts_at', now).or(`ends_at.is.null,ends_at.gte.${now}`).order('priority', { ascending: false }).order('starts_at', { ascending: false }).limit(1).maybeSingle();
      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useFeaturedWorks() {
  return useQuery({
    queryKey: ['home-content', 'works'],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data, error } = await supabase.from('featured_works').select('*').eq('status', 'approved').gte('view_count', 10_000).lte('featured_from', today).or(`featured_until.is.null,featured_until.gte.${today}`).order('view_count', { ascending: false }).order('published_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useTechnologyTrends() {
  return useQuery({
    queryKey: ['home-content', 'trends'],
    queryFn: async () => {
      const { data, error } = await supabase.from('ai_technology_trends').select('*').eq('is_active', true).order('display_order').order('calculated_at', { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 15 * 60 * 1000,
  });
}

export function recordHomeContentClick(type: 'promotion' | 'work' | 'trend', id: string) {
  void supabase.rpc('record_home_content_click', { p_content_type: type, p_content_id: id });
  recordAnalytics('content_click', window.location.pathname, { content_type: type, content_id: id });
}
