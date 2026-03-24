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
      meet_nudge_contacts: {
        Row: {
          business_name: string | null
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
          gemini_api_key: string | null
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
          gemini_api_key?: string | null
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
          gemini_api_key?: string | null
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
          description: string
          has_uploaded_files: boolean
          id: string
          is_live: boolean
          is_premium: boolean
          name: string
          source: string
          tool_types: string[]
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          dedicated_route?: string | null
          description: string
          has_uploaded_files?: boolean
          id: string
          is_live?: boolean
          is_premium?: boolean
          name: string
          source: string
          tool_types?: string[]
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          dedicated_route?: string | null
          description?: string
          has_uploaded_files?: boolean
          id?: string
          is_live?: boolean
          is_premium?: boolean
          name?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
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
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
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
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
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
