export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tools: {
        Row: {
          id: string
          name: string
          description: string
          full_description: string | null
          url: string | null
          logo_url: string | null
          pricing_type: 'Free' | 'Freemium' | 'Paid' | 'Contact'
          pricing_start_at: string | null
          pricing_summary: string | null
          pricing_details: string[] | null
          pricing_currency: string | null
          billing_period: string | null
          pricing_url: string | null
          pricing_verified_at: string | null
          review_count: number
          average_rating: number
          is_verified: boolean
          is_domestic: boolean
          korean_support_level: 'None' | 'UI only' | 'Full Support'
          has_api: boolean
          api_url: string | null
          api_tutorial_key: string | null
          api_tutorial_example: string | null
          api_tutorial_pricing: string | null
          ai_type: 'Native' | 'Augmented' | null
          tool_scope: 'specialized' | 'general'
          primary_features: string[]
          secondary_features: string[]
          key_benefits: string[] | null
          best_for: string[] | null
          limitations: string[] | null
          verification_sources: string[] | null
          verified_at: string | null
          visit_count: number
          github_url: string | null
          wikipedia_title: string | null
          launched_at: string | null
          launch_date_status: string | null
          launch_date_source: string | null
          ranking_score: number
          trending_score: number
          popularity_score: number
          task_ranking_score: number
          rank_updated_at: string | null
          updated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description: string
          full_description?: string | null
          url?: string | null
          logo_url?: string | null
          pricing_type: 'Free' | 'Freemium' | 'Paid' | 'Contact'
          pricing_start_at?: string | null
          pricing_summary?: string | null
          pricing_details?: string[] | null
          pricing_currency?: string | null
          billing_period?: string | null
          pricing_url?: string | null
          pricing_verified_at?: string | null
          review_count?: number
          average_rating?: number
          is_verified?: boolean
          is_domestic?: boolean
          korean_support_level: 'None' | 'UI only' | 'Full Support'
          has_api?: boolean
          api_url?: string | null
          api_tutorial_key?: string | null
          api_tutorial_example?: string | null
          api_tutorial_pricing?: string | null
          ai_type?: 'Native' | 'Augmented' | null
          tool_scope?: 'specialized' | 'general'
          primary_features?: string[]
          secondary_features?: string[]
          key_benefits?: string[] | null
          best_for?: string[] | null
          limitations?: string[] | null
          verification_sources?: string[] | null
          verified_at?: string | null
          visit_count?: number
          github_url?: string | null
          wikipedia_title?: string | null
          launched_at?: string | null
          launch_date_status?: string | null
          launch_date_source?: string | null
          ranking_score?: number
          trending_score?: number
          popularity_score?: number
          task_ranking_score?: number
          rank_updated_at?: string | null
          updated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          full_description?: string | null
          url?: string | null
          logo_url?: string | null
          pricing_type?: 'Free' | 'Freemium' | 'Paid' | 'Contact'
          pricing_start_at?: string | null
          pricing_summary?: string | null
          pricing_details?: string[] | null
          pricing_currency?: string | null
          billing_period?: string | null
          pricing_url?: string | null
          pricing_verified_at?: string | null
          review_count?: number
          average_rating?: number
          is_verified?: boolean
          is_domestic?: boolean
          korean_support_level?: 'None' | 'UI only' | 'Full Support'
          has_api?: boolean
          api_url?: string | null
          api_tutorial_key?: string | null
          api_tutorial_example?: string | null
          api_tutorial_pricing?: string | null
          ai_type?: 'Native' | 'Augmented' | null
          tool_scope?: 'specialized' | 'general'
          primary_features?: string[]
          secondary_features?: string[]
          key_benefits?: string[] | null
          best_for?: string[] | null
          limitations?: string[] | null
          verification_sources?: string[] | null
          verified_at?: string | null
          visit_count?: number
          github_url?: string | null
          wikipedia_title?: string | null
          launched_at?: string | null
          launch_date_status?: string | null
          launch_date_source?: string | null
          ranking_score?: number
          trending_score?: number
          popularity_score?: number
          task_ranking_score?: number
          rank_updated_at?: string | null
          updated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      featured_promotions: {
        Row: {
          id: string; tool_id: string | null; headline: string; description: string; eyebrow: string
          media_url: string | null; video_url: string | null; video_type: 'youtube' | 'direct' | null; destination_url: string; button_text: string; is_sponsored: boolean
          starts_at: string; ends_at: string | null; priority: number; is_active: boolean; click_count: number
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; tool_id?: string | null; headline: string; description: string; eyebrow?: string
          media_url?: string | null; video_url?: string | null; video_type?: 'youtube' | 'direct' | null; destination_url: string; button_text?: string; is_sponsored?: boolean
          starts_at?: string; ends_at?: string | null; priority?: number; is_active?: boolean; click_count?: number
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; tool_id?: string | null; headline?: string; description?: string; eyebrow?: string
          media_url?: string | null; video_url?: string | null; video_type?: 'youtube' | 'direct' | null; destination_url?: string; button_text?: string; is_sponsored?: boolean
          starts_at?: string; ends_at?: string | null; priority?: number; is_active?: boolean; click_count?: number
          created_at?: string; updated_at?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: { id: number; session_id: string; user_id: string | null; event_type: 'page_view' | 'tool_click' | 'search' | 'filter' | 'favorite_add' | 'favorite_remove' | 'content_click'; path: string | null; metadata: Json; created_at: string }
        Insert: { id?: number; session_id: string; user_id?: string | null; event_type: 'page_view' | 'tool_click' | 'search' | 'filter' | 'favorite_add' | 'favorite_remove' | 'content_click'; path?: string | null; metadata?: Json; created_at?: string }
        Update: { id?: number; session_id?: string; user_id?: string | null; event_type?: 'page_view' | 'tool_click' | 'search' | 'filter' | 'favorite_add' | 'favorite_remove' | 'content_click'; path?: string | null; metadata?: Json; created_at?: string }
        Relationships: []
      }
      external_review_sources: {
        Row: { id: string; tool_id: string; provider: 'trustpilot' | 'g2' | 'product_hunt' | 'app_store' | 'google_play' | 'other'; source_name: string; source_url: string; external_product_id: string | null; average_rating: number | null; review_count: number | null; rating_scale: number; analysis_summary: string | null; pros_summary: string[]; cons_summary: string[]; analysis_sample_size: number | null; analyzed_at: string | null; synced_at: string | null; is_active: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; tool_id: string; provider: 'trustpilot' | 'g2' | 'product_hunt' | 'app_store' | 'google_play' | 'other'; source_name: string; source_url: string; external_product_id?: string | null; average_rating?: number | null; review_count?: number | null; rating_scale?: number; analysis_summary?: string | null; pros_summary?: string[]; cons_summary?: string[]; analysis_sample_size?: number | null; analyzed_at?: string | null; synced_at?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; tool_id?: string; provider?: 'trustpilot' | 'g2' | 'product_hunt' | 'app_store' | 'google_play' | 'other'; source_name?: string; source_url?: string; external_product_id?: string | null; average_rating?: number | null; review_count?: number | null; rating_scale?: number; analysis_summary?: string | null; pros_summary?: string[]; cons_summary?: string[]; analysis_sample_size?: number | null; analyzed_at?: string | null; synced_at?: string | null; is_active?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      external_reviews: {
        Row: { id: string; source_id: string; external_review_id: string; rating: number | null; title: string | null; excerpt: string | null; reviewer_name: string | null; review_url: string | null; published_at: string | null; is_verified: boolean; is_featured: boolean; created_at: string; updated_at: string }
        Insert: { id?: string; source_id: string; external_review_id: string; rating?: number | null; title?: string | null; excerpt?: string | null; reviewer_name?: string | null; review_url?: string | null; published_at?: string | null; is_verified?: boolean; is_featured?: boolean; created_at?: string; updated_at?: string }
        Update: { id?: string; source_id?: string; external_review_id?: string; rating?: number | null; title?: string | null; excerpt?: string | null; reviewer_name?: string | null; review_url?: string | null; published_at?: string | null; is_verified?: boolean; is_featured?: boolean; created_at?: string; updated_at?: string }
        Relationships: []
      }
      featured_works: {
        Row: {
          id: string; platform: 'YouTube' | 'Instagram' | 'TikTok' | 'Other'; external_id: string | null
          title: string; creator_name: string; description: string; thumbnail_url: string; content_url: string
          view_count: number | null; like_count: number | null; comment_count: number | null; published_at: string | null
          ai_relevance_score: number | null; popularity_score: number; status: 'draft' | 'approved' | 'rejected'
          featured_from: string; featured_until: string | null; display_order: number; click_count: number; is_auto_managed: boolean
          created_at: string; updated_at: string
        }
        Insert: {
          id?: string; platform: 'YouTube' | 'Instagram' | 'TikTok' | 'Other'; external_id?: string | null
          title: string; creator_name: string; description: string; thumbnail_url: string; content_url: string
          view_count?: number | null; like_count?: number | null; comment_count?: number | null; published_at?: string | null
          ai_relevance_score?: number | null; popularity_score?: number; status?: 'draft' | 'approved' | 'rejected'
          featured_from?: string; featured_until?: string | null; display_order?: number; click_count?: number; is_auto_managed?: boolean
          created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; platform?: 'YouTube' | 'Instagram' | 'TikTok' | 'Other'; external_id?: string | null
          title?: string; creator_name?: string; description?: string; thumbnail_url?: string; content_url?: string
          view_count?: number | null; like_count?: number | null; comment_count?: number | null; published_at?: string | null
          ai_relevance_score?: number | null; popularity_score?: number; status?: 'draft' | 'approved' | 'rejected'
          featured_from?: string; featured_until?: string | null; display_order?: number; click_count?: number; is_auto_managed?: boolean
          created_at?: string; updated_at?: string
        }
        Relationships: []
      }
      ai_technology_trends: {
        Row: {
          id: string; topic_name: string; short_name: string; summary: string; source_label: string; source_url: string
          image_url: string | null; paper_count_7d: number; previous_paper_count_7d: number; growth_rate: number
          representative_papers: Json; calculated_at: string; display_order: number; is_active: boolean
          click_count: number; created_at: string; updated_at: string
        }
        Insert: {
          id?: string; topic_name: string; short_name: string; summary: string; source_label: string; source_url: string
          image_url?: string | null; paper_count_7d?: number; previous_paper_count_7d?: number; growth_rate?: number
          representative_papers?: Json; calculated_at?: string; display_order?: number; is_active?: boolean
          click_count?: number; created_at?: string; updated_at?: string
        }
        Update: {
          id?: string; topic_name?: string; short_name?: string; summary?: string; source_label?: string; source_url?: string
          image_url?: string | null; paper_count_7d?: number; previous_paper_count_7d?: number; growth_rate?: number
          representative_papers?: Json; calculated_at?: string; display_order?: number; is_active?: boolean
          click_count?: number; created_at?: string; updated_at?: string
        }
        Relationships: []
      }
      content_collection_runs: {
        Row: { id: string; source: string; status: 'running' | 'success' | 'partial' | 'failed'; items_found: number; items_saved: number; details: Json; message: string | null; started_at: string; completed_at: string | null }
        Insert: { id?: string; source: string; status?: 'running' | 'success' | 'partial' | 'failed'; items_found?: number; items_saved?: number; details?: Json; message?: string | null; started_at?: string; completed_at?: string | null }
        Update: { id?: string; source?: string; status?: 'running' | 'success' | 'partial' | 'failed'; items_found?: number; items_saved?: number; details?: Json; message?: string | null; started_at?: string; completed_at?: string | null }
        Relationships: []
      }
      admin_notifications: {
        Row: { id: string; notification_type: string; title: string; message: string; metadata: Json; is_read: boolean; created_at: string }
        Insert: { id?: string; notification_type: string; title: string; message: string; metadata?: Json; is_read?: boolean; created_at?: string }
        Update: { id?: string; notification_type?: string; title?: string; message?: string; metadata?: Json; is_read?: boolean; created_at?: string }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          tool_id: string
          user_id: string
          display_name: string
          rating: number
          content: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          tool_id: string
          user_id: string
          display_name?: string
          rating: number
          content?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          display_name?: string
          rating?: number
          content?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      news: {
        Row: {
          id: string
          title: string
          source: string
          url: string
          published_date: string | null
          badge: string | null
          category: 'domestic' | 'global'
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          source: string
          url: string
          published_date?: string | null
          badge?: string | null
          category: 'domestic' | 'global'
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          source?: string
          url?: string
          published_date?: string | null
          badge?: string | null
          category?: 'domestic' | 'global'
          created_at?: string
        }
        Relationships: []
      }
      traffic_stats: {
        Row: {
          id: string
          tool_id: string
          date: string
          visitors: number
          page_views: number
        }
        Insert: {
          id?: string
          tool_id: string
          date: string
          visitors?: number
          page_views?: number
        }
        Update: {
          id?: string
          tool_id?: string
          date?: string
          visitors?: number
          page_views?: number
        }
        Relationships: []
      }
      categories: {
        Row: {
          id: string
          name: string
          slug: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          created_at?: string
        }
        Relationships: []
      }
      tool_categories: {
        Row: {
          tool_id: string
          category_id: string
        }
        Insert: {
          tool_id: string
          category_id: string
        }
        Update: {
          tool_id?: string
          category_id?: string
        }
        Relationships: []
      }
      tags: {
         Row: {
          id: string
          name: string
          slug: string
          tag_group: string | null
          aliases: string[]
          metadata: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          tag_group?: string | null
          aliases?: string[]
          metadata?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          tag_group?: string | null
          aliases?: string[]
          metadata?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      tool_tags: {
        Row: {
          tool_id: string
          tag_id: string
          is_primary: boolean
          position: number
          created_at: string
        }
        Insert: {
          tool_id: string
          tag_id: string
          is_primary?: boolean
          position?: number
          created_at?: string
        }
        Update: {
          tool_id?: string
          tag_id?: string
          is_primary?: boolean
          position?: number
          created_at?: string
        }
        Relationships: []
      }
      pending_tools: {
        Row: {
          id: string
          url: string
          name: string | null
          description: string | null
          logo_url: string | null
          submitted_by: string | null
          status: 'pending' | 'approved' | 'rejected'
          admin_notes: string | null
          created_at: string
          reviewed_at: string | null
          submitted_by_user_id: string | null
          normalized_url: string | null
          root_domain: string | null
          verification_status: 'verified' | 'review' | 'failed'
          verification_score: number
          verification_summary: string | null
          verification_signals: Json
          source_metadata: Json
          submitter_trust_score: number
        }
        Insert: {
          id?: string
          url: string
          name?: string | null
          description?: string | null
          logo_url?: string | null
          submitted_by?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
          submitted_by_user_id?: string | null
          normalized_url?: string | null
          root_domain?: string | null
          verification_status?: 'verified' | 'review' | 'failed'
          verification_score?: number
          verification_summary?: string | null
          verification_signals?: Json
          source_metadata?: Json
          submitter_trust_score?: number
        }
        Update: {
          id?: string
          url?: string
          name?: string | null
          description?: string | null
          logo_url?: string | null
          submitted_by?: string | null
          status?: 'pending' | 'approved' | 'rejected'
          admin_notes?: string | null
          created_at?: string
          reviewed_at?: string | null
          submitted_by_user_id?: string | null
          normalized_url?: string | null
          root_domain?: string | null
          verification_status?: 'verified' | 'review' | 'failed'
          verification_score?: number
          verification_summary?: string | null
          verification_signals?: Json
          source_metadata?: Json
          submitter_trust_score?: number
        }
        Relationships: []
      }
      submitter_reputation: {
        Row: {
          user_id: string
          trust_score: number
          approved_count: number
          rejected_count: number
          last_submission_at: string | null
          submission_blocked_until: string | null
          updated_at: string
        }
        Insert: {
          user_id: string
          trust_score?: number
          approved_count?: number
          rejected_count?: number
          last_submission_at?: string | null
          submission_blocked_until?: string | null
          updated_at?: string
        }
        Update: {
          trust_score?: number
          approved_count?: number
          rejected_count?: number
          last_submission_at?: string | null
          submission_blocked_until?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          id: string
          user_id: string
          tool_id: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          tool_id: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          tool_id?: string
          created_at?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: string
          display_name: string | null
          avatar_url: string | null
          interests: string[] | null
          preferred_categories: string[] | null
          usage_stats: Json | null
          onboarding_completed: boolean
          signup_provider: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          display_name?: string | null
          avatar_url?: string | null
          interests?: string[] | null
          preferred_categories?: string[] | null
          usage_stats?: Json | null
          onboarding_completed?: boolean
          signup_provider?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          display_name?: string | null
          avatar_url?: string | null
          interests?: string[] | null
          preferred_categories?: string[] | null
          usage_stats?: Json | null
          onboarding_completed?: boolean
          signup_provider?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_consents: {
        Row: { id: number; user_id: string; document_type: 'terms' | 'privacy'; document_version: string; acceptance_method: 'email_signup' | 'social_onboarding'; provider: 'email' | 'google' | 'kakao' | 'other'; accepted_at: string }
        Insert: { id?: number; user_id: string; document_type: 'terms' | 'privacy'; document_version: string; acceptance_method: 'email_signup' | 'social_onboarding'; provider: 'email' | 'google' | 'kakao' | 'other'; accepted_at?: string }
        Update: { id?: number; user_id?: string; document_type?: 'terms' | 'privacy'; document_version?: string; acceptance_method?: 'email_signup' | 'social_onboarding'; provider?: 'email' | 'google' | 'kakao' | 'other'; accepted_at?: string }
        Relationships: []
      }
      auth_audit_events: {
        Row: { id: number; user_id: string | null; event_type: 'sign_in' | 'sign_out' | 'signup_completed' | 'password_changed' | 'identity_linked'; provider: 'email' | 'google' | 'kakao' | 'other'; success: boolean; metadata: Json; created_at: string }
        Insert: { id?: number; user_id?: string | null; event_type: 'sign_in' | 'sign_out' | 'signup_completed' | 'password_changed' | 'identity_linked'; provider?: 'email' | 'google' | 'kakao' | 'other'; success?: boolean; metadata?: Json; created_at?: string }
        Update: { id?: number; user_id?: string | null; event_type?: 'sign_in' | 'sign_out' | 'signup_completed' | 'password_changed' | 'identity_linked'; provider?: 'email' | 'google' | 'kakao' | 'other'; success?: boolean; metadata?: Json; created_at?: string }
        Relationships: []
      }
      user_activities: {
        Row: {
          id: string
          user_id: string
          activity_type: string
          tool_id: string | null
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          activity_type: string
          tool_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          activity_type?: string
          tool_id?: string | null
          metadata?: Json | null
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      tool_rankings: {
        Row: {
          id: string
          name: string
          description: string | null
          logo_url: string | null
          pricing_type: 'Free' | 'Freemium' | 'Paid' | 'Contact' | null
          is_domestic: boolean | null
          average_rating: number | null
          review_count: number | null
          actual_visitors_30d: number | null
          actual_page_views_30d: number | null
          total_visit_count: number | null
          ranking_score: number | null
          popularity_level: string | null
        }
        Relationships: []
      }
      trending_tools: {
        Row: {
          id: string
          name: string
          description: string | null
          full_description: string | null
          url: string | null
          logo_url: string | null
          pricing_type: 'Free' | 'Freemium' | 'Paid' | 'Contact' | null
          pricing_start_at: string | null
          korean_support_level: 'None' | 'UI only' | 'Full Support' | null
          is_verified: boolean | null
          is_domestic: boolean | null
          average_rating: number | null
          review_count: number | null
          visit_count: number | null
          has_api: boolean | null
          api_url: string | null
          api_tutorial_key: string | null
          api_tutorial_example: string | null
          api_tutorial_pricing: string | null
          ai_type: 'Native' | 'Augmented' | null
          key_benefits: string[] | null
          created_at: string | null
          updated_at: string | null
          recent_visitors: number | null
          previous_visitors: number | null
          growth_rate: number | null
        }
        Relationships: []
      }
      category_rankings: {
        Row: {
          category_name: string | null
          slug: string | null
          tool_count: number | null
          avg_rating: number | null
          total_visits: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      record_analytics_event: { Args: { p_session_id: string; p_event_type: string; p_path?: string | null; p_metadata?: Json }; Returns: undefined }
      get_admin_analytics_summary: { Args: { p_days?: number }; Returns: Json }
      record_tool_visit: {
        Args: { p_tool_id: string }
        Returns: undefined
      }
      record_home_content_click: {
        Args: { p_content_type: string; p_content_id: string }
        Returns: undefined
      }
      approve_pending_tool: {
        Args: { p_pending_tool_id: string; p_tool_data?: Json }
        Returns: Database['public']['Tables']['tools']['Row']
      }
      record_auth_audit_event: { Args: { p_event_type: string; p_provider?: string | null; p_metadata?: Json }; Returns: undefined }
      complete_social_onboarding: { Args: { p_display_name: string; p_avatar_url: string | null; p_terms_version: string; p_privacy_version: string }; Returns: undefined }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
