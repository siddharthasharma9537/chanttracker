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
      achievements: {
        Row: {
          code: string
          description: string | null
          emoji: string | null
          id: number
          metric: Database["public"]["Enums"]["achievement_metric"]
          sort_order: number | null
          threshold: number
          title: string
        }
        Insert: {
          code: string
          description?: string | null
          emoji?: string | null
          id?: number
          metric: Database["public"]["Enums"]["achievement_metric"]
          sort_order?: number | null
          threshold: number
          title: string
        }
        Update: {
          code?: string
          description?: string | null
          emoji?: string | null
          id?: number
          metric?: Database["public"]["Enums"]["achievement_metric"]
          sort_order?: number | null
          threshold?: number
          title?: string
        }
        Relationships: []
      }
      anushthana_progress: {
        Row: {
          achieved_count: number
          anushthana_id: string
          created_at: string | null
          for_date: string
          id: string
          session_count: number
        }
        Insert: {
          achieved_count: number
          anushthana_id: string
          created_at?: string | null
          for_date: string
          id?: string
          session_count?: number
        }
        Update: {
          achieved_count?: number
          anushthana_id?: string
          created_at?: string | null
          for_date?: string
          id?: string
          session_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "anushthana_progress_anushthana_id_fkey"
            columns: ["anushthana_id"]
            isOneToOne: false
            referencedRelation: "anushthanas"
            referencedColumns: ["id"]
          },
        ]
      }
      anushthanas: {
        Row: {
          completed_at: string | null
          created_at: string | null
          daily_target_count: number
          end_date: string
          id: string
          intention: string | null
          mantra_id: string | null
          start_date: string
          status: Database["public"]["Enums"]["anushthana_status"]
          strict_mode: boolean
          title: string
          total_days: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string | null
          daily_target_count: number
          end_date: string
          id?: string
          intention?: string | null
          mantra_id?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["anushthana_status"]
          strict_mode?: boolean
          title: string
          total_days: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string | null
          daily_target_count?: number
          end_date?: string
          id?: string
          intention?: string | null
          mantra_id?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["anushthana_status"]
          strict_mode?: boolean
          title?: string
          total_days?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "anushthanas_mantra_id_fkey"
            columns: ["mantra_id"]
            isOneToOne: false
            referencedRelation: "mantras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anushthanas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "anushthanas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      chant_sessions: {
        Row: {
          anushthana_id: string | null
          chant_date: string | null
          count: number
          created_at: string | null
          duration_seconds: number | null
          ended_at: string | null
          id: string
          japas_per_min: number | null
          mantra_id: string | null
          mode: Database["public"]["Enums"]["chant_mode"]
          sankalpa_id: string | null
          session_status: Database["public"]["Enums"]["session_status"]
          started_at: string
          target: number
          user_id: string
          voice_accuracy: number | null
        }
        Insert: {
          anushthana_id?: string | null
          chant_date?: string | null
          count?: number
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          japas_per_min?: number | null
          mantra_id?: string | null
          mode?: Database["public"]["Enums"]["chant_mode"]
          sankalpa_id?: string | null
          session_status?: Database["public"]["Enums"]["session_status"]
          started_at?: string
          target?: number
          user_id: string
          voice_accuracy?: number | null
        }
        Update: {
          anushthana_id?: string | null
          chant_date?: string | null
          count?: number
          created_at?: string | null
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          japas_per_min?: number | null
          mantra_id?: string | null
          mode?: Database["public"]["Enums"]["chant_mode"]
          sankalpa_id?: string | null
          session_status?: Database["public"]["Enums"]["session_status"]
          started_at?: string
          target?: number
          user_id?: string
          voice_accuracy?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "chant_sessions_anushthana_id_fkey"
            columns: ["anushthana_id"]
            isOneToOne: false
            referencedRelation: "anushthanas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chant_sessions_mantra_id_fkey"
            columns: ["mantra_id"]
            isOneToOne: false
            referencedRelation: "mantras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chant_sessions_sankalpa_id_fkey"
            columns: ["sankalpa_id"]
            isOneToOne: false
            referencedRelation: "sankalpas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chant_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chant_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      goals: {
        Row: {
          created_at: string | null
          id: string
          period: Database["public"]["Enums"]["goal_period"]
          target_japas: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          period: Database["public"]["Enums"]["goal_period"]
          target_japas: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          period?: Database["public"]["Enums"]["goal_period"]
          target_japas?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      grahas: {
        Row: {
          bija_mantra: string
          color: string | null
          english: string | null
          id: number
          name: string
          orbit_order: number | null
        }
        Insert: {
          bija_mantra: string
          color?: string | null
          english?: string | null
          id?: number
          name: string
          orbit_order?: number | null
        }
        Update: {
          bija_mantra?: string
          color?: string | null
          english?: string | null
          id?: number
          name?: string
          orbit_order?: number | null
        }
        Relationships: []
      }
      mantras: {
        Row: {
          accent_color: string | null
          audio_url: string | null
          category: Database["public"]["Enums"]["mantra_category"] | null
          created_at: string | null
          default_target: number
          deity: string | null
          devanagari: string
          iast_transliteration: string | null
          id: string
          is_active: boolean
          is_system: boolean | null
          mantra_type: Database["public"]["Enums"]["mantra_type"] | null
          meaning: string | null
          name_en: string | null
          name_sa: string | null
          name_te: string | null
          owner_id: string | null
          parent_graha_id: string | null
          slug: string | null
          transliteration: string
          weekday_tags: number[] | null
        }
        Insert: {
          accent_color?: string | null
          audio_url?: string | null
          category?: Database["public"]["Enums"]["mantra_category"] | null
          created_at?: string | null
          default_target?: number
          deity?: string | null
          devanagari: string
          iast_transliteration?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean | null
          mantra_type?: Database["public"]["Enums"]["mantra_type"] | null
          meaning?: string | null
          name_en?: string | null
          name_sa?: string | null
          name_te?: string | null
          owner_id?: string | null
          parent_graha_id?: string | null
          slug?: string | null
          transliteration: string
          weekday_tags?: number[] | null
        }
        Update: {
          accent_color?: string | null
          audio_url?: string | null
          category?: Database["public"]["Enums"]["mantra_category"] | null
          created_at?: string | null
          default_target?: number
          deity?: string | null
          devanagari?: string
          iast_transliteration?: string | null
          id?: string
          is_active?: boolean
          is_system?: boolean | null
          mantra_type?: Database["public"]["Enums"]["mantra_type"] | null
          meaning?: string | null
          name_en?: string | null
          name_sa?: string | null
          name_te?: string | null
          owner_id?: string | null
          parent_graha_id?: string | null
          slug?: string | null
          transliteration?: string
          weekday_tags?: number[] | null
        }
        Relationships: [
          {
            foreignKeyName: "mantras_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "mantras_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "v_user_stats"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "mantras_parent_graha_id_fkey"
            columns: ["parent_graha_id"]
            isOneToOne: false
            referencedRelation: "mantras"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          chant_sound_enabled: boolean | null
          created_at: string | null
          daily_goal: number
          email: string | null
          full_name: string | null
          haptics_enabled: boolean | null
          id: string
          is_active: boolean
          is_verified: boolean
          locale: string | null
          member_since: string | null
          phone: string | null
          preferred_language: string
          reminder_time: string | null
          theme: string | null
          timezone: string
          updated_at: string | null
        }
        Insert: {
          avatar_url?: string | null
          chant_sound_enabled?: boolean | null
          created_at?: string | null
          daily_goal?: number
          email?: string | null
          full_name?: string | null
          haptics_enabled?: boolean | null
          id: string
          is_active?: boolean
          is_verified?: boolean
          locale?: string | null
          member_since?: string | null
          phone?: string | null
          preferred_language?: string
          reminder_time?: string | null
          theme?: string | null
          timezone?: string
          updated_at?: string | null
        }
        Update: {
          avatar_url?: string | null
          chant_sound_enabled?: boolean | null
          created_at?: string | null
          daily_goal?: number
          email?: string | null
          full_name?: string | null
          haptics_enabled?: boolean | null
          id?: string
          is_active?: boolean
          is_verified?: boolean
          locale?: string | null
          member_since?: string | null
          phone?: string | null
          preferred_language?: string
          reminder_time?: string | null
          theme?: string | null
          timezone?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      sankalpas: {
        Row: {
          achieved_count: number
          completed_at: string | null
          created_at: string | null
          custom_text: string | null
          for_date: string
          id: string
          intention_text: string | null
          mantra_id: string | null
          purpose: Database["public"]["Enums"]["sankalpa_purpose"]
          sankalpa_status: Database["public"]["Enums"]["sankalpa_status"]
          target_count: number
          user_id: string
        }
        Insert: {
          achieved_count?: number
          completed_at?: string | null
          created_at?: string | null
          custom_text?: string | null
          for_date?: string
          id?: string
          intention_text?: string | null
          mantra_id?: string | null
          purpose: Database["public"]["Enums"]["sankalpa_purpose"]
          sankalpa_status?: Database["public"]["Enums"]["sankalpa_status"]
          target_count?: number
          user_id: string
        }
        Update: {
          achieved_count?: number
          completed_at?: string | null
          created_at?: string | null
          custom_text?: string | null
          for_date?: string
          id?: string
          intention_text?: string | null
          mantra_id?: string | null
          purpose?: Database["public"]["Enums"]["sankalpa_purpose"]
          sankalpa_status?: Database["public"]["Enums"]["sankalpa_status"]
          target_count?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sankalpas_mantra_id_fkey"
            columns: ["mantra_id"]
            isOneToOne: false
            referencedRelation: "mantras"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sankalpas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sankalpas_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      streaks: {
        Row: {
          current_streak: number | null
          last_chant_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          last_chant_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          last_chant_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "streaks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "v_user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_achievements: {
        Row: {
          achievement_id: number
          unlocked_at: string | null
          user_id: string
        }
        Insert: {
          achievement_id: number
          unlocked_at?: string | null
          user_id: string
        }
        Update: {
          achievement_id?: number
          unlocked_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_achievements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Views: {
      v_daily_totals: {
        Row: {
          chant_date: string | null
          mantra_count: number | null
          sessions: number | null
          total_japas: number | null
          total_seconds: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chant_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chant_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_top_mantra: {
        Row: {
          devanagari: string | null
          japas: number | null
          transliteration: string | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chant_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chant_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
      v_user_stats: {
        Row: {
          avg_daily: number | null
          best_day: number | null
          current_streak: number | null
          longest_streak: number | null
          total_japas: number | null
          total_seconds: number | null
          user_id: string | null
        }
        Relationships: []
      }
      v_weekly_chart: {
        Row: {
          chant_date: string | null
          sessions: number | null
          total_japas: number | null
          total_seconds: number | null
          user_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chant_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "chant_sessions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "v_user_stats"
            referencedColumns: ["user_id"]
          },
        ]
      }
    }
    Functions: {
      check_achievements: { Args: { p_user: string }; Returns: undefined }
      demo_history: {
        Args: { p_limit?: number }
        Returns: {
          accent_color: string
          at_time: string
          cnt: number
          devanagari: string
          transliteration: string
        }[]
      }
      demo_log: {
        Args: { p_count: number; p_devanagari: string }
        Returns: {
          done: number
          pct: number
          streak: number
          target: number
          total: number
        }[]
      }
      demo_progress: {
        Args: never
        Returns: {
          active_anushthanas: number
          done: number
          pct: number
          streak: number
          target: number
          tithi: string
          total: number
          weekday: string
          weekday_lord: string
        }[]
      }
      demo_user: { Args: never; Returns: string }
      get_today_progress: {
        Args: never
        Returns: {
          done: number
          pct: number
          target: number
        }[]
      }
      mantras_for_weekday: {
        Args: { p_dow?: number }
        Returns: {
          accent_color: string | null
          audio_url: string | null
          category: Database["public"]["Enums"]["mantra_category"] | null
          created_at: string | null
          default_target: number
          deity: string | null
          devanagari: string
          iast_transliteration: string | null
          id: string
          is_active: boolean
          is_system: boolean | null
          mantra_type: Database["public"]["Enums"]["mantra_type"] | null
          meaning: string | null
          name_en: string | null
          name_sa: string | null
          name_te: string | null
          owner_id: string | null
          parent_graha_id: string | null
          slug: string | null
          transliteration: string
          weekday_tags: number[] | null
        }[]
        SetofOptions: {
          from: "*"
          to: "mantras"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      mark_anushthana_day: {
        Args: { p_achieved: number; p_anushthana: string; p_user: string }
        Returns: Json
      }
      panchang: {
        Args: { p_date?: string; p_lat?: number; p_lon?: number }
        Returns: Json
      }
      refresh_streak: { Args: { p_user: string }; Returns: undefined }
    }
    Enums: {
      achievement_metric:
        | "total_japas"
        | "single_mantra_japas"
        | "streak_days"
        | "session_count"
      anushthana_status: "active" | "completed" | "broken" | "abandoned"
      chant_mode: "counter" | "mala" | "voice" | "manual" | "hands_free"
      goal_period: "daily" | "weekly" | "monthly" | "yearly"
      mantra_category: "navagraha" | "devata" | "beeja" | "custom"
      mantra_type: "graha" | "adhidevata" | "pratyadhidevata" | "devata"
      sankalpa_purpose:
        | "health_healing"
        | "family_wellbeing"
        | "spiritual_growth"
        | "success_prosperity"
        | "peace_of_mind"
        | "custom"
      sankalpa_status: "active" | "completed" | "missed"
      session_status: "active" | "completed" | "abandoned"
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
      achievement_metric: [
        "total_japas",
        "single_mantra_japas",
        "streak_days",
        "session_count",
      ],
      anushthana_status: ["active", "completed", "broken", "abandoned"],
      chant_mode: ["counter", "mala", "voice", "manual", "hands_free"],
      goal_period: ["daily", "weekly", "monthly", "yearly"],
      mantra_category: ["navagraha", "devata", "beeja", "custom"],
      mantra_type: ["graha", "adhidevata", "pratyadhidevata", "devata"],
      sankalpa_purpose: [
        "health_healing",
        "family_wellbeing",
        "spiritual_growth",
        "success_prosperity",
        "peace_of_mind",
        "custom",
      ],
      sankalpa_status: ["active", "completed", "missed"],
      session_status: ["active", "completed", "abandoned"],
    },
  },
} as const
