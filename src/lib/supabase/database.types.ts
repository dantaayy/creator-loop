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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      daily_prompts: {
        Row: {
          answer: string | null
          id: string
          prompt_date: string
          question: string
          user_id: string
        }
        Insert: {
          answer?: string | null
          id?: string
          prompt_date: string
          question: string
          user_id: string
        }
        Update: {
          answer?: string | null
          id?: string
          prompt_date?: string
          question?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_prompts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      ideas: {
        Row: {
          created_at: string | null
          effort: string | null
          format: string | null
          hook: string | null
          id: string
          image_path: string | null
          link_url: string | null
          pillar_id: string | null
          raw_text: string
          source: string
          status: string
          tagged_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          effort?: string | null
          format?: string | null
          hook?: string | null
          id?: string
          image_path?: string | null
          link_url?: string | null
          pillar_id?: string | null
          raw_text: string
          source: string
          status?: string
          tagged_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          effort?: string | null
          format?: string | null
          hook?: string | null
          id?: string
          image_path?: string | null
          link_url?: string | null
          pillar_id?: string | null
          raw_text?: string
          source?: string
          status?: string
          tagged_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ideas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      income_entries: {
        Row: {
          amount: number
          id: string
          note: string | null
          received_on: string
          source_type: string
          user_id: string
        }
        Insert: {
          amount: number
          id?: string
          note?: string | null
          received_on: string
          source_type: string
          user_id: string
        }
        Update: {
          amount?: number
          id?: string
          note?: string | null
          received_on?: string
          source_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "income_entries_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_items: {
        Row: {
          edit_done: boolean | null
          est_hours: number
          film_done: boolean | null
          id: string
          idea_id: string
          post_day: string
          posted: boolean | null
          user_id: string
          week_id: string
        }
        Insert: {
          edit_done?: boolean | null
          est_hours?: number
          film_done?: boolean | null
          id?: string
          idea_id: string
          post_day: string
          posted?: boolean | null
          user_id: string
          week_id: string
        }
        Update: {
          edit_done?: boolean | null
          est_hours?: number
          film_done?: boolean | null
          id?: string
          idea_id?: string
          post_day?: string
          posted?: boolean | null
          user_id?: string
          week_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_items_idea_id_fkey"
            columns: ["idea_id"]
            isOneToOne: false
            referencedRelation: "ideas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_items_week_id_fkey"
            columns: ["week_id"]
            isOneToOne: false
            referencedRelation: "weeks"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          display_name: string | null
          id: string
          monthly_expenses: number | null
          niche: string | null
          pillars: Json
          prompt_time: string | null
          savings: number | null
          timezone: string
          weekly_hour_cap: number
          weekly_post_cap: number
        }
        Insert: {
          created_at?: string | null
          display_name?: string | null
          id: string
          monthly_expenses?: number | null
          niche?: string | null
          pillars?: Json
          prompt_time?: string | null
          savings?: number | null
          timezone?: string
          weekly_hour_cap?: number
          weekly_post_cap?: number
        }
        Update: {
          created_at?: string | null
          display_name?: string | null
          id?: string
          monthly_expenses?: number | null
          niche?: string | null
          pillars?: Json
          prompt_time?: string | null
          savings?: number | null
          timezone?: string
          weekly_hour_cap?: number
          weekly_post_cap?: number
        }
        Relationships: []
      }
      weeks: {
        Row: {
          energy: number | null
          hour_cap: number
          id: string
          mode: string
          note: string | null
          post_cap: number
          user_id: string
          week_start: string
        }
        Insert: {
          energy?: number | null
          hour_cap: number
          id?: string
          mode?: string
          note?: string | null
          post_cap: number
          user_id: string
          week_start: string
        }
        Update: {
          energy?: number | null
          hour_cap?: number
          id?: string
          mode?: string
          note?: string | null
          post_cap?: number
          user_id?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weeks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      owns_week_and_idea: {
        Args: { p_idea_id: string; p_week_id: string }
        Returns: boolean
      }
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
    Enums: {},
  },
} as const
