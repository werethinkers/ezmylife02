export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action_details: Json | null
          action_type: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          action_details?: Json | null
          action_type: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          action_details?: Json | null
          action_type?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      bulk_jobs: {
        Row: {
          completed_at: string | null
          completed_items: number
          created_at: string
          error_message: string | null
          failed_items: number
          id: string
          input_manifest: Json
          output_zip_path: string | null
          outputs: Json
          params: Json
          per_file_meta: Json
          status: string
          tool_id: string
          tool_name: string
          total_credits_charged: number
          total_items: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          completed_items?: number
          created_at?: string
          error_message?: string | null
          failed_items?: number
          id?: string
          input_manifest?: Json
          output_zip_path?: string | null
          outputs?: Json
          params?: Json
          per_file_meta?: Json
          status?: string
          tool_id: string
          tool_name: string
          total_credits_charged?: number
          total_items?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          completed_items?: number
          created_at?: string
          error_message?: string | null
          failed_items?: number
          id?: string
          input_manifest?: Json
          output_zip_path?: string | null
          outputs?: Json
          params?: Json
          per_file_meta?: Json
          status?: string
          tool_id?: string
          tool_name?: string
          total_credits_charged?: number
          total_items?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      coupon_codes: {
        Row: {
          access_type: string
          code: string
          created_at: string
          created_by: string | null
          credit_grant: number | null
          description: string | null
          duration_days: number | null
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          use_count: number
        }
        Insert: {
          access_type?: string
          code: string
          created_at?: string
          created_by?: string | null
          credit_grant?: number | null
          description?: string | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          use_count?: number
        }
        Update: {
          access_type?: string
          code?: string
          created_at?: string
          created_by?: string | null
          credit_grant?: number | null
          description?: string | null
          duration_days?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          use_count?: number
        }
        Relationships: []
      }
      coupon_redemptions: {
        Row: {
          coupon_code: string
          id: string
          redeemed_at: string
          user_id: string
        }
        Insert: {
          coupon_code: string
          id?: string
          redeemed_at?: string
          user_id: string
        }
        Update: {
          coupon_code?: string
          id?: string
          redeemed_at?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          cost_inr: number | null
          created_at: string
          delta: number
          free_delta: number
          id: string
          metadata: Json
          paid_delta: number
          reason: string
          run_id: string | null
          tool_id: string | null
          user_id: string
        }
        Insert: {
          cost_inr?: number | null
          created_at?: string
          delta: number
          free_delta?: number
          id?: string
          metadata?: Json
          paid_delta?: number
          reason: string
          run_id?: string | null
          tool_id?: string | null
          user_id: string
        }
        Update: {
          cost_inr?: number | null
          created_at?: string
          delta?: number
          free_delta?: number
          id?: string
          metadata?: Json
          paid_delta?: number
          reason?: string
          run_id?: string | null
          tool_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_purchases: {
        Row: {
          coupon_code: string | null
          created_at: string
          credits: number
          id: string
          inr_amount: number
          pack_id: string
          paid_at: string | null
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          credits: number
          id?: string
          inr_amount: number
          pack_id: string
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          credits?: number
          id?: string
          inr_amount?: number
          pack_id?: string
          paid_at?: string | null
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      credit_wallets: {
        Row: {
          first_action_bonus_granted: boolean
          free_balance: number
          last_free_reset_at: string | null
          paid_balance: number
          signup_bonus_granted: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          first_action_bonus_granted?: boolean
          free_balance?: number
          last_free_reset_at?: string | null
          paid_balance?: number
          signup_bonus_granted?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          first_action_bonus_granted?: boolean
          free_balance?: number
          last_free_reset_at?: string | null
          paid_balance?: number
          signup_bonus_granted?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      enterprise_inquiries: {
        Row: {
          company: string | null
          company_size: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          status: string
          updated_at: string
          use_case: string | null
          user_id: string | null
        }
        Insert: {
          company?: string | null
          company_size?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          status?: string
          updated_at?: string
          use_case?: string | null
          user_id?: string | null
        }
        Update: {
          company?: string | null
          company_size?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          status?: string
          updated_at?: string
          use_case?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      gemini_api_keys: {
        Row: {
          created_at: string
          failure_count: number
          id: string
          is_active: boolean
          key_value: string
          label: string | null
          last_used_at: string | null
        }
        Insert: {
          created_at?: string
          failure_count?: number
          id?: string
          is_active?: boolean
          key_value: string
          label?: string | null
          last_used_at?: string | null
        }
        Update: {
          created_at?: string
          failure_count?: number
          id?: string
          is_active?: boolean
          key_value?: string
          label?: string | null
          last_used_at?: string | null
        }
        Relationships: []
      }
      gsc_url_status: {
        Row: {
          coverage_state: string | null
          created_at: string
          indexing_state: string | null
          inspection_result: Json
          last_checked_at: string | null
          last_crawl_time: string | null
          page_fetch_state: string | null
          robots_state: string | null
          updated_at: string
          url: string
        }
        Insert: {
          coverage_state?: string | null
          created_at?: string
          indexing_state?: string | null
          inspection_result?: Json
          last_checked_at?: string | null
          last_crawl_time?: string | null
          page_fetch_state?: string | null
          robots_state?: string | null
          updated_at?: string
          url: string
        }
        Update: {
          coverage_state?: string | null
          created_at?: string
          indexing_state?: string | null
          inspection_result?: Json
          last_checked_at?: string | null
          last_crawl_time?: string | null
          page_fetch_state?: string | null
          robots_state?: string | null
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      home_sections: {
        Row: {
          created_at: string
          display_order: number
          id: string
          is_active: boolean
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          slug: string
          subtitle?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          is_active?: boolean
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      ip_leads: {
        Row: {
          context: Json
          created_at: string
          id: string
          kind: string
          message: string | null
          name: string
          owner_id: string
          page_id: string
          phone: string
          status: string
        }
        Insert: {
          context?: Json
          created_at?: string
          id?: string
          kind?: string
          message?: string | null
          name: string
          owner_id: string
          page_id: string
          phone: string
          status?: string
        }
        Update: {
          context?: Json
          created_at?: string
          id?: string
          kind?: string
          message?: string | null
          name?: string
          owner_id?: string
          page_id?: string
          phone?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ip_leads_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "ip_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_orders: {
        Row: {
          created_at: string
          id: string
          inr_amount: number
          page_id: string
          paid_at: string | null
          product_id: string
          razorpay_order_id: string | null
          razorpay_payment_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          inr_amount: number
          page_id: string
          paid_at?: string | null
          product_id: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          inr_amount?: number
          page_id?: string
          paid_at?: string | null
          product_id?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ip_orders_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "ip_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_pages: {
        Row: {
          content: Json
          created_at: string
          expires_at: string | null
          id: string
          owner_id: string
          product_id: string
          published_at: string | null
          published_content: Json | null
          published_variant_id: string | null
          slug: string | null
          status: string
          title: string
          updated_at: string
          variant_id: string
          views: number
        }
        Insert: {
          content?: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id: string
          product_id: string
          published_at?: string | null
          published_content?: Json | null
          published_variant_id?: string | null
          slug?: string | null
          status?: string
          title?: string
          updated_at?: string
          variant_id: string
          views?: number
        }
        Update: {
          content?: Json
          created_at?: string
          expires_at?: string | null
          id?: string
          owner_id?: string
          product_id?: string
          published_at?: string | null
          published_content?: Json | null
          published_variant_id?: string | null
          slug?: string | null
          status?: string
          title?: string
          updated_at?: string
          variant_id?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "ip_pages_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "ip_products"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_products: {
        Row: {
          category: string
          family: string
          hosting_days: number
          id: string
          is_active: boolean
          is_featured: boolean
          name: string
          price_inr: number
          share_overrides: Json
          sort: number
          updated_at: string
        }
        Insert: {
          category: string
          family: string
          hosting_days?: number
          id: string
          is_active?: boolean
          is_featured?: boolean
          name: string
          price_inr: number
          share_overrides?: Json
          sort?: number
          updated_at?: string
        }
        Update: {
          category?: string
          family?: string
          hosting_days?: number
          id?: string
          is_active?: boolean
          is_featured?: boolean
          name?: string
          price_inr?: number
          share_overrides?: Json
          sort?: number
          updated_at?: string
        }
        Relationships: []
      }
      meet_nudge_contacts: {
        Row: {
          business_name: string | null
          connected_via_host_id: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          event_id: string | null
          event_name: string | null
          fun_fact: string | null
          host_id: string
          id: string
          intro_sent: boolean
          linkedin_url: string | null
          location: string | null
          name: string
          occupation: string | null
          phone: string | null
          website: string | null
        }
        Insert: {
          business_name?: string | null
          connected_via_host_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          event_id?: string | null
          event_name?: string | null
          fun_fact?: string | null
          host_id: string
          id?: string
          intro_sent?: boolean
          linkedin_url?: string | null
          location?: string | null
          name: string
          occupation?: string | null
          phone?: string | null
          website?: string | null
        }
        Update: {
          business_name?: string | null
          connected_via_host_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          event_id?: string | null
          event_name?: string | null
          fun_fact?: string | null
          host_id?: string
          id?: string
          intro_sent?: boolean
          linkedin_url?: string | null
          location?: string | null
          name?: string
          occupation?: string | null
          phone?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "meet_nudge_contacts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "meet_nudge_events"
            referencedColumns: ["id"]
          },
        ]
      }
      meet_nudge_events: {
        Row: {
          created_at: string
          date: string | null
          deleted_at: string | null
          host_id: string
          id: string
          location: string | null
          name: string
          slug: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          host_id: string
          id?: string
          location?: string | null
          name: string
          slug: string
        }
        Update: {
          created_at?: string
          date?: string | null
          deleted_at?: string | null
          host_id?: string
          id?: string
          location?: string | null
          name?: string
          slug?: string
        }
        Relationships: []
      }
      meet_nudge_profiles: {
        Row: {
          bio: string | null
          business_name: string | null
          business_url: string | null
          created_at: string
          email: string | null
          host_id: string
          linkedin_url: string | null
          name: string
          nudge_id: string | null
          occupation: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          bio?: string | null
          business_name?: string | null
          business_url?: string | null
          created_at?: string
          email?: string | null
          host_id: string
          linkedin_url?: string | null
          name: string
          nudge_id?: string | null
          occupation?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          bio?: string | null
          business_name?: string | null
          business_url?: string | null
          created_at?: string
          email?: string | null
          host_id?: string
          linkedin_url?: string | null
          name?: string
          nudge_id?: string | null
          occupation?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      notebook_sessions: {
        Row: {
          created_at: string
          editor_content: string | null
          id: string
          session_shortcuts: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          editor_content?: string | null
          id?: string
          session_shortcuts?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          editor_content?: string | null
          id?: string
          session_shortcuts?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      page_views: {
        Row: {
          browser: string | null
          city: string | null
          country: string | null
          created_at: string
          device_type: string | null
          id: string
          ip_address: string | null
          ip_hash: string | null
          os: string | null
          path: string
          referrer: string | null
          session_id: string | null
          time_on_page_ms: number | null
          tool_id: string | null
          user_agent: string | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          ip_hash?: string | null
          os?: string | null
          path: string
          referrer?: string | null
          session_id?: string | null
          time_on_page_ms?: number | null
          tool_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          device_type?: string | null
          id?: string
          ip_address?: string | null
          ip_hash?: string | null
          os?: string | null
          path?: string
          referrer?: string | null
          session_id?: string | null
          time_on_page_ms?: number | null
          tool_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "page_views_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_access: {
        Row: {
          access_type: string
          expires_at: string | null
          granted_at: string
          id: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          user_id: string
        }
        Insert: {
          access_type: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id: string
        }
        Update: {
          access_type?: string
          expires_at?: string | null
          granted_at?: string
          id?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          auth_provider: string | null
          avatar_url: string | null
          bio: string | null
          company: string | null
          created_at: string
          display_name: string | null
          email: string | null
          full_name: string | null
          id: string
          job_title: string | null
          location: string | null
          phone_number: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          job_title?: string | null
          location?: string | null
          phone_number?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          job_title?: string | null
          location?: string | null
          phone_number?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      promptmaster_sessions: {
        Row: {
          created_at: string
          id: string
          session_data: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_data?: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_data?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      saved_recommendations: {
        Row: {
          created_at: string
          id: string
          tools: Json
          updated_at: string
          user_context: string | null
          user_id: string
          workflow: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          tools?: Json
          updated_at?: string
          user_context?: string | null
          user_id: string
          workflow?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          tools?: Json
          updated_at?: string
          user_context?: string | null
          user_id?: string
          workflow?: string | null
        }
        Relationships: []
      }
      startup_analyses: {
        Row: {
          analysis_data: Json
          company_name: string
          company_website: string | null
          created_at: string
          id: string
          markdown_report: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          analysis_data?: Json
          company_name: string
          company_website?: string | null
          created_at?: string
          id?: string
          markdown_report?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          analysis_data?: Json
          company_name?: string
          company_website?: string | null
          created_at?: string
          id?: string
          markdown_report?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tool_favorites: {
        Row: {
          created_at: string
          tool_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          tool_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          tool_id?: string
          user_id?: string
        }
        Relationships: []
      }
      tool_media: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          kind: string
          poster_url: string | null
          sort_order: number
          tool_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          kind: string
          poster_url?: string | null
          sort_order?: number
          tool_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          kind?: string
          poster_url?: string | null
          sort_order?: number
          tool_id?: string
          url?: string
        }
        Relationships: []
      }
      tool_pricing: {
        Row: {
          cost_inr: number
          credit_cost: number
          tool_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cost_inr?: number
          credit_cost?: number
          tool_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cost_inr?: number
          credit_cost?: number
          tool_id?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      tool_promo_pages: {
        Row: {
          created_at: string
          cta_label: string | null
          cta_sublabel: string | null
          features: Json
          final_cta_subtitle: string | null
          final_cta_title: string | null
          footer_badges: Json
          gallery_images: Json
          hero_chips: Json
          hero_eyebrow: string | null
          hero_image_url: string | null
          hero_subtitle: string | null
          hero_title: string | null
          hero_title_accent: string | null
          how_it_works: Json
          id: string
          is_published: boolean
          og_image_url: string | null
          rating: number | null
          reviews_count: number | null
          seo_description: string | null
          seo_title: string | null
          slug: string
          social_proof: string | null
          stats: Json
          testimonials: Json
          tool_id: string
          trust_logos: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          cta_label?: string | null
          cta_sublabel?: string | null
          features?: Json
          final_cta_subtitle?: string | null
          final_cta_title?: string | null
          footer_badges?: Json
          gallery_images?: Json
          hero_chips?: Json
          hero_eyebrow?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          hero_title_accent?: string | null
          how_it_works?: Json
          id?: string
          is_published?: boolean
          og_image_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          social_proof?: string | null
          stats?: Json
          testimonials?: Json
          tool_id: string
          trust_logos?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          cta_label?: string | null
          cta_sublabel?: string | null
          features?: Json
          final_cta_subtitle?: string | null
          final_cta_title?: string | null
          footer_badges?: Json
          gallery_images?: Json
          hero_chips?: Json
          hero_eyebrow?: string | null
          hero_image_url?: string | null
          hero_subtitle?: string | null
          hero_title?: string | null
          hero_title_accent?: string | null
          how_it_works?: Json
          id?: string
          is_published?: boolean
          og_image_url?: string | null
          rating?: number | null
          reviews_count?: number | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          social_proof?: string | null
          stats?: Json
          testimonials?: Json
          tool_id?: string
          trust_logos?: Json
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_promo_pages_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: true
            referencedRelation: "tools_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_requests: {
        Row: {
          admin_notes: string | null
          created_at: string
          email: string
          id: string
          name: string
          status: string
          tool_description: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          created_at?: string
          email: string
          id?: string
          name: string
          status?: string
          tool_description: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          created_at?: string
          email?: string
          id?: string
          name?: string
          status?: string
          tool_description?: string
          updated_at?: string
        }
        Relationships: []
      }
      tool_runs: {
        Row: {
          cost_inr: number | null
          credits_charged: number
          credits_quoted: number
          error: string | null
          finished_at: string | null
          free_used: number
          id: string
          metadata: Json
          paid_used: number
          started_at: string
          status: string
          tool_id: string
          user_id: string
        }
        Insert: {
          cost_inr?: number | null
          credits_charged?: number
          credits_quoted?: number
          error?: string | null
          finished_at?: string | null
          free_used?: number
          id?: string
          metadata?: Json
          paid_used?: number
          started_at?: string
          status?: string
          tool_id: string
          user_id: string
        }
        Update: {
          cost_inr?: number | null
          credits_charged?: number
          credits_quoted?: number
          error?: string | null
          finished_at?: string | null
          free_used?: number
          id?: string
          metadata?: Json
          paid_used?: number
          started_at?: string
          status?: string
          tool_id?: string
          user_id?: string
        }
        Relationships: []
      }
      tool_section_assignments: {
        Row: {
          created_at: string
          id: string
          position: number
          section_id: string
          tool_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          section_id: string
          tool_id: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          section_id?: string
          tool_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tool_section_assignments_section_id_fkey"
            columns: ["section_id"]
            isOneToOne: false
            referencedRelation: "home_sections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tool_section_assignments_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools_catalog"
            referencedColumns: ["id"]
          },
        ]
      }
      tool_sessions: {
        Row: {
          created_at: string
          id: string
          session_data: Json
          tool_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          session_data?: Json
          tool_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          session_data?: Json
          tool_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      tools_catalog: {
        Row: {
          category: string
          created_at: string
          dedicated_route: string | null
          demo_input: string | null
          demo_output: string | null
          description: string
          display_order: number
          has_uploaded_files: boolean
          home_section: string | null
          icon_fit: string
          icon_url: string | null
          id: string
          is_free: boolean
          is_live: boolean
          is_premium: boolean
          name: string
          preview_image_fit: string
          preview_image_url: string | null
          rating: number | null
          review_count: number | null
          source: string
          tool_types: string[]
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          dedicated_route?: string | null
          demo_input?: string | null
          demo_output?: string | null
          description: string
          display_order?: number
          has_uploaded_files?: boolean
          home_section?: string | null
          icon_fit?: string
          icon_url?: string | null
          id: string
          is_free?: boolean
          is_live?: boolean
          is_premium?: boolean
          name: string
          preview_image_fit?: string
          preview_image_url?: string | null
          rating?: number | null
          review_count?: number | null
          source: string
          tool_types?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          dedicated_route?: string | null
          demo_input?: string | null
          demo_output?: string | null
          description?: string
          display_order?: number
          has_uploaded_files?: boolean
          home_section?: string | null
          icon_fit?: string
          icon_url?: string | null
          id?: string
          is_free?: boolean
          is_live?: boolean
          is_premium?: boolean
          name?: string
          preview_image_fit?: string
          preview_image_url?: string | null
          rating?: number | null
          review_count?: number | null
          source?: string
          tool_types?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      user_creations: {
        Row: {
          created_at: string
          id: string
          metadata: Json | null
          prompt: string
          result_url: string | null
          status: string | null
          title: string | null
          tool_type: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          metadata?: Json | null
          prompt: string
          result_url?: string | null
          status?: string | null
          title?: string | null
          tool_type: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          metadata?: Json | null
          prompt?: string
          result_url?: string | null
          status?: string | null
          title?: string | null
          tool_type?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_secrets: {
        Row: {
          gemini_api_key: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          gemini_api_key?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          gemini_api_key?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      utm_links: {
        Row: {
          click_count: number
          created_at: string
          created_by: string | null
          id: string
          label: string
          short_code: string | null
          target_path: string
          utm_campaign: string
          utm_medium: string
          utm_source: string
        }
        Insert: {
          click_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          label: string
          short_code?: string | null
          target_path?: string
          utm_campaign: string
          utm_medium: string
          utm_source: string
        }
        Update: {
          click_count?: number
          created_at?: string
          created_by?: string | null
          id?: string
          label?: string
          short_code?: string | null
          target_path?: string
          utm_campaign?: string
          utm_medium?: string
          utm_source?: string
        }
        Relationships: []
      }
      virasat_media: {
        Row: {
          caption: string | null
          chapter: string | null
          created_at: string
          duration_seconds: number | null
          id: string
          media_type: string
          mp4_storage_path: string | null
          question_index: number | null
          session_id: string
          storage_path: string
          transcode_status: string | null
          user_id: string
        }
        Insert: {
          caption?: string | null
          chapter?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          media_type: string
          mp4_storage_path?: string | null
          question_index?: number | null
          session_id: string
          storage_path: string
          transcode_status?: string | null
          user_id: string
        }
        Update: {
          caption?: string | null
          chapter?: string | null
          created_at?: string
          duration_seconds?: number | null
          id?: string
          media_type?: string
          mp4_storage_path?: string | null
          question_index?: number | null
          session_id?: string
          storage_path?: string
          transcode_status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "virasat_media_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "virasat_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      virasat_sessions: {
        Row: {
          book_content: string | null
          book_style: string
          child_name: string | null
          created_at: string
          current_question: string | null
          father_name: string | null
          history: Json
          id: string
          input_mode: string
          question_count: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          book_content?: string | null
          book_style?: string
          child_name?: string | null
          created_at?: string
          current_question?: string | null
          father_name?: string | null
          history?: Json
          id?: string
          input_mode?: string
          question_count?: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          book_content?: string | null
          book_style?: string
          child_name?: string | null
          created_at?: string
          current_question?: string | null
          father_name?: string | null
          history?: Json
          id?: string
          input_mode?: string
          question_count?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      admin_adjust_credits: {
        Args: {
          _bucket: string
          _delta: number
          _note: string
          _target: string
        }
        Returns: Json
      }
      apply_credit_purchase: {
        Args: { _order_id: string; _payment_id: string; _purchase_id: string }
        Returns: Json
      }
      complete_tool_run: {
        Args: {
          _error?: string
          _run_id: string
          _success: boolean
          _uid: string
        }
        Returns: Json
      }
      compute_credit_cost: { Args: { _cost_inr: number }; Returns: number }
      ensure_wallet: { Args: { _uid: string }; Returns: undefined }
      get_tool_view_counts: {
        Args: { _tool_ids: string[] }
        Returns: {
          last_viewed: string
          tool_id: string
          unique_visitors: number
          view_count: number
        }[]
      }
      get_visitor_sessions: {
        Args: { _limit?: number; _since: string }
        Returns: {
          browser: string
          city: string
          country: string
          device_type: string
          duration_seconds: number
          entry_path: string
          exit_path: string
          first_seen: string
          ip_address: string
          ip_hash: string
          is_bounce: boolean
          last_seen: string
          os: string
          page_count: number
          referrer: string
          session_id: string
          user_email: string
          user_id: string
          utm_campaign: string
          utm_medium: string
          utm_source: string
        }[]
      }
      grant_first_action_bonus: { Args: { _uid: string }; Returns: undefined }
      grant_signup_bonus: { Args: { _uid: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      ip_get_public_page: { Args: { _slug: string }; Returns: Json }
      ip_mark_order_paid: {
        Args: { _payment_id: string; _razorpay_order_id: string }
        Returns: Json
      }
      ip_page_hit: { Args: { _slug: string }; Returns: undefined }
      ip_publish_page: { Args: { _page_id: string }; Returns: Json }
      ip_republish: { Args: { _page_id: string }; Returns: Json }
      ip_slugify: { Args: { _s: string }; Returns: string }
      ip_submit_lead: {
        Args: {
          _context: Json
          _kind: string
          _message: string
          _name: string
          _phone: string
          _slug: string
        }
        Returns: Json
      }
      ip_unpublish: { Args: { _page_id: string }; Returns: Json }
      monthly_free_reset: { Args: never; Returns: number }
      start_tool_run: {
        Args: { _tool_id: string; _uid: string }
        Returns: Json
      }
      validate_coupon: { Args: { _code: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
