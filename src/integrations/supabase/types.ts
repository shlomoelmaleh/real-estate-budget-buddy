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
          description: string
          event_type: Database["public"]["Enums"]["partner_event_type"]
          id: string
          metadata: Json
          partner_id: string | null
          timestamp: string
        }
        Insert: {
          description: string
          event_type: Database["public"]["Enums"]["partner_event_type"]
          id?: string
          metadata?: Json
          partner_id?: string | null
          timestamp?: string
        }
        Update: {
          description?: string
          event_type?: Database["public"]["Enums"]["partner_event_type"]
          id?: string
          metadata?: Json
          partner_id?: string | null
          timestamp?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_logs_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      funnel_events: {
        Row: {
          client_timestamp: string | null
          created_at: string
          event_type: string | null
          id: string
          language: string
          partner_id: string | null
          session_id: string
          step_reached: number
        }
        Insert: {
          client_timestamp?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          language: string
          partner_id?: string | null
          session_id: string
          step_reached: number
        }
        Update: {
          client_timestamp?: string | null
          created_at?: string
          event_type?: string | null
          id?: string
          language?: string
          partner_id?: string | null
          session_id?: string
          step_reached?: number
        }
        Relationships: [
          {
            foreignKeyName: "funnel_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "funnel_events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_config_audit: {
        Row: {
          changed_at: string | null
          changed_by: string | null
          changed_field: string
          id: string
          new_value: string
          old_value: string | null
          partner_id: string
        }
        Insert: {
          changed_at?: string | null
          changed_by?: string | null
          changed_field: string
          id?: string
          new_value: string
          old_value?: string | null
          partner_id: string
        }
        Update: {
          changed_at?: string | null
          changed_by?: string | null
          changed_field?: string
          id?: string
          new_value?: string
          old_value?: string | null
          partner_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_config_audit_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_config_audit_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners_public"
            referencedColumns: ["id"]
          },
        ]
      }
      partners: {
        Row: {
          advisor_fee_fixed: number | null
          brand_color: string | null
          broker_fee_percent: number | null
          config_updated_at: string | null
          config_updated_by: string | null
          created_at: string
          default_interest_rate: number | null
          email: string | null
          enable_rent_validation: boolean | null
          enable_what_if_calculator: boolean | null
          id: string
          is_active: boolean
          lawyer_fee_percent: number | null
          logo_url: string | null
          max_age: number | null
          max_amortization_months: number | null
          max_dti_ratio: number | null
          max_loan_term_years: number | null
          name: string
          other_fee_fixed: number | null
          owner_user_id: string | null
          phone: string | null
          rent_recognition_first_property: number | null
          rent_recognition_investment: number | null
          rent_warning_high_multiplier: number | null
          rent_warning_low_multiplier: number | null
          rental_yield_default: number | null
          show_amortization_table: boolean | null
          slogan: string | null
          slogan_font_family: string | null
          slogan_font_size: string | null
          slogan_font_style: string | null
          slug: string
          vat_percent: number | null
          whatsapp: string | null
        }
        Insert: {
          advisor_fee_fixed?: number | null
          brand_color?: string | null
          broker_fee_percent?: number | null
          config_updated_at?: string | null
          config_updated_by?: string | null
          created_at?: string
          default_interest_rate?: number | null
          email?: string | null
          enable_rent_validation?: boolean | null
          enable_what_if_calculator?: boolean | null
          id?: string
          is_active?: boolean
          lawyer_fee_percent?: number | null
          logo_url?: string | null
          max_age?: number | null
          max_amortization_months?: number | null
          max_dti_ratio?: number | null
          max_loan_term_years?: number | null
          name: string
          other_fee_fixed?: number | null
          owner_user_id?: string | null
          phone?: string | null
          rent_recognition_first_property?: number | null
          rent_recognition_investment?: number | null
          rent_warning_high_multiplier?: number | null
          rent_warning_low_multiplier?: number | null
          rental_yield_default?: number | null
          show_amortization_table?: boolean | null
          slogan?: string | null
          slogan_font_family?: string | null
          slogan_font_size?: string | null
          slogan_font_style?: string | null
          slug: string
          vat_percent?: number | null
          whatsapp?: string | null
        }
        Update: {
          advisor_fee_fixed?: number | null
          brand_color?: string | null
          broker_fee_percent?: number | null
          config_updated_at?: string | null
          config_updated_by?: string | null
          created_at?: string
          default_interest_rate?: number | null
          email?: string | null
          enable_rent_validation?: boolean | null
          enable_what_if_calculator?: boolean | null
          id?: string
          is_active?: boolean
          lawyer_fee_percent?: number | null
          logo_url?: string | null
          max_age?: number | null
          max_amortization_months?: number | null
          max_dti_ratio?: number | null
          max_loan_term_years?: number | null
          name?: string
          other_fee_fixed?: number | null
          owner_user_id?: string | null
          phone?: string | null
          rent_recognition_first_property?: number | null
          rent_recognition_investment?: number | null
          rent_warning_high_multiplier?: number | null
          rent_warning_low_multiplier?: number | null
          rental_yield_default?: number | null
          show_amortization_table?: boolean | null
          slogan?: string | null
          slogan_font_family?: string | null
          slogan_font_size?: string | null
          slogan_font_style?: string | null
          slug?: string
          vat_percent?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          endpoint: string
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          endpoint: string
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          endpoint?: string
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      simulations: {
        Row: {
          client_name: string
          created_at: string
          email: string
          id: string
          inputs: Json
          language: string | null
          partner_id: string | null
          phone: string
          results: Json
        }
        Insert: {
          client_name: string
          created_at?: string
          email: string
          id?: string
          inputs: Json
          language?: string | null
          partner_id?: string | null
          phone: string
          results: Json
        }
        Update: {
          client_name?: string
          created_at?: string
          email?: string
          id?: string
          inputs?: Json
          language?: string | null
          partner_id?: string | null
          phone?: string
          results?: Json
        }
        Relationships: [
          {
            foreignKeyName: "simulations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "simulations_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners_public"
            referencedColumns: ["id"]
          },
        ]
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
      partners_public: {
        Row: {
          advisor_fee_fixed: number | null
          brand_color: string | null
          broker_fee_percent: number | null
          default_interest_rate: number | null
          email: string | null
          enable_rent_validation: boolean | null
          enable_what_if_calculator: boolean | null
          id: string | null
          is_active: boolean | null
          lawyer_fee_percent: number | null
          logo_url: string | null
          max_age: number | null
          max_amortization_months: number | null
          max_dti_ratio: number | null
          max_loan_term_years: number | null
          name: string | null
          other_fee_fixed: number | null
          owner_user_id: string | null
          phone: string | null
          rent_recognition_first_property: number | null
          rent_recognition_investment: number | null
          rent_warning_high_multiplier: number | null
          rent_warning_low_multiplier: number | null
          rental_yield_default: number | null
          show_amortization_table: boolean | null
          slogan: string | null
          slogan_font_size: string | null
          slogan_font_style: string | null
          slug: string | null
          vat_percent: number | null
          whatsapp: string | null
        }
        Insert: {
          advisor_fee_fixed?: number | null
          brand_color?: string | null
          broker_fee_percent?: number | null
          default_interest_rate?: number | null
          email?: string | null
          enable_rent_validation?: boolean | null
          enable_what_if_calculator?: boolean | null
          id?: string | null
          is_active?: boolean | null
          lawyer_fee_percent?: number | null
          logo_url?: string | null
          max_age?: number | null
          max_amortization_months?: number | null
          max_dti_ratio?: number | null
          max_loan_term_years?: number | null
          name?: string | null
          other_fee_fixed?: number | null
          owner_user_id?: string | null
          phone?: string | null
          rent_recognition_first_property?: number | null
          rent_recognition_investment?: number | null
          rent_warning_high_multiplier?: number | null
          rent_warning_low_multiplier?: number | null
          rental_yield_default?: number | null
          show_amortization_table?: boolean | null
          slogan?: string | null
          slogan_font_size?: string | null
          slogan_font_style?: string | null
          slug?: string | null
          vat_percent?: number | null
          whatsapp?: string | null
        }
        Update: {
          advisor_fee_fixed?: number | null
          brand_color?: string | null
          broker_fee_percent?: number | null
          default_interest_rate?: number | null
          email?: string | null
          enable_rent_validation?: boolean | null
          enable_what_if_calculator?: boolean | null
          id?: string | null
          is_active?: boolean | null
          lawyer_fee_percent?: number | null
          logo_url?: string | null
          max_age?: number | null
          max_amortization_months?: number | null
          max_dti_ratio?: number | null
          max_loan_term_years?: number | null
          name?: string | null
          other_fee_fixed?: number | null
          owner_user_id?: string | null
          phone?: string | null
          rent_recognition_first_property?: number | null
          rent_recognition_investment?: number | null
          rent_warning_high_multiplier?: number | null
          rent_warning_low_multiplier?: number | null
          rental_yield_default?: number | null
          show_amortization_table?: boolean | null
          slogan?: string | null
          slogan_font_size?: string | null
          slogan_font_style?: string | null
          slug?: string | null
          vat_percent?: number | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      atomic_rate_limit: {
        Args: {
          p_endpoint: string
          p_identifier: string
          p_max_requests: number
          p_window_minutes: number
        }
        Returns: {
          allowed: boolean
          current_count: number
          remaining: number
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
      partner_event_type:
        | "LEAD_SENT"
        | "LEAD_FAILED"
        | "STATUS_CHANGE"
        | "PARTNER_CREATED"
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
      app_role: ["admin", "user"],
      partner_event_type: [
        "LEAD_SENT",
        "LEAD_FAILED",
        "STATUS_CHANGE",
        "PARTNER_CREATED",
      ],
    },
  },
} as const
