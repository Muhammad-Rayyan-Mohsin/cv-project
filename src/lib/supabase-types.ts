export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
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
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string
          email: string | null
          github_id: number
          github_username: string
          id: string
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          github_id: number
          github_username: string
          id?: string
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          email?: string | null
          github_id?: number
          github_username?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
