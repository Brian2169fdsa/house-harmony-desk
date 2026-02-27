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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          answers_json: Json | null
          created_at: string
          id: string
          lead_id: string
          status: string
          updated_at: string
        }
        Insert: {
          answers_json?: Json | null
          created_at?: string
          id?: string
          lead_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          answers_json?: Json | null
          created_at?: string
          id?: string
          lead_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "intake_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      beds: {
        Row: {
          created_at: string
          id: string
          label: string
          room_id: string
          status: Database["public"]["Enums"]["bed_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          room_id: string
          status?: Database["public"]["Enums"]["bed_status"]
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          room_id?: string
          status?: Database["public"]["Enums"]["bed_status"]
        }
        Relationships: [
          {
            foreignKeyName: "beds_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_activities: {
        Row: {
          body: string | null
          completed_at: string | null
          contact_id: string | null
          created_at: string
          created_by: string | null
          due_at: string | null
          id: string
          org_id: string | null
          subject: string
          type: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          org_id?: string | null
          subject: string
          type: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          completed_at?: string | null
          contact_id?: string | null
          created_at?: string
          created_by?: string | null
          due_at?: string | null
          id?: string
          org_id?: string | null
          subject?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_activities_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_activities_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "crm_organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_contacts: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          last_name: string
          org_id: string | null
          owner_user_id: string | null
          phone: string | null
          resident_id: string | null
          role: string | null
          segment: string
          source: string | null
          status: string
          tags: string[] | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name: string
          id?: string
          last_name: string
          org_id?: string | null
          owner_user_id?: string | null
          phone?: string | null
          resident_id?: string | null
          role?: string | null
          segment?: string
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          last_name?: string
          org_id?: string | null
          owner_user_id?: string | null
          phone?: string | null
          resident_id?: string | null
          role?: string | null
          segment?: string
          source?: string | null
          status?: string
          tags?: string[] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_contacts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "crm_organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_contacts_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      crm_lists: {
        Row: {
          created_at: string
          filter_json: Json | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          filter_json?: Json | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          filter_json?: Json | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      crm_organizations: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          postal_code: string | null
          state: string | null
          type: string
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          type?: string
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      crm_referrals: {
        Row: {
          contact_id: string
          created_at: string
          id: string
          intake_lead_id: string | null
          notes: string | null
          referred_email: string | null
          referred_person_name: string
          referred_phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contact_id: string
          created_at?: string
          id?: string
          intake_lead_id?: string | null
          notes?: string | null
          referred_email?: string | null
          referred_person_name: string
          referred_phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contact_id?: string
          created_at?: string
          id?: string
          intake_lead_id?: string | null
          notes?: string | null
          referred_email?: string | null
          referred_person_name?: string
          referred_phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "crm_referrals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "crm_contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "crm_referrals_intake_lead_id_fkey"
            columns: ["intake_lead_id"]
            isOneToOne: false
            referencedRelation: "intake_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      houses: {
        Row: {
          address: string
          created_at: string
          id: string
          manager_id: string | null
          name: string
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          manager_id?: string | null
          name: string
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          manager_id?: string | null
          name?: string
        }
        Relationships: []
      }
      intake_leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          referral_source: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          referral_source?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          referral_source?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      maintenance_requests: {
        Row: {
          attachments: Json | null
          completed_at: string | null
          contact_phone: string | null
          cost_estimate_cents: number | null
          created_at: string
          description: string | null
          house_id: string
          id: string
          priority: string
          requested_for_at: string | null
          service_id: string
          status: string
          submitted_by_user_id: string | null
          title: string
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          attachments?: Json | null
          completed_at?: string | null
          contact_phone?: string | null
          cost_estimate_cents?: number | null
          created_at?: string
          description?: string | null
          house_id: string
          id?: string
          priority?: string
          requested_for_at?: string | null
          service_id: string
          status?: string
          submitted_by_user_id?: string | null
          title: string
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          attachments?: Json | null
          completed_at?: string | null
          contact_phone?: string | null
          cost_estimate_cents?: number | null
          created_at?: string
          description?: string | null
          house_id?: string
          id?: string
          priority?: string
          requested_for_at?: string | null
          service_id?: string
          status?: string
          submitted_by_user_id?: string | null
          title?: string
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_requests_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_requests_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      offers: {
        Row: {
          bed_id: string | null
          created_at: string
          deposit_amount: number | null
          expires_at: string | null
          id: string
          lead_id: string
          status: string
          updated_at: string
        }
        Insert: {
          bed_id?: string | null
          created_at?: string
          deposit_amount?: number | null
          expires_at?: string | null
          id?: string
          lead_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          bed_id?: string | null
          created_at?: string
          deposit_amount?: number | null
          expires_at?: string | null
          id?: string
          lead_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "intake_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      residents: {
        Row: {
          balance: number | null
          bed_id: string | null
          created_at: string
          id: string
          lease_end: string | null
          lease_start: string | null
          move_in_date: string | null
          move_out_date: string | null
          name: string
          program_phase: string | null
          room: string | null
          status: string | null
        }
        Insert: {
          balance?: number | null
          bed_id?: string | null
          created_at?: string
          id?: string
          lease_end?: string | null
          lease_start?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          name: string
          program_phase?: string | null
          room?: string | null
          status?: string | null
        }
        Update: {
          balance?: number | null
          bed_id?: string | null
          created_at?: string
          id?: string
          lease_end?: string | null
          lease_start?: string | null
          move_in_date?: string | null
          move_out_date?: string | null
          name?: string
          program_phase?: string | null
          room?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "residents_bed_id_fkey"
            columns: ["bed_id"]
            isOneToOne: false
            referencedRelation: "beds"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          created_at: string
          house_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          house_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          house_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          default_sla_hours: number | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          category: string
          default_sla_hours?: number | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          category?: string
          default_sla_hours?: number | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      vendor_services: {
        Row: {
          coverage_city: string | null
          coverage_zip: string | null
          id: string
          preferred: boolean | null
          service_id: string
          vendor_id: string
        }
        Insert: {
          coverage_city?: string | null
          coverage_zip?: string | null
          id?: string
          preferred?: boolean | null
          service_id: string
          vendor_id: string
        }
        Update: {
          coverage_city?: string | null
          coverage_zip?: string | null
          id?: string
          preferred?: boolean | null
          service_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vendor_services_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          active: boolean | null
          created_at: string
          discount_pct: number | null
          email: string | null
          id: string
          is_trusted: boolean | null
          name: string
          notes: string | null
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          active?: boolean | null
          created_at?: string
          discount_pct?: number | null
          email?: string | null
          id?: string
          is_trusted?: boolean | null
          name: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          active?: boolean | null
          created_at?: string
          discount_pct?: number | null
          email?: string | null
          id?: string
          is_trusted?: boolean | null
          name?: string
          notes?: string | null
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: []
      }
      facility_settings: {
        Row: {
          id: string
          facility_name: string
          address: string
          total_beds: number | null
          default_rent_amount: number | null
          deposit_cap: number | null
          auto_monthly_invoices: boolean | null
          notification_payment_reminders: boolean | null
          notification_incident_alerts: boolean | null
          notification_daily_summary: boolean | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          facility_name?: string
          address?: string
          total_beds?: number | null
          default_rent_amount?: number | null
          deposit_cap?: number | null
          auto_monthly_invoices?: boolean | null
          notification_payment_reminders?: boolean | null
          notification_incident_alerts?: boolean | null
          notification_daily_summary?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          facility_name?: string
          address?: string
          total_beds?: number | null
          default_rent_amount?: number | null
          deposit_cap?: number | null
          auto_monthly_invoices?: boolean | null
          notification_payment_reminders?: boolean | null
          notification_incident_alerts?: boolean | null
          notification_daily_summary?: boolean | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          id: string
          house_id: string | null
          resident_id: string | null
          type: string
          description: string
          severity: string
          status: string
          reported_by: string | null
          resolved_at: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          house_id?: string | null
          resident_id?: string | null
          type: string
          description: string
          severity?: string
          status?: string
          reported_by?: string | null
          resolved_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          house_id?: string | null
          resident_id?: string | null
          type?: string
          description?: string
          severity?: string
          status?: string
          reported_by?: string | null
          resolved_at?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "incidents_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          id: string
          resident_id: string | null
          resident_name: string | null
          amount: number
          due_date: string | null
          paid_date: string | null
          status: string
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resident_id?: string | null
          resident_name?: string | null
          amount: number
          due_date?: string | null
          paid_date?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resident_id?: string | null
          resident_name?: string | null
          amount?: number
          due_date?: string | null
          paid_date?: string | null
          status?: string
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      resident_documents: {
        Row: {
          id: string
          resident_id: string
          name: string
          file_path: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          name: string
          file_path: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          name?: string
          file_path?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "resident_documents_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      bed_status: "available" | "held" | "occupied"
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
      bed_status: ["available", "held", "occupied"],
    },
  },
} as const
