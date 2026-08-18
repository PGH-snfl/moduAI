import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';

// Export the News type from Database
export type News = Database['public']['Tables']['news']['Row'];
export type NewsCategory = 'domestic' | 'global' | null;

/**
 * Hook to fetch news from Supabase with optional category filtering
 * @param category - Filter by category ('domestic' | 'global' | null for all)
 * @returns Query object with news data, loading state, and error
 */
export function useNews(category: NewsCategory = null) {
    return useQuery({
        queryKey: ['news', category],
        queryFn: async () => {
            let query = supabase
                .from('news')
                .select('*')
                .eq('is_published', true)
                .eq('is_deleted', false)
                .order('published_date', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })
                .limit(20);

            // Apply category filter if specified
            if (category) {
                query = query.eq('category', category);
            }

            const { data, error } = await query;

            if (error) {
                console.error('Error fetching news:', error);
                throw error;
            }

            return data as News[];
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

/**
 * Hook to fetch only the latest 5 news items for widgets
 * @returns Query object with latest news data, loading state, and error
 */
export function useLatestNews() {
    return useQuery({
        queryKey: ['latest-news'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .eq('is_published', true)
                .eq('is_deleted', false)
                .order('published_date', { ascending: false, nullsFirst: false })
                .order('created_at', { ascending: false })
                .limit(5);

            if (error) {
                console.error('Error fetching latest news:', error);
                throw error;
            }

            return data as News[];
        },
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

/**
 * Hook to fetch a single news item by ID
 * @param id - News item ID
 * @returns Query object with news item data, loading state, and error
 */
export function useNewsItem(id: string | undefined) {
    return useQuery({
        queryKey: ['news-item', id],
        queryFn: async () => {
            if (!id) return null;
            
            const { data, error } = await supabase
                .from('news')
                .select('*')
                .eq('id', id)
                .eq('is_published', true)
                .eq('is_deleted', false)
                .single();
            
            if (error) {
                console.error('Error fetching news item:', error);
                throw error;
            }
            
            return data as News;
        },
        enabled: !!id,
        staleTime: 5 * 60 * 1000,
    });
}
