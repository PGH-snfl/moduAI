import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';
import { useAuth } from '@/contexts/AuthContext';

// Export the UserFavorite type from Database
export type UserFavorite = Database['public']['Tables']['user_favorites']['Row'];

/**
 * Hook to fetch user's favorite tools
 * @returns Query object with favorites data, loading state, and error
 */
export function useFavorites() {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['favorites', user?.id],
        queryFn: async () => {
            if (!user) return [];

            const { data, error } = await supabase
                .from('user_favorites')
                .select(`
                    *,
                    tools (*)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching favorites:', error);
                throw error;
            }

            return data || [];
        },
        enabled: !!user,
        staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    });
}

/**
 * Hook to check if a specific tool is favorited by the user
 * @param toolId - Tool ID to check
 * @returns boolean indicating if the tool is favorited
 */
export function useIsFavorite(toolId: string | undefined) {
    const { user } = useAuth();

    return useQuery({
        queryKey: ['is-favorite', user?.id, toolId],
        queryFn: async () => {
            if (!user || !toolId) return false;

            const { data, error } = await supabase
                .from('user_favorites')
                .select('id')
                .eq('user_id', user.id)
                .eq('tool_id', toolId)
                .maybeSingle();

            if (error) {
                console.error('Error checking favorite status:', error);
                throw error;
            }

            return !!data;
        },
        enabled: !!user && !!toolId,
        staleTime: 1 * 60 * 1000, // 1 minute cache for quick updates
    });
}

/**
 * Hook to add a tool to favorites
 * @returns Mutation object for adding favorite
 */
export function useAddFavorite() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (toolId: string) => {
            if (!user) throw new Error('User must be logged in to add favorites');

            const { data, error } = await supabase
                .from('user_favorites')
                .insert({
                    user_id: user.id,
                    tool_id: toolId,
                })
                .select()
                .single();

            if (error) {
                // Handle unique constraint violation (already favorited)
                if (error.code === '23505') {
                    throw new Error('This tool is already in your favorites');
                }
                console.error('Error adding favorite:', error);
                throw error;
            }

            return data;
        },
        onSuccess: (_, toolId) => {
            // Invalidate favorites queries
            queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['is-favorite', user?.id, toolId] });
        },
    });
}

/**
 * Hook to remove a tool from favorites
 * @returns Mutation object for removing favorite
 */
export function useRemoveFavorite() {
    const queryClient = useQueryClient();
    const { user } = useAuth();

    return useMutation({
        mutationFn: async (toolId: string) => {
            if (!user) throw new Error('User must be logged in to remove favorites');

            const { error } = await supabase
                .from('user_favorites')
                .delete()
                .eq('user_id', user.id)
                .eq('tool_id', toolId);

            if (error) {
                console.error('Error removing favorite:', error);
                throw error;
            }

            return { success: true, toolId };
        },
        onSuccess: (_, toolId) => {
            // Invalidate favorites queries
            queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['is-favorite', user?.id, toolId] });
        },
    });
}

/**
 * Hook to toggle favorite status (add if not exist, remove if exist)
 * @returns Mutation object for toggling favorite
 */
export function useToggleFavorite() {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const addFavorite = useAddFavorite();
    const removeFavorite = useRemoveFavorite();

    return useMutation({
        mutationFn: async ({ toolId, isCurrentlyFavorite }: { toolId: string; isCurrentlyFavorite: boolean }) => {
            if (!user) throw new Error('User must be logged in to manage favorites');

            if (isCurrentlyFavorite) {
                await removeFavorite.mutateAsync(toolId);
                return { action: 'removed', toolId };
            } else {
                await addFavorite.mutateAsync(toolId);
                return { action: 'added', toolId };
            }
        },
        onSuccess: (_, { toolId }) => {
            // Invalidate favorites queries
            queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['is-favorite', user?.id, toolId] });
        },
    });
}

/**
 * Hook to get favorite count for a tool
 * @param toolId - Tool ID to get count for
 * @returns Number of users who favorited this tool
 */
export function useFavoriteCount(toolId: string | undefined) {
    return useQuery({
        queryKey: ['favorite-count', toolId],
        queryFn: async () => {
            if (!toolId) return 0;

            const { count, error } = await supabase
                .from('user_favorites')
                .select('*', { count: 'exact', head: true })
                .eq('tool_id', toolId);

            if (error) {
                console.error('Error fetching favorite count:', error);
                throw error;
            }

            return count || 0;
        },
        enabled: !!toolId,
        staleTime: 5 * 60 * 1000,
    });
}
