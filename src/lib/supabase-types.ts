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
      analysis_sessions: {
        Row: {
          created_at: string
          id: string
          selected_repos: Json
          status: string
          summary: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          selected_repos?: Json
          status?: string
          summary?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          selected_repos?: Json
          status?: string
          summary?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "analysis_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analysis_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      api_audit_log: {
        Row: {
          created_at: string | null
          endpoint: string
          error_type: string | null
          id: string
          method: string
          response_time_ms: number | null
          status_code: number | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          endpoint: string
          error_type?: string | null
          id?: string
          method: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          endpoint?: string
          error_type?: string | null
          id?: string
          method?: string
          response_time_ms?: number | null
          status_code?: number | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "api_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "api_audit_log_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      auth_events: {
        Row: {
          created_at: string | null
          event_type: string
          github_username: string | null
          id: string
          ip_address: unknown
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          github_username?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          github_username?: string | null
          id?: string
          ip_address?: unknown
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auth_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "auth_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          created_at: string | null
          event_type: string
          id: string
          metadata: Json | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_type: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_type?: string
          id?: string
          metadata?: Json | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      generated_cvs: {
        Row: {
          created_at: string
          cv_content: string
          id: string
          matching_repos: Json
          role_description: string | null
          role_title: string
          session_id: string
          skills: string[]
          structured_cv: Json | null
          user_id: string
        }
        Insert: {
          created_at?: string
          cv_content: string
          id?: string
          matching_repos?: Json
          role_description?: string | null
          role_title: string
          session_id: string
          skills?: string[]
          structured_cv?: Json | null
          user_id: string
        }
        Update: {
          created_at?: string
          cv_content?: string
          id?: string
          matching_repos?: Json
          role_description?: string | null
          role_title?: string
          session_id?: string
          skills?: string[]
          structured_cv?: Json | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "generated_cvs_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_cvs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "generated_cvs_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      repo_categorizations: {
        Row: {
          id: string
          user_id: string
          summary: string
          roles: Json
          repo_count: number
          model: string
          prompt_tokens: number
          completion_tokens: number
          total_tokens: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          summary: string
          roles: Json
          repo_count?: number
          model: string
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          summary?: string
          roles?: Json
          repo_count?: number
          model?: string
          prompt_tokens?: number
          completion_tokens?: number
          total_tokens?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "repo_categorizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "repo_categorizations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          behance_username: string | null
          bio: string | null
          created_at: string
          education: Json | null
          email: string | null
          full_name: string | null
          github_id: number
          github_username: string
          id: string
          linkedin_cookie: string | null
          linkedin_url: string | null
          location: string | null
          phone: string | null
          updated_at: string
          website_url: string | null
          work_experience: Json | null
        }
        Insert: {
          avatar_url?: string | null
          behance_username?: string | null
          bio?: string | null
          created_at?: string
          education?: Json | null
          email?: string | null
          full_name?: string | null
          github_id: number
          github_username: string
          id?: string
          linkedin_cookie?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          updated_at?: string
          website_url?: string | null
          work_experience?: Json | null
        }
        Update: {
          avatar_url?: string | null
          behance_username?: string | null
          bio?: string | null
          created_at?: string
          education?: Json | null
          email?: string | null
          full_name?: string | null
          github_id?: number
          github_username?: string
          id?: string
          linkedin_cookie?: string | null
          linkedin_url?: string | null
          location?: string | null
          phone?: string | null
          updated_at?: string
          website_url?: string | null
          work_experience?: Json | null
        }
        Relationships: []
      }
      token_usage: {
        Row: {
          completion_tokens: number
          created_at: string
          estimated_cost_usd: number
          id: string
          model: string
          prompt_tokens: number
          session_id: string | null
          total_tokens: number
          user_id: string
        }
        Insert: {
          completion_tokens?: number
          created_at?: string
          estimated_cost_usd?: number
          id?: string
          model: string
          prompt_tokens?: number
          session_id?: string | null
          total_tokens?: number
          user_id: string
        }
        Update: {
          completion_tokens?: number
          created_at?: string
          estimated_cost_usd?: number
          id?: string
          model?: string
          prompt_tokens?: number
          session_id?: string | null
          total_tokens?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "token_usage_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "analysis_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "token_usage_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "user_stats"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      user_stats: {
        Row: {
          cv_count: number | null
          github_username: string | null
          id: string | null
          last_analysis_at: string | null
          session_count: number | null
          total_cost_usd: number | null
          total_tokens_used: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
