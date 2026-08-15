import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabaseClient';
import type { Database } from '@/types/supabase';

export type Review = Database['public']['Tables']['reviews']['Row'] & {
};

// Get reviews for a tool
export function useReviews(toolId: string | undefined) {
  return useQuery({
    queryKey: ['reviews', toolId],
    queryFn: async () => {
      if (!toolId) return [];
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('tool_id', toolId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data as Review[];
    },
    enabled: !!toolId,
    staleTime: 5 * 60 * 1000,
  });
}

// Get user's review for a specific tool
export function useUserReview(toolId: string | undefined, userId: string | undefined) {
  return useQuery({
    queryKey: ['user-review', toolId, userId],
    queryFn: async () => {
      if (!toolId || !userId) return null;
      
      const { data, error } = await supabase
        .from('reviews')
        .select('*')
        .eq('tool_id', toolId)
        .eq('user_id', userId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
      return data as Review | null;
    },
    enabled: !!toolId && !!userId,
  });
}

// Create or update review
export function useUpsertReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({
      toolId,
      userId,
      rating,
      content,
      displayName,
    }: {
      toolId: string;
      userId: string;
      rating: number;
      content: string;
      displayName: string;
    }) => {
      const { data, error } = await supabase
        .from('reviews')
        .upsert({
          tool_id: toolId,
          user_id: userId,
          rating,
          content,
          display_name: displayName,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'tool_id,user_id',
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.toolId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', variables.toolId, variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['tool', variables.toolId] });
    },
  });
}

// Delete review
export function useDeleteReview() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ reviewId }: {
      reviewId: string;
      toolId: string;
      userId: string;
    }) => {
      const { error } = await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);
      
      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reviews', variables.toolId] });
      queryClient.invalidateQueries({ queryKey: ['user-review', variables.toolId, variables.userId] });
      queryClient.invalidateQueries({ queryKey: ['tool', variables.toolId] });
    },
  });
}
