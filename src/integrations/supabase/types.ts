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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      account_deletion_requests: {
        Row: {
          email: string | null
          handled_at: string | null
          reason: string | null
          requested_at: string
          source: string
          status: string
          user_id: string
        }
        Insert: {
          email?: string | null
          handled_at?: string | null
          reason?: string | null
          requested_at?: string
          source?: string
          status?: string
          user_id: string
        }
        Update: {
          email?: string | null
          handled_at?: string | null
          reason?: string | null
          requested_at?: string
          source?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
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
      ai_answer_cache: {
        Row: {
          created_at: string
          created_by: string | null
          key: string
          output: Json
          tool_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          key: string
          output: Json
          tool_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          key?: string
          output?: Json
          tool_id?: string
        }
        Relationships: []
      }
      api_key_runs: {
        Row: {
          created_at: string
          credits: number
          id: number
          key_id: string | null
          run_id: string | null
          tool_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits?: number
          id?: number
          key_id?: string | null
          run_id?: string | null
          tool_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          id?: number
          key_id?: string | null
          run_id?: string | null
          tool_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_key_runs_key_id_fkey"
            columns: ["key_id"]
            isOneToOne: false
            referencedRelation: "api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      api_keys: {
        Row: {
          allowed_tools: string[] | null
          app: string | null
          created_at: string
          daily_cap: number
          id: string
          key_hash: string
          last_used_at: string | null
          name: string
          prefix: string
          revoked_at: string | null
          user_id: string
        }
        Insert: {
          allowed_tools?: string[] | null
          app?: string | null
          created_at?: string
          daily_cap?: number
          id?: string
          key_hash: string
          last_used_at?: string | null
          name?: string
          prefix: string
          revoked_at?: string | null
          user_id: string
        }
        Update: {
          allowed_tools?: string[] | null
          app?: string | null
          created_at?: string
          daily_cap?: number
          id?: string
          key_hash?: string
          last_used_at?: string | null
          name?: string
          prefix?: string
          revoked_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      apple_purchases: {
        Row: {
          created_at: string
          credits: number
          environment: string
          original_transaction_id: string | null
          pack_id: string
          product_id: string
          transaction_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credits: number
          environment: string
          original_transaction_id?: string | null
          pack_id: string
          product_id: string
          transaction_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          credits?: number
          environment?: string
          original_transaction_id?: string | null
          pack_id?: string
          product_id?: string
          transaction_id?: string
          user_id?: string
        }
        Relationships: []
      }
      bhed_chart_media: {
        Row: {
          chart_id: string
          data_b64: string
          id: string
          mime: string
          name: string
          user_id: string
        }
        Insert: {
          chart_id: string
          data_b64: string
          id: string
          mime: string
          name: string
          user_id?: string
        }
        Update: {
          chart_id?: string
          data_b64?: string
          id?: string
          mime?: string
          name?: string
          user_id?: string
        }
        Relationships: []
      }
      bhed_charts: {
        Row: {
          created_ms: number
          document: string
          id: string
          title: string
          updated_ms: number
          user_id: string
        }
        Insert: {
          created_ms: number
          document: string
          id: string
          title?: string
          updated_ms: number
          user_id?: string
        }
        Update: {
          created_ms?: number
          document?: string
          id?: string
          title?: string
          updated_ms?: number
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
      card_promo_claims: {
        Row: {
          claimed_at: string
          credits: number
          id: string
          promo_id: string
          user_id: string
        }
        Insert: {
          claimed_at?: string
          credits: number
          id?: string
          promo_id: string
          user_id: string
        }
        Update: {
          claimed_at?: string
          credits?: number
          id?: string
          promo_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "card_promo_claims_promo_id_fkey"
            columns: ["promo_id"]
            isOneToOne: false
            referencedRelation: "card_promos"
            referencedColumns: ["id"]
          },
        ]
      }
      card_promos: {
        Row: {
          claim_count: number
          code: string
          created_at: string
          created_by: string | null
          credits: number
          expires_at: string | null
          id: string
          is_active: boolean
          kind: string
          label: string | null
          max_claims: number | null
          per_app_limit: number
        }
        Insert: {
          claim_count?: number
          code: string
          created_at?: string
          created_by?: string | null
          credits?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          label?: string | null
          max_claims?: number | null
          per_app_limit?: number
        }
        Update: {
          claim_count?: number
          code?: string
          created_at?: string
          created_by?: string | null
          credits?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          label?: string | null
          max_claims?: number | null
          per_app_limit?: number
        }
        Relationships: []
      }
      catalog_categories: {
        Row: {
          created_at: string
          doc_get: string | null
          doc_give: string | null
          get_text: string
          give: string
          goal: string
          kind: string
          line: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          doc_get?: string | null
          doc_give?: string | null
          get_text?: string
          give?: string
          goal?: string
          kind?: string
          line?: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          doc_get?: string | null
          doc_give?: string | null
          get_text?: string
          give?: string
          goal?: string
          kind?: string
          line?: string
          name?: string
          sort_order?: number
          updated_at?: string
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
          promo_delta: number
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
          promo_delta?: number
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
          promo_delta?: number
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
          ref_code: string | null
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
          ref_code?: string | null
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
          ref_code?: string | null
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
          promo_balance: number
          promo_per_app_limit: number
          signup_bonus_granted: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          first_action_bonus_granted?: boolean
          free_balance?: number
          last_free_reset_at?: string | null
          paid_balance?: number
          promo_balance?: number
          promo_per_app_limit?: number
          signup_bonus_granted?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          first_action_bonus_granted?: boolean
          free_balance?: number
          last_free_reset_at?: string | null
          paid_balance?: number
          promo_balance?: number
          promo_per_app_limit?: number
          signup_bonus_granted?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      dev_ai_samples: {
        Row: {
          app_id: string
          created_at: string
          id: string
          inputs: Json | null
          output: string
          spec_sha: string
          user_id: string | null
          version_id: string | null
        }
        Insert: {
          app_id: string
          created_at?: string
          id?: string
          inputs?: Json | null
          output: string
          spec_sha: string
          user_id?: string | null
          version_id?: string | null
        }
        Update: {
          app_id?: string
          created_at?: string
          id?: string
          inputs?: Json | null
          output?: string
          spec_sha?: string
          user_id?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dev_ai_samples_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "dev_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_ai_samples_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "dev_app_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_ai_usage: {
        Row: {
          app_id: string | null
          cost_inr: number
          created_at: string
          id: string
          in_tokens: number
          mode: string
          model: string
          ok: boolean
          out_tokens: number
          spec_sha: string | null
          user_id: string | null
          version_id: string | null
        }
        Insert: {
          app_id?: string | null
          cost_inr?: number
          created_at?: string
          id?: string
          in_tokens?: number
          mode: string
          model: string
          ok?: boolean
          out_tokens?: number
          spec_sha?: string | null
          user_id?: string | null
          version_id?: string | null
        }
        Update: {
          app_id?: string | null
          cost_inr?: number
          created_at?: string
          id?: string
          in_tokens?: number
          mode?: string
          model?: string
          ok?: boolean
          out_tokens?: number
          spec_sha?: string | null
          user_id?: string | null
          version_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dev_ai_usage_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "dev_apps"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dev_ai_usage_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "dev_app_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_app_images: {
        Row: {
          bytes: number
          caption: string | null
          created_at: string
          data: string
          developer_id: string
          id: string
          mime: string
          position: number
          version_id: string
        }
        Insert: {
          bytes: number
          caption?: string | null
          created_at?: string
          data: string
          developer_id: string
          id?: string
          mime: string
          position: number
          version_id: string
        }
        Update: {
          bytes?: number
          caption?: string | null
          created_at?: string
          data?: string
          developer_id?: string
          id?: string
          mime?: string
          position?: number
          version_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_app_images_version_id_fkey"
            columns: ["version_id"]
            isOneToOne: false
            referencedRelation: "dev_app_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_app_versions: {
        Row: {
          app_id: string
          category: string | null
          charge_options: Json
          created_at: string
          description: string
          developer_id: string
          html: string
          html_sha256: string | null
          id: string
          name: string
          promo: Json | null
          qa: Json | null
          qa_at: string | null
          qa_passed: boolean
          release_notes: string | null
          review_notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          short_description: string
          similar_note: string | null
          source: Json | null
          spec: Json | null
          status: string
          submitted_at: string | null
          support_email: string | null
          tool_types: string[]
          updated_at: string
          version_no: number
        }
        Insert: {
          app_id: string
          category?: string | null
          charge_options?: Json
          created_at?: string
          description?: string
          developer_id: string
          html?: string
          html_sha256?: string | null
          id?: string
          name?: string
          promo?: Json | null
          qa?: Json | null
          qa_at?: string | null
          qa_passed?: boolean
          release_notes?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          short_description?: string
          similar_note?: string | null
          source?: Json | null
          spec?: Json | null
          status?: string
          submitted_at?: string | null
          support_email?: string | null
          tool_types?: string[]
          updated_at?: string
          version_no: number
        }
        Update: {
          app_id?: string
          category?: string | null
          charge_options?: Json
          created_at?: string
          description?: string
          developer_id?: string
          html?: string
          html_sha256?: string | null
          id?: string
          name?: string
          promo?: Json | null
          qa?: Json | null
          qa_at?: string | null
          qa_passed?: boolean
          release_notes?: string | null
          review_notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          short_description?: string
          similar_note?: string | null
          source?: Json | null
          spec?: Json | null
          status?: string
          submitted_at?: string | null
          support_email?: string | null
          tool_types?: string[]
          updated_at?: string
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "dev_app_versions_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "dev_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_apps: {
        Row: {
          charge_plan: Json | null
          created_at: string
          credits: number | null
          developer_id: string
          id: string
          kind: string
          live_version_id: string | null
          share_pct: number | null
          status: string
          tool_id: string
          updated_at: string
        }
        Insert: {
          charge_plan?: Json | null
          created_at?: string
          credits?: number | null
          developer_id: string
          id?: string
          kind?: string
          live_version_id?: string | null
          share_pct?: number | null
          status?: string
          tool_id: string
          updated_at?: string
        }
        Update: {
          charge_plan?: Json | null
          created_at?: string
          credits?: number | null
          developer_id?: string
          id?: string
          kind?: string
          live_version_id?: string | null
          share_pct?: number | null
          status?: string
          tool_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_apps_live_version_fk"
            columns: ["live_version_id"]
            isOneToOne: false
            referencedRelation: "dev_app_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_upload_parts: {
        Row: {
          data: string
          part_no: number
          upload_id: string
        }
        Insert: {
          data: string
          part_no: number
          upload_id: string
        }
        Update: {
          data?: string
          part_no?: number
          upload_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "dev_upload_parts_upload_id_fkey"
            columns: ["upload_id"]
            isOneToOne: false
            referencedRelation: "dev_uploads"
            referencedColumns: ["id"]
          },
        ]
      }
      dev_uploads: {
        Row: {
          app_id: string
          created_at: string
          developer_id: string
          expires_at: string
          finished_at: string | null
          id: string
          key_hash: string | null
          source: Json | null
        }
        Insert: {
          app_id: string
          created_at?: string
          developer_id: string
          expires_at?: string
          finished_at?: string | null
          id?: string
          key_hash?: string | null
          source?: Json | null
        }
        Update: {
          app_id?: string
          created_at?: string
          developer_id?: string
          expires_at?: string
          finished_at?: string | null
          id?: string
          key_hash?: string | null
          source?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "dev_uploads_app_id_fkey"
            columns: ["app_id"]
            isOneToOne: false
            referencedRelation: "dev_apps"
            referencedColumns: ["id"]
          },
        ]
      }
      email_notifications: {
        Row: {
          created_at: string
          email: string
          error: string | null
          id: string
          kind: string
          ref: string
          status: string
          topic: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          error?: string | null
          id?: string
          kind: string
          ref: string
          status?: string
          topic?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          error?: string | null
          id?: string
          kind?: string
          ref?: string
          status?: string
          topic?: string | null
          user_id?: string | null
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
      influencer_clicks: {
        Row: {
          created_at: string
          id: number
          influencer_id: string
          visitor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: never
          influencer_id: string
          visitor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: never
          influencer_id?: string
          visitor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "influencer_clicks_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_commissions: {
        Row: {
          approve_after: string
          buyer_user_id: string
          commission_inr: number
          commission_pct: number
          created_at: string
          gross_inr: number
          id: string
          influencer_id: string
          payout_id: string | null
          purchase_id: string
          purchased_at: string
          reversed_reason: string | null
          status: string
        }
        Insert: {
          approve_after: string
          buyer_user_id: string
          commission_inr: number
          commission_pct: number
          created_at?: string
          gross_inr: number
          id?: string
          influencer_id: string
          payout_id?: string | null
          purchase_id: string
          purchased_at: string
          reversed_reason?: string | null
          status?: string
        }
        Update: {
          approve_after?: string
          buyer_user_id?: string
          commission_inr?: number
          commission_pct?: number
          created_at?: string
          gross_inr?: number
          id?: string
          influencer_id?: string
          payout_id?: string | null
          purchase_id?: string
          purchased_at?: string
          reversed_reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_commissions_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_commissions_payout_id_fkey"
            columns: ["payout_id"]
            isOneToOne: false
            referencedRelation: "influencer_payouts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "influencer_commissions_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: true
            referencedRelation: "credit_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_payouts: {
        Row: {
          gross_inr: number
          id: string
          influencer_id: string
          net_inr: number
          paid_at: string
          tds_inr: number
          utr: string
        }
        Insert: {
          gross_inr: number
          id?: string
          influencer_id: string
          net_inr: number
          paid_at?: string
          tds_inr?: number
          utr: string
        }
        Update: {
          gross_inr?: number
          id?: string
          influencer_id?: string
          net_inr?: number
          paid_at?: string
          tds_inr?: number
          utr?: string
        }
        Relationships: [
          {
            foreignKeyName: "influencer_payouts_influencer_id_fkey"
            columns: ["influencer_id"]
            isOneToOne: false
            referencedRelation: "influencers"
            referencedColumns: ["id"]
          },
        ]
      }
      influencer_settings: {
        Row: {
          key: string
          value: number
        }
        Insert: {
          key: string
          value: number
        }
        Update: {
          key?: string
          value?: number
        }
        Relationships: []
      }
      influencers: {
        Row: {
          campaign: string
          city: string | null
          code: string
          commission_pct: number
          community_name: string | null
          created_at: string
          display_name: string | null
          handle: string | null
          id: string
          kit_card_product: string | null
          kit_card_theme: string | null
          kit_site_product: string | null
          kit_site_theme: string | null
          name: string
          offer_cap: number | null
          offer_ends_at: string | null
          self_signup: boolean
          status: string
          user_id: string | null
        }
        Insert: {
          campaign?: string
          city?: string | null
          code: string
          commission_pct?: number
          community_name?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          kit_card_product?: string | null
          kit_card_theme?: string | null
          kit_site_product?: string | null
          kit_site_theme?: string | null
          name: string
          offer_cap?: number | null
          offer_ends_at?: string | null
          self_signup?: boolean
          status?: string
          user_id?: string | null
        }
        Update: {
          campaign?: string
          city?: string | null
          code?: string
          commission_pct?: number
          community_name?: string | null
          created_at?: string
          display_name?: string | null
          handle?: string | null
          id?: string
          kit_card_product?: string | null
          kit_card_theme?: string | null
          kit_site_product?: string | null
          kit_site_theme?: string | null
          name?: string
          offer_cap?: number | null
          offer_ends_at?: string | null
          self_signup?: boolean
          status?: string
          user_id?: string | null
        }
        Relationships: []
      }
      ip_bulk_recipients: {
        Row: {
          error: string | null
          id: number
          name: string
          phone: string
          send_id: string
          status: string
          updated_at: string
        }
        Insert: {
          error?: string | null
          id?: never
          name: string
          phone: string
          send_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          error?: string | null
          id?: never
          name?: string
          phone?: string
          send_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ip_bulk_recipients_send_id_fkey"
            columns: ["send_id"]
            isOneToOne: false
            referencedRelation: "ip_bulk_sends"
            referencedColumns: ["id"]
          },
        ]
      }
      ip_bulk_sends: {
        Row: {
          consent_at: string
          created_at: string
          credits_charged: number
          credits_refunded: number
          failed: number
          finished_at: string | null
          free_used: number
          id: string
          lang: string
          mode: string
          owner_id: string
          page_id: string
          paid_used: number
          people: number
          promo_used: number
          sent: number
          status: string
        }
        Insert: {
          consent_at: string
          created_at?: string
          credits_charged?: number
          credits_refunded?: number
          failed?: number
          finished_at?: string | null
          free_used?: number
          id?: string
          lang?: string
          mode: string
          owner_id: string
          page_id: string
          paid_used?: number
          people: number
          promo_used?: number
          sent?: number
          status?: string
        }
        Update: {
          consent_at?: string
          created_at?: string
          credits_charged?: number
          credits_refunded?: number
          failed?: number
          finished_at?: string | null
          free_used?: number
          id?: string
          lang?: string
          mode?: string
          owner_id?: string
          page_id?: string
          paid_used?: number
          people?: number
          promo_used?: number
          sent?: number
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "ip_bulk_sends_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "ip_pages"
            referencedColumns: ["id"]
          },
        ]
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
          credits_charged: number | null
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
          credits_charged?: number | null
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
          credits_charged?: number | null
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
          og_image: string | null
          owner_id: string
          product_id: string
          published_at: string | null
          published_content: Json | null
          published_variant_id: string | null
          share_prefs: Json | null
          share_url: string | null
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
          og_image?: string | null
          owner_id: string
          product_id: string
          published_at?: string | null
          published_content?: Json | null
          published_variant_id?: string | null
          share_prefs?: Json | null
          share_url?: string | null
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
          og_image?: string | null
          owner_id?: string
          product_id?: string
          published_at?: string | null
          published_content?: Json | null
          published_variant_id?: string | null
          share_prefs?: Json | null
          share_url?: string | null
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
          price_credits: number | null
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
          price_credits?: number | null
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
          price_credits?: number | null
          price_inr?: number
          share_overrides?: Json
          sort?: number
          updated_at?: string
        }
        Relationships: []
      }
      ip_shop_users: {
        Row: {
          created_at: string
          shop_slug: string
          user_id: string
        }
        Insert: {
          created_at?: string
          shop_slug: string
          user_id: string
        }
        Update: {
          created_at?: string
          shop_slug?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ip_shop_users_shop_slug_fkey"
            columns: ["shop_slug"]
            isOneToOne: false
            referencedRelation: "ip_shops"
            referencedColumns: ["slug"]
          },
        ]
      }
      ip_shops: {
        Row: {
          city: string | null
          coupon_code: string | null
          coupon_text: string | null
          created_at: string
          created_by: string | null
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          whatsapp: string | null
        }
        Insert: {
          city?: string | null
          coupon_code?: string | null
          coupon_text?: string | null
          created_at?: string
          created_by?: string | null
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          whatsapp?: string | null
        }
        Update: {
          city?: string | null
          coupon_code?: string | null
          coupon_text?: string | null
          created_at?: string
          created_by?: string | null
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          whatsapp?: string | null
        }
        Relationships: []
      }
      kit_entitlements: {
        Row: {
          created_at: string
          id: string
          page_id: string | null
          pick_product: string | null
          pick_theme: string | null
          purchase_id: string
          scope: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_id?: string | null
          pick_product?: string | null
          pick_theme?: string | null
          purchase_id: string
          scope: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_id?: string | null
          pick_product?: string | null
          pick_theme?: string | null
          purchase_id?: string
          scope?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "kit_entitlements_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "ip_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "kit_entitlements_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "credit_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_desk_accounts: {
        Row: {
          connected: boolean
          created_at: string
          display_name: string | null
          email: string
          id: string
          include_in_fetch: boolean
          is_default: boolean
          last_fetched_at: string | null
          last_synced_at: string | null
          read_updates: boolean
          reply_lang: string
          scope_floor: string | null
          sign_off: string | null
          sync_cursor: string | null
          user_id: string
        }
        Insert: {
          connected?: boolean
          created_at?: string
          display_name?: string | null
          email: string
          id?: string
          include_in_fetch?: boolean
          is_default?: boolean
          last_fetched_at?: string | null
          last_synced_at?: string | null
          read_updates?: boolean
          reply_lang?: string
          scope_floor?: string | null
          sign_off?: string | null
          sync_cursor?: string | null
          user_id: string
        }
        Update: {
          connected?: boolean
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          include_in_fetch?: boolean
          is_default?: boolean
          last_fetched_at?: string | null
          last_synced_at?: string | null
          read_updates?: boolean
          reply_lang?: string
          scope_floor?: string | null
          sign_off?: string | null
          sync_cursor?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mail_desk_drafts: {
        Row: {
          body: string
          created_at: string
          id: string
          mail_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          mail_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          mail_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_desk_drafts_mail_id_fkey"
            columns: ["mail_id"]
            isOneToOne: true
            referencedRelation: "mail_desk_mails"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_desk_mails: {
        Row: {
          account_id: string
          ai_done: boolean
          body: string | null
          claim_id: string | null
          claimed_at: string | null
          ext_id: string
          from_email: string | null
          from_name: string | null
          id: string
          kind: string | null
          labels: string[]
          list_unsub: boolean
          precedence: string
          received_at: string
          reply_label: string | null
          run_id: string | null
          segmented_at: string | null
          snippet: string | null
          subject: string | null
          summary: string | null
          thread_id: string | null
          user_id: string
        }
        Insert: {
          account_id: string
          ai_done?: boolean
          body?: string | null
          claim_id?: string | null
          claimed_at?: string | null
          ext_id: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          kind?: string | null
          labels?: string[]
          list_unsub?: boolean
          precedence?: string
          received_at: string
          reply_label?: string | null
          run_id?: string | null
          segmented_at?: string | null
          snippet?: string | null
          subject?: string | null
          summary?: string | null
          thread_id?: string | null
          user_id: string
        }
        Update: {
          account_id?: string
          ai_done?: boolean
          body?: string | null
          claim_id?: string | null
          claimed_at?: string | null
          ext_id?: string
          from_email?: string | null
          from_name?: string | null
          id?: string
          kind?: string | null
          labels?: string[]
          list_unsub?: boolean
          precedence?: string
          received_at?: string
          reply_label?: string | null
          run_id?: string | null
          segmented_at?: string | null
          snippet?: string | null
          subject?: string | null
          summary?: string | null
          thread_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_desk_mails_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mail_desk_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_desk_runs: {
        Row: {
          account_ids: string[]
          created_at: string
          credits_charged: number
          error: string | null
          est_ai_cost_inr: number
          id: string
          mails: number
          mails_ai: number
          mails_free: number
          status: string
          tool_id: string
          tool_run_id: string | null
          user_id: string
        }
        Insert: {
          account_ids?: string[]
          created_at?: string
          credits_charged?: number
          error?: string | null
          est_ai_cost_inr?: number
          id?: string
          mails: number
          mails_ai?: number
          mails_free?: number
          status?: string
          tool_id: string
          tool_run_id?: string | null
          user_id: string
        }
        Update: {
          account_ids?: string[]
          created_at?: string
          credits_charged?: number
          error?: string | null
          est_ai_cost_inr?: number
          id?: string
          mails?: number
          mails_ai?: number
          mails_free?: number
          status?: string
          tool_id?: string
          tool_run_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      mail_desk_tasks: {
        Row: {
          account_id: string
          created_at: string
          done: boolean
          due: string | null
          id: string
          kind: string
          mail_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          account_id: string
          created_at?: string
          done?: boolean
          due?: string | null
          id?: string
          kind?: string
          mail_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          account_id?: string
          created_at?: string
          done?: boolean
          due?: string | null
          id?: string
          kind?: string
          mail_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "mail_desk_tasks_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "mail_desk_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mail_desk_tasks_mail_id_fkey"
            columns: ["mail_id"]
            isOneToOne: false
            referencedRelation: "mail_desk_mails"
            referencedColumns: ["id"]
          },
        ]
      }
      mail_desk_tokens: {
        Row: {
          access_token: string | null
          account_id: string
          expiry: number | null
          refresh_token: string | null
        }
        Insert: {
          access_token?: string | null
          account_id: string
          expiry?: number | null
          refresh_token?: string | null
        }
        Update: {
          access_token?: string | null
          account_id?: string
          expiry?: number | null
          refresh_token?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "mail_desk_tokens_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: true
            referencedRelation: "mail_desk_accounts"
            referencedColumns: ["id"]
          },
        ]
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
      payment_invoice_counters: {
        Row: {
          fy: string
          last: number
        }
        Insert: {
          fy: string
          last?: number
        }
        Update: {
          fy?: string
          last?: number
        }
        Relationships: []
      }
      payment_invoices: {
        Row: {
          amount_inr: number
          created_at: string
          customer_name: string | null
          description: string
          email: string | null
          email_error: string | null
          emailed_at: string | null
          id: string
          invoice_no: string
          kind: string
          razorpay_order_id: string | null
          razorpay_payment_id: string
          user_id: string
        }
        Insert: {
          amount_inr: number
          created_at?: string
          customer_name?: string | null
          description: string
          email?: string | null
          email_error?: string | null
          emailed_at?: string | null
          id?: string
          invoice_no: string
          kind: string
          razorpay_order_id?: string | null
          razorpay_payment_id: string
          user_id: string
        }
        Update: {
          amount_inr?: number
          created_at?: string
          customer_name?: string | null
          description?: string
          email?: string | null
          email_error?: string | null
          emailed_at?: string | null
          id?: string
          invoice_no?: string
          kind?: string
          razorpay_order_id?: string | null
          razorpay_payment_id?: string
          user_id?: string
        }
        Relationships: []
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
          email_updates: boolean
          full_name: string | null
          id: string
          job_title: string | null
          location: string | null
          phone_number: string | null
          updated_at: string
          website: string | null
          whatsapp_updates: boolean
        }
        Insert: {
          auth_provider?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_updates?: boolean
          full_name?: string | null
          id: string
          job_title?: string | null
          location?: string | null
          phone_number?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_updates?: boolean
        }
        Update: {
          auth_provider?: string | null
          avatar_url?: string | null
          bio?: string | null
          company?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          email_updates?: boolean
          full_name?: string | null
          id?: string
          job_title?: string | null
          location?: string | null
          phone_number?: string | null
          updated_at?: string
          website?: string | null
          whatsapp_updates?: boolean
        }
        Relationships: []
      }
      promo_app_uses: {
        Row: {
          tool_id: string
          user_id: string
          uses: number
        }
        Insert: {
          tool_id: string
          user_id: string
          uses?: number
        }
        Update: {
          tool_id?: string
          user_id?: string
          uses?: number
        }
        Relationships: []
      }
      promo_uncapped_tools: {
        Row: {
          tool_id: string
        }
        Insert: {
          tool_id: string
        }
        Update: {
          tool_id?: string
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
      refund_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          credits_purchased: number
          credits_unused: number
          credits_used: number
          decided_at: string | null
          decided_by: string | null
          id: string
          processed_at: string | null
          processed_credits_unused: number | null
          processed_inr: number | null
          purchase_id: string
          razorpay_refund_id: string | null
          reason: string | null
          refundable_inr: number
          status: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          credits_purchased: number
          credits_unused: number
          credits_used: number
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          processed_at?: string | null
          processed_credits_unused?: number | null
          processed_inr?: number | null
          purchase_id: string
          razorpay_refund_id?: string | null
          reason?: string | null
          refundable_inr: number
          status?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          credits_purchased?: number
          credits_unused?: number
          credits_used?: number
          decided_at?: string | null
          decided_by?: string | null
          id?: string
          processed_at?: string | null
          processed_credits_unused?: number | null
          processed_inr?: number | null
          purchase_id?: string
          razorpay_refund_id?: string | null
          reason?: string | null
          refundable_inr?: number
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refund_requests_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "credit_purchases"
            referencedColumns: ["id"]
          },
        ]
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
          is_image: boolean
          tool_id: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          cost_inr?: number
          credit_cost?: number
          is_image?: boolean
          tool_id: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          cost_inr?: number
          credit_cost?: number
          is_image?: boolean
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
          promo_used: number
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
          promo_used?: number
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
          promo_used?: number
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
          extra_categories: string[]
          has_uploaded_files: boolean
          home_section: string | null
          icon_fit: string
          icon_url: string | null
          id: string
          is_free: boolean
          is_live: boolean
          is_premium: boolean
          name: string
          placements: string[]
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
          extra_categories?: string[]
          has_uploaded_files?: boolean
          home_section?: string | null
          icon_fit?: string
          icon_url?: string | null
          id: string
          is_free?: boolean
          is_live?: boolean
          is_premium?: boolean
          name: string
          placements?: string[]
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
          extra_categories?: string[]
          has_uploaded_files?: boolean
          home_section?: string | null
          icon_fit?: string
          icon_url?: string | null
          id?: string
          is_free?: boolean
          is_live?: boolean
          is_premium?: boolean
          name?: string
          placements?: string[]
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
      whatsapp_messages: {
        Row: {
          created_at: string
          error: string | null
          id: string
          kind: string
          phone: string
          ref: string
          status: string
          topic: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string
          error?: string | null
          id?: string
          kind: string
          phone: string
          ref: string
          status?: string
          topic?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string
          error?: string | null
          id?: string
          kind?: string
          phone?: string
          ref?: string
          status?: string
          topic?: string | null
          user_id?: string | null
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
      admin_create_card_promos: {
        Args: {
          _count: number
          _credits?: number
          _expires_at?: string
          _kind?: string
          _label: string
          _max_claims?: number
          _per_app_limit?: number
          _shared_code?: string
        }
        Returns: {
          claim_count: number
          code: string
          created_at: string
          created_by: string | null
          credits: number
          expires_at: string | null
          id: string
          is_active: boolean
          kind: string
          label: string | null
          max_claims: number | null
          per_app_limit: number
        }[]
        SetofOptions: {
          from: "*"
          to: "card_promos"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      admin_dev_approve: {
        Args: {
          _credits: number
          _plan?: Json
          _share_pct: number
          _version_id: string
        }
        Returns: Json
      }
      admin_dev_approve_base: {
        Args: {
          _credits: number
          _plan?: Json
          _share_pct: number
          _version_id: string
        }
        Returns: Json
      }
      admin_dev_apps: { Args: never; Returns: Json }
      admin_dev_queue: { Args: never; Returns: Json }
      admin_dev_queue_base: { Args: never; Returns: Json }
      admin_dev_request_changes: {
        Args: { _notes: string; _reject?: boolean; _version_id: string }
        Returns: Json
      }
      admin_dev_set_listed: {
        Args: { _app_id: string; _listed: boolean }
        Returns: Json
      }
      app_secret: { Args: { _name: string }; Returns: string }
      apply_apple_purchase: {
        Args: {
          _credits: number
          _environment: string
          _original_transaction_id: string
          _pack_id: string
          _product_id: string
          _transaction_id: string
          _user_id: string
        }
        Returns: Json
      }
      apply_credit_purchase: {
        Args: { _order_id: string; _payment_id: string; _purchase_id: string }
        Returns: Json
      }
      card_promo_status: { Args: { _code: string }; Returns: Json }
      claim_card_promo: { Args: { _code: string; _uid: string }; Returns: Json }
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
      dev_add_image: {
        Args: {
          _app_id: string
          _caption?: string
          _data: string
          _mime: string
        }
        Returns: Json
      }
      dev_ai_cost_estimate: {
        Args: { _app_id: string; _sha: string; _spec: Json }
        Returns: Json
      }
      dev_ai_cost_inr: {
        Args: { _in: number; _model: string; _out: number }
        Returns: number
      }
      dev_ai_load: {
        Args: { _tool_id: string; _version_id?: string }
        Returns: Json
      }
      dev_ai_log: {
        Args: {
          _images: number
          _in_chars: number
          _inputs: Json
          _mode: string
          _model: string
          _ok: boolean
          _out_chars: number
          _output: string
          _user: string
          _version_id: string
        }
        Returns: undefined
      }
      dev_ai_preview_allow: { Args: { _user: string }; Returns: Json }
      dev_ai_runs_left: { Args: never; Returns: Json }
      dev_apply_similar_rule: {
        Args: { _qa: Json; _version_id: string }
        Returns: Json
      }
      dev_begin_upload: {
        Args: { _app_id: string; _source?: Json; _with_key?: boolean }
        Returns: Json
      }
      dev_check: {
        Args: { _detail: string; _id: string; _label: string; _status: string }
        Returns: Json
      }
      dev_clean_ai_spec: { Args: { _s: Json }; Returns: Json }
      dev_clean_ai_step: { Args: { _s: Json }; Returns: Json }
      dev_clean_charge_options: { Args: { _o: Json }; Returns: Json }
      dev_clean_promo: { Args: { _p: Json }; Returns: Json }
      dev_clean_source: { Args: { _s: Json }; Returns: Json }
      dev_cost_estimate: {
        Args: { _bytes: number; _hosts: string[] }
        Returns: Json
      }
      dev_create_app: { Args: { _name: string; _slug: string }; Returns: Json }
      dev_find_similar: {
        Args: { _app_id?: string; _name: string; _short: string }
        Returns: Json
      }
      dev_finish_upload: {
        Args: { _bytes: number; _parts: number; _upload_id: string }
        Returns: Json
      }
      dev_finish_upload_as: {
        Args: { _bytes: number; _parts: number; _upload_id: string }
        Returns: Json
      }
      dev_frequency_flags: { Args: { _h: string }; Returns: string[] }
      dev_keyed_upload_finish: {
        Args: { _bytes: number; _key: string; _parts: number }
        Returns: Json
      }
      dev_keyed_upload_part: {
        Args: { _data: string; _key: string; _part_no: number }
        Returns: Json
      }
      dev_overlap: { Args: { a: string[]; b: string[] }; Returns: number }
      dev_packed_code: { Args: { _html: string }; Returns: string }
      dev_put_part: {
        Args: { _data: string; _part_no: number; _upload_id: string }
        Returns: undefined
      }
      dev_qa_extra: { Args: { _qa: Json; _version_id: string }; Returns: Json }
      dev_remove_image: { Args: { _image_id: string }; Returns: Json }
      dev_run_qa: { Args: { _version_id: string }; Returns: Json }
      dev_run_qa_ai: { Args: { _version_id: string }; Returns: Json }
      dev_run_qa_base: { Args: { _version_id: string }; Returns: Json }
      dev_run_qa_hosted: { Args: { _version_id: string }; Returns: Json }
      dev_save_ai_app: {
        Args: { _app_id: string; _listing?: Json; _spec?: Json }
        Returns: Json
      }
      dev_save_ai_step: {
        Args: { _app_id: string; _spec?: Json }
        Returns: Json
      }
      dev_save_draft: {
        Args: { _app_id: string; _html?: string; _listing?: Json }
        Returns: Json
      }
      dev_save_draft_as: {
        Args: {
          _app_id: string
          _html: string
          _listing: Json
          _source: Json
          _uid: string
        }
        Returns: Json
      }
      dev_save_draft_as_base: {
        Args: {
          _app_id: string
          _html: string
          _listing: Json
          _source: Json
          _uid: string
        }
        Returns: Json
      }
      dev_secret_labels: { Args: { _t: string }; Returns: string[] }
      dev_set_similar_note: {
        Args: { _listing: Json; _vid: string }
        Returns: undefined
      }
      dev_similar_apps: {
        Args: {
          _app_id?: string
          _full?: boolean
          _name: string
          _short: string
        }
        Returns: Json
      }
      dev_submit: { Args: { _version_id: string }; Returns: Json }
      dev_upload_part: {
        Args: { _data: string; _part_no: number; _upload_id: string }
        Returns: Json
      }
      dev_withdraw: { Args: { _version_id: string }; Returns: Json }
      dev_words: { Args: { _t: string }; Returns: string[] }
      ensure_wallet: { Args: { _uid: string }; Returns: undefined }
      free_image_runs_used: { Args: { _uid: string }; Returns: number }
      get_ai_app: { Args: { _tool_id: string }; Returns: Json }
      get_dev_app_kind: { Args: { _tool_id: string }; Returns: string }
      get_hosted_app: { Args: { _tool_id: string }; Returns: Json }
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
      image_runs_affordable: {
        Args: { _per: number; _uid: string }
        Returns: number
      }
      influencer_approve_due: { Args: never; Returns: number }
      influencer_assert_admin: { Args: never; Returns: undefined }
      influencer_attach_login: {
        Args: { _influencer_id: string; _user_id: string }
        Returns: undefined
      }
      influencer_create_login: {
        Args: { _email: string; _influencer_id: string; _password: string }
        Returns: Json
      }
      influencer_dashboard: { Args: never; Returns: Json }
      influencer_detail: { Args: { _influencer_id: string }; Returns: Json }
      influencer_fy_start: { Args: never; Returns: string }
      influencer_link_by_email: {
        Args: { _email: string; _influencer_id: string }
        Returns: Json
      }
      influencer_mark_paid: {
        Args: { _influencer_id: string; _utr: string }
        Returns: Json
      }
      influencer_me: { Args: never; Returns: Json }
      influencer_my_kit_picks: { Args: never; Returns: Json }
      influencer_offer_public: { Args: { _code: string }; Returns: Json }
      influencer_record_click: {
        Args: { _code: string; _visitor: string }
        Returns: boolean
      }
      influencer_register: {
        Args: { _city: string; _handle: string; _name: string }
        Returns: Json
      }
      influencer_reset_password: {
        Args: { _influencer_id: string; _password: string }
        Returns: Json
      }
      influencer_reverse: {
        Args: { _purchase_id: string; _reason: string }
        Returns: undefined
      }
      influencer_save: {
        Args: {
          _campaign: string
          _city: string
          _code: string
          _commission_pct: number
          _handle: string
          _id: string
          _name: string
          _status: string
        }
        Returns: string
      }
      influencer_setting: { Args: { _key: string }; Returns: number }
      influencer_update_kit_picks: {
        Args: {
          _card_product: string
          _card_theme: string
          _site_product: string
          _site_theme: string
        }
        Returns: Json
      }
      influencer_update_offer: {
        Args: {
          _community_name: string
          _display_name: string
          _offer_cap: number
          _offer_ends_at: string
        }
        Returns: Json
      }
      ip_bulk_claim: {
        Args: { _limit: number; _send_id: string }
        Returns: {
          error: string | null
          id: number
          name: string
          phone: string
          send_id: string
          status: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "ip_bulk_recipients"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      ip_bulk_send_finish: { Args: { _send_id: string }; Returns: Json }
      ip_bulk_send_price: {
        Args: { _mode: string; _people: number }
        Returns: number
      }
      ip_bulk_send_queue: {
        Args: {
          _consent: boolean
          _count: number
          _lang: string
          _page_id: string
        }
        Returns: Json
      }
      ip_bulk_send_start: {
        Args: {
          _count: number
          _lang: string
          _mode: string
          _page_id: string
          _people: Json
          _uid: string
        }
        Returns: Json
      }
      ip_credits_for_inr: { Args: { _inr: number }; Returns: number }
      ip_get_public_page: { Args: { _slug: string }; Returns: Json }
      ip_get_shop: { Args: { _slug: string }; Returns: Json }
      ip_mark_order_paid: {
        Args: { _payment_id: string; _razorpay_order_id: string }
        Returns: Json
      }
      ip_page_hit: { Args: { _slug: string }; Returns: undefined }
      ip_pay_page_credits: { Args: { _page_id: string }; Returns: Json }
      ip_pay_with_credits: {
        Args: { _page_id: string; _uid: string }
        Returns: Json
      }
      ip_product_credits: {
        Args: { _prod: Database["public"]["Tables"]["ip_products"]["Row"] }
        Returns: number
      }
      ip_publish_page: { Args: { _page_id: string }; Returns: Json }
      ip_publish_prepaid: { Args: { _page_id: string }; Returns: Json }
      ip_republish: { Args: { _page_id: string }; Returns: Json }
      ip_set_share_url: {
        Args: { _page_id: string; _url: string }
        Returns: undefined
      }
      ip_shop_stats: {
        Args: never
        Returns: {
          cards: number
          slug: string
          users: number
        }[]
      }
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
      ip_tag_shop: { Args: { _slug: string }; Returns: undefined }
      ip_unpublish: { Args: { _page_id: string }; Returns: Json }
      issue_payment_invoice: {
        Args: {
          _amount: number
          _customer: string
          _description: string
          _email: string
          _kind: string
          _order_id: string
          _payment_id: string
          _user_id: string
        }
        Returns: Json
      }
      kit_my_entitlements: { Args: never; Returns: Json }
      kit_product_scope: { Args: { _product_id: string }; Returns: string }
      monthly_free_reset: { Args: never; Returns: number }
      promo_available: {
        Args: { _tool_id: string; _uid: string }
        Returns: number
      }
      promo_runs_affordable: {
        Args: { _per: number; _tool_id: string; _uid: string }
        Returns: number
      }
      refund_admin_list: { Args: { _status?: string }; Returns: Json }
      refund_approve: {
        Args: { _note: string; _request_id: string }
        Returns: Json
      }
      refund_claim_for_processing: {
        Args: { _request_id: string }
        Returns: Json
      }
      refund_mark_failed: {
        Args: { _note: string; _request_id: string }
        Returns: undefined
      }
      refund_mark_processed: {
        Args: {
          _amount_inr: number
          _credits_removed: number
          _refund_id: string
          _request_id: string
        }
        Returns: Json
      }
      refund_quote: { Args: { _purchase_id: string }; Returns: Json }
      refund_reject: {
        Args: { _note: string; _request_id: string }
        Returns: undefined
      }
      refund_request_create: {
        Args: { _purchase_id: string; _reason: string }
        Returns: string
      }
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
