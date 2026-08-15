import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';

// Export types from Database
export type PendingTool = Database['public']['Tables']['pending_tools']['Row'];
export type Tool = Database['public']['Tables']['tools']['Row'];

/**
 * Hook to fetch all pending tools for admin review
 * @returns Query object with pending tools data
 */
export function usePendingTools() {
    return useQuery({
        queryKey: ['pending-tools'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('pending_tools')
                .select('*')
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching pending tools:', error);
                throw error;
            }

            return data as PendingTool[];
        },
        staleTime: 1 * 60 * 1000, // 1 minute cache
    });
}

/**
 * Hook to fetch all tools (for admin management)
 * @returns Query object with all tools
 */
export function useAllTools() {
    return useQuery({
        queryKey: ['all-tools'],
        queryFn: async () => {
            const { data, error } = await supabase
                .from('tools')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) {
                console.error('Error fetching all tools:', error);
                throw error;
            }

            return data as Tool[];
        },
        staleTime: 5 * 60 * 1000,
    });
}

/**
 * Hook to approve a pending tool
 * @returns Mutation object for approving tool
 */
export function useApproveTool() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            pendingToolId, 
            toolData 
        }: { 
            pendingToolId: string; 
            toolData: Partial<Tool>;
        }) => {
            const { data: newTool, error } = await supabase.rpc('approve_pending_tool', {
                p_pending_tool_id: pendingToolId,
                p_tool_data: toolData,
            });
            if (error) throw error;

            return newTool as Tool;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-tools'] });
            queryClient.invalidateQueries({ queryKey: ['all-tools'] });
            queryClient.invalidateQueries({ queryKey: ['tools'] });
        },
    });
}

/**
 * Hook to reject a pending tool
 * @returns Mutation object for rejecting tool
 */
export function useRejectTool() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            pendingToolId, 
            adminNotes 
        }: { 
            pendingToolId: string; 
            adminNotes?: string;
        }) => {
            const { error } = await supabase
                .from('pending_tools')
                .update({
                    status: 'rejected',
                    admin_notes: adminNotes,
                    reviewed_at: new Date().toISOString(),
                })
                .eq('id', pendingToolId);

            if (error) {
                console.error('Error rejecting tool:', error);
                throw error;
            }

            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['pending-tools'] });
        },
    });
}

/**
 * Hook to add a new tool directly (admin only)
 * @returns Mutation object for adding tool
 */
export function useAddTool() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (toolData: Partial<Tool>) => {
            const { data, error } = await supabase
                .from('tools')
                .insert({
                    name: toolData.name!,
                    description: toolData.description!,
                    full_description: toolData.full_description,
                    url: toolData.url,
                    logo_url: toolData.logo_url,
                    pricing_type: toolData.pricing_type || 'Free',
                    pricing_start_at: toolData.pricing_start_at,
                    korean_support_level: toolData.korean_support_level || 'None',
                    is_verified: toolData.is_verified ?? true,
                    is_domestic: toolData.is_domestic || false,
                    has_api: toolData.has_api || false,
                    api_url: toolData.api_url,
                    api_tutorial_key: toolData.api_tutorial_key,
                    api_tutorial_example: toolData.api_tutorial_example,
                    api_tutorial_pricing: toolData.api_tutorial_pricing,
                    ai_type: toolData.ai_type,
                    key_benefits: toolData.key_benefits,
                    visit_count: toolData.visit_count || 0,
                    average_rating: toolData.average_rating || 0,
                    review_count: toolData.review_count || 0,
                })
                .select()
                .single();

            if (error) {
                console.error('Error adding tool:', error);
                throw error;
            }

            return data as Tool;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-tools'] });
            queryClient.invalidateQueries({ queryKey: ['tools'] });
        },
    });
}

/**
 * Hook to update an existing tool (admin only)
 * @returns Mutation object for updating tool
 */
export function useUpdateTool() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async ({ 
            toolId, 
            updates 
        }: { 
            toolId: string; 
            updates: Partial<Tool>;
        }) => {
            const { data, error } = await supabase
                .from('tools')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', toolId)
                .select()
                .single();

            if (error) {
                console.error('Error updating tool:', error);
                throw error;
            }

            return data as Tool;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-tools'] });
            queryClient.invalidateQueries({ queryKey: ['tools'] });
        },
    });
}

/**
 * Hook to delete a tool (admin only)
 * @returns Mutation object for deleting tool
 */
export function useDeleteTool() {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: async (toolId: string) => {
            const { error } = await supabase
                .from('tools')
                .delete()
                .eq('id', toolId);

            if (error) {
                console.error('Error deleting tool:', error);
                throw error;
            }

            return { success: true };
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['all-tools'] });
            queryClient.invalidateQueries({ queryKey: ['tools'] });
        },
    });
}

/**
 * Hook to get admin dashboard statistics
 * @returns Dashboard stats including counts
 */
export function useAdminStats() {
    return useQuery({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            // Fetch pending tools count
            const { count: pendingCount, error: pendingError } = await supabase
                .from('pending_tools')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'pending');

            if (pendingError) throw pendingError;

            // Fetch total tools count
            const { count: totalTools, error: toolsError } = await supabase
                .from('tools')
                .select('*', { count: 'exact', head: true });

            if (toolsError) throw toolsError;

            // Fetch total reviews count
            const { count: totalReviews, error: reviewsError } = await supabase
                .from('reviews')
                .select('*', { count: 'exact', head: true });

            if (reviewsError) throw reviewsError;

            // Fetch news count
            const { count: totalNews, error: newsError } = await supabase
                .from('news')
                .select('*', { count: 'exact', head: true });

            if (newsError) throw newsError;

            return {
                pendingTools: pendingCount || 0,
                totalTools: totalTools || 0,
                totalReviews: totalReviews || 0,
                totalNews: totalNews || 0,
            };
        },
        staleTime: 1 * 60 * 1000,
    });
}
