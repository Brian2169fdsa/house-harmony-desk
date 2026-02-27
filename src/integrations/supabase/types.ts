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
      incidents: {
        Row: {
          created_at: string
          description: string
          id: string
          resident_id: string | null
          resident_name: string | null
          severity: string
          status: string
          type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          resident_id?: string | null
          resident_name?: string | null
          severity?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          resident_id?: string | null
          resident_name?: string | null
          severity?: string
          status?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          description: string | null
          due_date: string
          house_id: string | null
          id: string
          paid_date: string | null
          resident_id: string | null
          status: string
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          description?: string | null
          due_date: string
          house_id?: string | null
          id?: string
          paid_date?: string | null
          resident_id?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          description?: string | null
          due_date?: string
          house_id?: string | null
          id?: string
          paid_date?: string | null
          resident_id?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
      }
      notices: {
        Row: {
          body: string | null
          created_at: string
          house_id: string | null
          id: string
          resident_id: string | null
          response_deadline: string | null
          serve_method: string | null
          served_date: string | null
          status: string
          subject: string
          type: string
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          house_id?: string | null
          id?: string
          resident_id?: string | null
          response_deadline?: string | null
          serve_method?: string | null
          served_date?: string | null
          status?: string
          subject: string
          type: string
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          house_id?: string | null
          id?: string
          resident_id?: string | null
          response_deadline?: string | null
          serve_method?: string | null
          served_date?: string | null
          status?: string
          subject?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "notices_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notices_house_id_fkey"
            columns: ["house_id"]
            isOneToOne: false
            referencedRelation: "houses"
            referencedColumns: ["id"]
          },
        ]
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
      audit_log: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          old_value: Json | null
          new_value: Json | null
          ip_address: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          old_value?: Json | null
          new_value?: Json | null
          ip_address?: string | null
          created_at?: string
        }
        Relationships: []
      }
      staff_profiles: {
        Row: {
          id: string
          user_id: string
          role: string
          full_name: string
          phone: string | null
          hire_date: string | null
          status: string
          house_id: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role?: string
          full_name?: string
          phone?: string | null
          hire_date?: string | null
          status?: string
          house_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          full_name?: string
          phone?: string | null
          hire_date?: string | null
          status?: string
          house_id?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      staff_invitations: {
        Row: {
          id: string
          email: string
          role: string
          invited_by: string | null
          token: string
          expires_at: string
          accepted_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role?: string
          invited_by?: string | null
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          invited_by?: string | null
          token?: string
          expires_at?: string
          accepted_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      drug_tests: {
        Row: {
          id: string
          resident_id: string
          test_date: string
          test_type: string
          result: string
          administered_by: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          test_date?: string
          test_type?: string
          result?: string
          administered_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          test_date?: string
          test_type?: string
          result?: string
          administered_by?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "drug_tests_resident_id_fkey"
            columns: ["resident_id"]
            isOneToOne: false
            referencedRelation: "residents"
            referencedColumns: ["id"]
          },
        ]
      }
      drug_test_schedules: {
        Row: {
          id: string
          resident_id: string
          frequency: string
          last_test_date: string | null
          next_test_date: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          frequency?: string
          last_test_date?: string | null
          next_test_date?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          frequency?: string
          last_test_date?: string | null
          next_test_date?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      meeting_attendance: {
        Row: {
          id: string
          resident_id: string
          meeting_type: string
          meeting_date: string
          meeting_name: string | null
          verified: boolean
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          meeting_type?: string
          meeting_date?: string
          meeting_name?: string | null
          verified?: boolean
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          meeting_type?: string
          meeting_date?: string
          meeting_name?: string | null
          verified?: boolean
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      court_requirements: {
        Row: {
          id: string
          resident_id: string
          requirement_type: string
          frequency: string | null
          officer_name: string | null
          officer_phone: string | null
          officer_email: string | null
          next_check_in_date: string | null
          notes: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          requirement_type: string
          frequency?: string | null
          officer_name?: string | null
          officer_phone?: string | null
          officer_email?: string | null
          next_check_in_date?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          requirement_type?: string
          frequency?: string | null
          officer_name?: string | null
          officer_phone?: string | null
          officer_email?: string | null
          next_check_in_date?: string | null
          notes?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      employment_records: {
        Row: {
          id: string
          resident_id: string
          employer: string
          position: string | null
          start_date: string | null
          end_date: string | null
          hourly_rate: number | null
          verified: boolean
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          employer: string
          position?: string | null
          start_date?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          verified?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          employer?: string
          position?: string | null
          start_date?: string | null
          end_date?: string | null
          hourly_rate?: number | null
          verified?: boolean
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      program_phase_rules: {
        Row: {
          id: string
          phase_number: number
          phase_name: string
          min_days_required: number
          required_meetings_per_week: number
          required_tests_per_week: number
          curfew_time: string | null
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          phase_number: number
          phase_name: string
          min_days_required?: number
          required_meetings_per_week?: number
          required_tests_per_week?: number
          curfew_time?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          phase_number?: number
          phase_name?: string
          min_days_required?: number
          required_meetings_per_week?: number
          required_tests_per_week?: number
          curfew_time?: string | null
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          category: string
          estimated_days: number | null
          items: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          category: string
          estimated_days?: number | null
          items?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          category?: string
          estimated_days?: number | null
          items?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklists: {
        Row: {
          id: string
          template_id: string | null
          house_id: string | null
          resident_id: string | null
          title: string
          status: string
          assignee: string | null
          due_date: string | null
          start_date: string | null
          completed_at: string | null
          created_by: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          template_id?: string | null
          house_id?: string | null
          resident_id?: string | null
          title: string
          status?: string
          assignee?: string | null
          due_date?: string | null
          start_date?: string | null
          completed_at?: string | null
          created_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          template_id?: string | null
          house_id?: string | null
          resident_id?: string | null
          title?: string
          status?: string
          assignee?: string | null
          due_date?: string | null
          start_date?: string | null
          completed_at?: string | null
          created_by?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_items: {
        Row: {
          id: string
          checklist_id: string
          template_item_id: string | null
          title: string
          description: string | null
          category: string | null
          order_index: number
          status: string
          assignee: string | null
          due_date: string | null
          completed_at: string | null
          completed_by: string | null
          depends_on: string[] | null
          notes: string | null
          is_required: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          checklist_id: string
          template_item_id?: string | null
          title: string
          description?: string | null
          category?: string | null
          order_index?: number
          status?: string
          assignee?: string | null
          due_date?: string | null
          completed_at?: string | null
          completed_by?: string | null
          depends_on?: string[] | null
          notes?: string | null
          is_required?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          checklist_id?: string
          template_item_id?: string | null
          title?: string
          description?: string | null
          category?: string | null
          order_index?: number
          status?: string
          assignee?: string | null
          due_date?: string | null
          completed_at?: string | null
          completed_by?: string | null
          depends_on?: string[] | null
          notes?: string | null
          is_required?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      checklist_item_attachments: {
        Row: {
          id: string
          checklist_item_id: string
          file_name: string
          file_url: string
          file_size: number | null
          mime_type: string | null
          uploaded_by: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          checklist_item_id: string
          file_name: string
          file_url: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          checklist_item_id?: string
          file_name?: string
          file_url?: string
          file_size?: number | null
          mime_type?: string | null
          uploaded_by?: string | null
          uploaded_at?: string
        }
        Relationships: []
      }
      checklist_audit_log: {
        Row: {
          id: string
          checklist_id: string
          checklist_item_id: string | null
          action: string
          old_value: Json | null
          new_value: Json | null
          performed_by: string | null
          performed_at: string
        }
        Insert: {
          id?: string
          checklist_id: string
          checklist_item_id?: string | null
          action: string
          old_value?: Json | null
          new_value?: Json | null
          performed_by?: string | null
          performed_at?: string
        }
        Update: {
          id?: string
          checklist_id?: string
          checklist_item_id?: string | null
          action?: string
          old_value?: Json | null
          new_value?: Json | null
          performed_by?: string | null
          performed_at?: string
        }
        Relationships: []
      }
      document_templates: {
        Row: {
          id: string
          name: string
          category: string
          template_content: string
          variables_json: Json | null
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          category?: string
          template_content?: string
          variables_json?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          template_content?: string
          variables_json?: Json | null
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      generated_documents: {
        Row: {
          id: string
          template_id: string | null
          resident_id: string | null
          title: string
          filled_content: string
          created_by: string | null
          signed_at: string | null
          signature_data: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id?: string | null
          resident_id?: string | null
          title: string
          filled_content?: string
          created_by?: string | null
          signed_at?: string | null
          signature_data?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string | null
          resident_id?: string | null
          title?: string
          filled_content?: string
          created_by?: string | null
          signed_at?: string | null
          signature_data?: string | null
          created_at?: string
        }
        Relationships: []
      }
      emergency_contacts: {
        Row: {
          id: string
          resident_id: string
          contact_name: string
          relationship: string
          phone: string
          email: string | null
          priority_order: number
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          contact_name: string
          relationship: string
          phone: string
          email?: string | null
          priority_order?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          contact_name?: string
          relationship?: string
          phone?: string
          email?: string | null
          priority_order?: number
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_protocols: {
        Row: {
          id: string
          protocol_type: string
          title: string
          steps_json: Json
          last_reviewed: string | null
          reviewed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          protocol_type: string
          title: string
          steps_json?: Json
          last_reviewed?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          protocol_type?: string
          title?: string
          steps_json?: Json
          last_reviewed?: string | null
          reviewed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_supplies: {
        Row: {
          id: string
          house_id: string
          supply_type: string
          quantity: number
          expiration_date: string | null
          location: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          house_id: string
          supply_type: string
          quantity?: number
          expiration_date?: string | null
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          house_id?: string
          supply_type?: string
          quantity?: number
          expiration_date?: string | null
          location?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      emergency_events: {
        Row: {
          id: string
          house_id: string
          resident_id: string | null
          event_type: string
          description: string
          actions_taken: string | null
          responders: string[] | null
          outcome: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          house_id: string
          resident_id?: string | null
          event_type: string
          description: string
          actions_taken?: string | null
          responders?: string[] | null
          outcome?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          house_id?: string
          resident_id?: string | null
          event_type?: string
          description?: string
          actions_taken?: string | null
          responders?: string[] | null
          outcome?: string | null
          created_by?: string | null
          created_at?: string
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
          amount_cents: number
          created_at: string
          id: string
          invoice_id: string | null
          paid_at: string
          payment_method: string | null
          reference_number: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          paid_at?: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          id?: string
          invoice_id?: string | null
          paid_at?: string
          payment_method?: string | null
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
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
      agent_configurations: {
        Row: {
          id: string
          agent_type: string
          display_name: string
          description: string | null
          enabled: boolean
          config_json: Json
          schedule_cron: string | null
          last_run_at: string | null
          next_run_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          agent_type: string
          display_name: string
          description?: string | null
          enabled?: boolean
          config_json?: Json
          schedule_cron?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          agent_type?: string
          display_name?: string
          description?: string | null
          enabled?: boolean
          config_json?: Json
          schedule_cron?: string | null
          last_run_at?: string | null
          next_run_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      agent_actions_log: {
        Row: {
          id: string
          agent_type: string
          action_type: string
          entity_type: string | null
          entity_id: string | null
          input_json: Json | null
          output_json: Json | null
          status: string
          approved_by: string | null
          approved_at: string | null
          error_message: string | null
          tokens_used: number | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          agent_type: string
          action_type: string
          entity_type?: string | null
          entity_id?: string | null
          input_json?: Json | null
          output_json?: Json | null
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          error_message?: string | null
          tokens_used?: number | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          agent_type?: string
          action_type?: string
          entity_type?: string | null
          entity_id?: string | null
          input_json?: Json | null
          output_json?: Json | null
          status?: string
          approved_by?: string | null
          approved_at?: string | null
          error_message?: string | null
          tokens_used?: number | null
          duration_ms?: number | null
          created_at?: string
        }
        Relationships: []
      }
      agent_conversations: {
        Row: {
          id: string
          user_id: string | null
          agent_type: string
          title: string | null
          messages_json: Json
          context_json: Json | null
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          agent_type?: string
          title?: string | null
          messages_json?: Json
          context_json?: Json | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          agent_type?: string
          title?: string | null
          messages_json?: Json
          context_json?: Json | null
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_screening_results: {
        Row: {
          id: string
          lead_id: string | null
          fit_score: number | null
          screening_answers_json: Json | null
          flags: string[] | null
          agent_recommendation: string | null
          recommendation_reason: string | null
          operator_override: string | null
          override_by: string | null
          override_at: string | null
          screened_at: string
        }
        Insert: {
          id?: string
          lead_id?: string | null
          fit_score?: number | null
          screening_answers_json?: Json | null
          flags?: string[] | null
          agent_recommendation?: string | null
          recommendation_reason?: string | null
          operator_override?: string | null
          override_by?: string | null
          override_at?: string | null
          screened_at?: string
        }
        Update: {
          id?: string
          lead_id?: string | null
          fit_score?: number | null
          screening_answers_json?: Json | null
          flags?: string[] | null
          agent_recommendation?: string | null
          recommendation_reason?: string | null
          operator_override?: string | null
          override_by?: string | null
          override_at?: string | null
          screened_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_screening_results_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "intake_leads"
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
