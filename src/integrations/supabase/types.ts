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
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          room_id: string
          status?: Database["public"]["Enums"]["bed_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          room_id?: string
          status?: Database["public"]["Enums"]["bed_status"]
          updated_at?: string
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
            alumni_checkins: {
        Row: {
          id: string
          alumni_id: string
          checkin_date: string
          method: string
          sobriety_confirmed: boolean | null
          employment_status: string | null
          housing_status: string | null
          notes: string | null
          conducted_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          alumni_id: string
          checkin_date?: string
          method?: string
          sobriety_confirmed?: boolean | null
          employment_status?: string | null
          housing_status?: string | null
          notes?: string | null
          conducted_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          alumni_id?: string
          checkin_date?: string
          method?: string
          sobriety_confirmed?: boolean | null
          employment_status?: string | null
          housing_status?: string | null
          notes?: string | null
          conducted_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      alumni_followups: {
        Row: {
          id: string
          resident_id: string | null
          followup_date: string
          status: string
          employment: string | null
          housing: string | null
          sobriety_status: string | null
          notes: string | null
          conducted_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          resident_id?: string | null
          followup_date: string
          status?: string
          employment?: string | null
          housing?: string | null
          sobriety_status?: string | null
          notes?: string | null
          conducted_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          resident_id?: string | null
          followup_date?: string
          status?: string
          employment?: string | null
          housing?: string | null
          sobriety_status?: string | null
          notes?: string | null
          conducted_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      alumni_profiles: {
        Row: {
          id: string
          resident_id: string
          opt_in: boolean
          sober_date: string | null
          current_city: string | null
          willing_to_mentor: boolean
          contact_email: string | null
          contact_phone: string | null
          created_at: string
        }
        Insert: {
          id?: string
          resident_id: string
          opt_in?: boolean
          sober_date?: string | null
          current_city?: string | null
          willing_to_mentor?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          resident_id?: string
          opt_in?: boolean
          sober_date?: string | null
          current_city?: string | null
          willing_to_mentor?: boolean
          contact_email?: string | null
          contact_phone?: string | null
          created_at?: string
        }
        Relationships: []
      }
      chores: {
        Row: {
          id: string
          house_id: string | null
          title: string
          description: string | null
          assigned_to: string | null
          due_date: string | null
          frequency: string
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          house_id?: string | null
          title: string
          description?: string | null
          assigned_to?: string | null
          due_date?: string | null
          frequency?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          house_id?: string | null
          title?: string
          description?: string | null
          assigned_to?: string | null
          due_date?: string | null
          frequency?: string
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      communication_logs: {
        Row: {
          id: string
          recipient_type: string
          recipient_id: string | null
          recipient_name: string | null
          channel: string
          template_id: string | null
          subject: string | null
          body: string
          variables_used: Json | null
          status: string
          sent_by: string | null
          sent_at: string | null
          read_at: string | null
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipient_type: string
          recipient_id?: string | null
          recipient_name?: string | null
          channel: string
          template_id?: string | null
          subject?: string | null
          body: string
          variables_used?: Json | null
          status?: string
          sent_by?: string | null
          sent_at?: string | null
          read_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipient_type?: string
          recipient_id?: string | null
          recipient_name?: string | null
          channel?: string
          template_id?: string | null
          subject?: string | null
          body?: string
          variables_used?: Json | null
          status?: string
          sent_by?: string | null
          sent_at?: string | null
          read_at?: string | null
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      expense_records: {
        Row: {
          id: string
          house_id: string | null
          category: string
          amount: number
          date: string
          description: string | null
          receipt_url: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          house_id?: string | null
          category: string
          amount: number
          date: string
          description?: string | null
          receipt_url?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          house_id?: string | null
          category?: string
          amount?: number
          date?: string
          description?: string | null
          receipt_url?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      financial_snapshots: {
        Row: {
          id: string
          house_id: string | null
          month: string
          revenue: number
          expenses: number
          noi: number | null
          occupancy_rate: number | null
          total_beds: number | null
          occupied_beds: number | null
          generated_at: string
          created_at: string
        }
        Insert: {
          id?: string
          house_id?: string | null
          month: string
          revenue?: number
          expenses?: number
          noi?: number | null
          occupancy_rate?: number | null
          total_beds?: number | null
          occupied_beds?: number | null
          generated_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          house_id?: string | null
          month?: string
          revenue?: number
          expenses?: number
          noi?: number | null
          occupancy_rate?: number | null
          total_beds?: number | null
          occupied_beds?: number | null
          generated_at?: string
          created_at?: string
        }
        Relationships: []
      }
      investor_accounts: {
        Row: {
          id: string
          user_id: string
          access_level: string
          linked_house_ids: string[]
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          access_level?: string
          linked_house_ids?: string[]
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          access_level?: string
          linked_house_ids?: string[]
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      lead_attributions: {
        Row: {
          id: string
          lead_id: string
          channel_id: string
          campaign_name: string | null
          cost: number
          created_at: string
        }
        Insert: {
          id?: string
          lead_id: string
          channel_id: string
          campaign_name?: string | null
          cost?: number
          created_at?: string
        }
        Update: {
          id?: string
          lead_id?: string
          channel_id?: string
          campaign_name?: string | null
          cost?: number
          created_at?: string
        }
        Relationships: []
      }
      lms_certificates: {
        Row: {
          id: string
          user_id: string
          course_id: string
          certificate_number: string
          issued_at: string
          expires_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          certificate_number: string
          issued_at?: string
          expires_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          certificate_number?: string
          issued_at?: string
          expires_at?: string | null
        }
        Relationships: []
      }
      lms_courses: {
        Row: {
          id: string
          title: string
          description: string
          category: string
          cover_color: string
          estimated_minutes: number
          passing_score: number
          is_required: boolean
          is_active: boolean
          sort_order: number
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          category?: string
          cover_color?: string
          estimated_minutes?: number
          passing_score?: number
          is_required?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          category?: string
          cover_color?: string
          estimated_minutes?: number
          passing_score?: number
          is_required?: boolean
          is_active?: boolean
          sort_order?: number
          created_at?: string
        }
        Relationships: []
      }
      lms_enrollments: {
        Row: {
          id: string
          user_id: string
          course_id: string
          status: string
          progress_pct: number
          enrolled_at: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          course_id: string
          status?: string
          progress_pct?: number
          enrolled_at?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          course_id?: string
          status?: string
          progress_pct?: number
          enrolled_at?: string
          completed_at?: string | null
        }
        Relationships: []
      }
      lms_lesson_progress: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          completed_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          completed_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          completed_at?: string
        }
        Relationships: []
      }
      lms_lessons: {
        Row: {
          id: string
          course_id: string
          sort_order: number
          title: string
          content_type: string
          content_url: string | null
          content_body: string | null
          duration_minutes: number
          has_quiz: boolean
          created_at: string
        }
        Insert: {
          id?: string
          course_id: string
          sort_order?: number
          title: string
          content_type?: string
          content_url?: string | null
          content_body?: string | null
          duration_minutes?: number
          has_quiz?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          course_id?: string
          sort_order?: number
          title?: string
          content_type?: string
          content_url?: string | null
          content_body?: string | null
          duration_minutes?: number
          has_quiz?: boolean
          created_at?: string
        }
        Relationships: []
      }
      lms_quiz_attempts: {
        Row: {
          id: string
          user_id: string
          lesson_id: string
          answers_json: Json
          score: number
          passed: boolean
          attempted_at: string
        }
        Insert: {
          id?: string
          user_id: string
          lesson_id: string
          answers_json: Json
          score: number
          passed?: boolean
          attempted_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          lesson_id?: string
          answers_json?: Json
          score?: number
          passed?: boolean
          attempted_at?: string
        }
        Relationships: []
      }
      lms_quiz_questions: {
        Row: {
          id: string
          lesson_id: string
          sort_order: number
          question: string
          options_json: Json
          correct_index: number
          explanation: string | null
          created_at: string
        }
        Insert: {
          id?: string
          lesson_id: string
          sort_order?: number
          question: string
          options_json: Json
          correct_index: number
          explanation?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          lesson_id?: string
          sort_order?: number
          question?: string
          options_json?: Json
          correct_index?: number
          explanation?: string | null
          created_at?: string
        }
        Relationships: []
      }
      maintenance_attachments: {
        Row: {
          id: string
          request_id: string
          file_url: string
          file_name: string
          file_type: string | null
          uploaded_by: string | null
          uploaded_at: string
        }
        Insert: {
          id?: string
          request_id: string
          file_url: string
          file_name: string
          file_type?: string | null
          uploaded_by?: string | null
          uploaded_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          file_url?: string
          file_name?: string
          file_type?: string | null
          uploaded_by?: string | null
          uploaded_at?: string
        }
        Relationships: []
      }
      maintenance_budgets: {
        Row: {
          id: string
          house_id: string
          quarter: number
          year: number
          allocated: number
          spent: number
          created_at: string
        }
        Insert: {
          id?: string
          house_id: string
          quarter: number
          year: number
          allocated?: number
          spent?: number
          created_at?: string
        }
        Update: {
          id?: string
          house_id?: string
          quarter?: number
          year?: number
          allocated?: number
          spent?: number
          created_at?: string
        }
        Relationships: []
      }
      maintenance_comments: {
        Row: {
          id: string
          request_id: string
          user_id: string | null
          comment: string
          is_internal: boolean
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          user_id?: string | null
          comment: string
          is_internal?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          user_id?: string | null
          comment?: string
          is_internal?: boolean
          created_at?: string
        }
        Relationships: []
      }
      maintenance_costs: {
        Row: {
          id: string
          request_id: string
          cost_type: string
          amount: number
          description: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          request_id: string
          cost_type?: string
          amount: number
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          request_id?: string
          cost_type?: string
          amount?: number
          description?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      maintenance_sla_rules: {
        Row: {
          id: string
          priority: string
          response_hours: number
          resolution_hours: number
          created_at: string
        }
        Insert: {
          id?: string
          priority: string
          response_hours: number
          resolution_hours: number
          created_at?: string
        }
        Update: {
          id?: string
          priority?: string
          response_hours?: number
          resolution_hours?: number
          created_at?: string
        }
        Relationships: []
      }
      marketing_channels: {
        Row: {
          id: string
          name: string
          channel_type: string
          monthly_cost: number
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          channel_type?: string
          monthly_cost?: number
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          channel_type?: string
          monthly_cost?: number
          is_active?: boolean
          created_at?: string
        }
        Relationships: []
      }
      mentorship_pairs: {
        Row: {
          id: string
          alumni_id: string
          resident_id: string
          start_date: string
          end_date: string | null
          status: string
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          alumni_id: string
          resident_id: string
          start_date?: string
          end_date?: string | null
          status?: string
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          alumni_id?: string
          resident_id?: string
          start_date?: string
          end_date?: string | null
          status?: string
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      message_templates: {
        Row: {
          id: string
          name: string
          category: string
          subject_template: string
          body_template: string
          variables: string[]
          is_system: boolean
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          category: string
          subject_template: string
          body_template: string
          variables?: string[]
          is_system?: boolean
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          category?: string
          subject_template?: string
          body_template?: string
          variables?: string[]
          is_system?: boolean
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      message_threads: {
        Row: {
          id: string
          subject: string
          house_id: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          subject: string
          house_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          subject?: string
          house_id?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          thread_id: string
          sender_id: string | null
          body: string
          read: boolean
          created_at: string
        }
        Insert: {
          id?: string
          thread_id: string
          sender_id?: string | null
          body: string
          read?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          thread_id?: string
          sender_id?: string | null
          body?: string
          read?: boolean
          created_at?: string
        }
        Relationships: []
      }
      notification_log: {
        Row: {
          id: string
          recipient_id: string
          channel: string
          category: string
          title: string
          body: string
          status: string
          read_at: string | null
          sent_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          recipient_id: string
          channel: string
          category?: string
          title: string
          body: string
          status?: string
          read_at?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          recipient_id?: string
          channel?: string
          category?: string
          title?: string
          body?: string
          status?: string
          read_at?: string | null
          sent_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      notification_preferences: {
        Row: {
          id: string
          user_id: string
          channel: string
          category: string
          enabled: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          channel: string
          category: string
          enabled?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          channel?: string
          category?: string
          enabled?: boolean
          created_at?: string
        }
        Relationships: []
      }
      portfolio_metrics: {
        Row: {
          id: string
          snapshot_date: string
          total_beds: number
          occupied_beds: number
          total_revenue: number
          total_expenses: number
          noi: number | null
          created_at: string
        }
        Insert: {
          id?: string
          snapshot_date: string
          total_beds?: number
          occupied_beds?: number
          total_revenue?: number
          total_expenses?: number
          noi?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          snapshot_date?: string
          total_beds?: number
          occupied_beds?: number
          total_revenue?: number
          total_expenses?: number
          noi?: number | null
          created_at?: string
        }
        Relationships: []
      }
      preventive_schedules: {
        Row: {
          id: string
          house_id: string | null
          task_name: string
          description: string | null
          frequency_days: number
          last_completed: string | null
          next_due: string
          assigned_vendor_id: string | null
          estimated_cost: number | null
          created_at: string
        }
        Insert: {
          id?: string
          house_id?: string | null
          task_name: string
          description?: string | null
          frequency_days?: number
          last_completed?: string | null
          next_due: string
          assigned_vendor_id?: string | null
          estimated_cost?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          house_id?: string | null
          task_name?: string
          description?: string | null
          frequency_days?: number
          last_completed?: string | null
          next_due?: string
          assigned_vendor_id?: string | null
          estimated_cost?: number | null
          created_at?: string
        }
        Relationships: []
      }
      projection_scenarios: {
        Row: {
          id: string
          name: string
          assumptions_json: Json
          results_json: Json
          created_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          assumptions_json?: Json
          results_json?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          assumptions_json?: Json
          results_json?: Json
          created_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      pto_requests: {
        Row: {
          id: string
          staff_id: string
          start_date: string
          end_date: string
          pto_type: string
          status: string
          notes: string | null
          approved_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          start_date: string
          end_date: string
          pto_type?: string
          status?: string
          notes?: string | null
          approved_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          start_date?: string
          end_date?: string
          pto_type?: string
          status?: string
          notes?: string | null
          approved_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      qb_account_mappings: {
        Row: {
          id: string
          user_id: string
          local_category: string
          qb_account_id: string
          qb_account_name: string
          qb_account_type: string | null
          active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          local_category: string
          qb_account_id: string
          qb_account_name: string
          qb_account_type?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          local_category?: string
          qb_account_id?: string
          qb_account_name?: string
          qb_account_type?: string | null
          active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      qb_connections: {
        Row: {
          id: string
          user_id: string
          realm_id: string | null
          company_name: string | null
          access_token_encrypted: string | null
          refresh_token_encrypted: string | null
          token_expires_at: string | null
          is_connected: boolean
          status: string
          last_sync_at: string | null
          sync_errors: number
          last_refreshed_at: string | null
          connected_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          realm_id?: string | null
          company_name?: string | null
          access_token_encrypted?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          is_connected?: boolean
          status?: string
          last_sync_at?: string | null
          sync_errors?: number
          last_refreshed_at?: string | null
          connected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          realm_id?: string | null
          company_name?: string | null
          access_token_encrypted?: string | null
          refresh_token_encrypted?: string | null
          token_expires_at?: string | null
          is_connected?: boolean
          status?: string
          last_sync_at?: string | null
          sync_errors?: number
          last_refreshed_at?: string | null
          connected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      qb_sync_log: {
        Row: {
          id: string
          connection_id: string | null
          user_id: string
          entity_type: string | null
          direction: string | null
          operation: string | null
          local_id: string | null
          qb_id: string | null
          entity_id: string | null
          status: string
          error_message: string | null
          request_payload: Json | null
          response_payload: Json | null
          payload_json: Json | null
          duration_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          connection_id?: string | null
          user_id: string
          entity_type?: string | null
          direction?: string | null
          operation?: string | null
          local_id?: string | null
          qb_id?: string | null
          entity_id?: string | null
          status?: string
          error_message?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          payload_json?: Json | null
          duration_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          connection_id?: string | null
          user_id?: string
          entity_type?: string | null
          direction?: string | null
          operation?: string | null
          local_id?: string | null
          qb_id?: string | null
          entity_id?: string | null
          status?: string
          error_message?: string | null
          request_payload?: Json | null
          response_payload?: Json | null
          payload_json?: Json | null
          duration_ms?: number | null
          created_at?: string
        }
        Relationships: []
      }
      qb_sync_mappings: {
        Row: {
          id: string
          connection_id: string | null
          user_id: string
          entity_type: string
          local_id: string
          qb_id: string | null
          last_synced: string | null
          last_synced_at: string | null
          sync_status: string
          error_message: string | null
          created_at: string
        }
        Insert: {
          id?: string
          connection_id?: string | null
          user_id: string
          entity_type: string
          local_id: string
          qb_id?: string | null
          last_synced?: string | null
          last_synced_at?: string | null
          sync_status?: string
          error_message?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          connection_id?: string | null
          user_id?: string
          entity_type?: string
          local_id?: string
          qb_id?: string | null
          last_synced?: string | null
          last_synced_at?: string | null
          sync_status?: string
          error_message?: string | null
          created_at?: string
        }
        Relationships: []
      }
      resident_outcomes: {
        Row: {
          id: string
          resident_id: string | null
          milestone_type: string
          milestone_date: string
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          resident_id?: string | null
          milestone_type: string
          milestone_date: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          resident_id?: string | null
          milestone_type?: string
          milestone_date?: string
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      resources: {
        Row: {
          id: string
          title: string
          description: string | null
          category: string
          url: string | null
          phone: string | null
          address: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          category: string
          url?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          category?: string
          url?: string | null
          phone?: string | null
          address?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      scheduled_communications: {
        Row: {
          id: string
          template_id: string | null
          recipient_type: string | null
          recipient_filter_json: Json | null
          channel: string
          scheduled_for: string
          recurrence: string
          status: string
          sent_at: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          template_id?: string | null
          recipient_type?: string | null
          recipient_filter_json?: Json | null
          channel?: string
          scheduled_for: string
          recurrence?: string
          status?: string
          sent_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          template_id?: string | null
          recipient_type?: string | null
          recipient_filter_json?: Json | null
          channel?: string
          scheduled_for?: string
          recurrence?: string
          status?: string
          sent_at?: string | null
          created_by?: string | null
          created_at?: string
        }
        Relationships: []
      }
      staff_schedules: {
        Row: {
          id: string
          staff_id: string
          house_id: string
          shift_date: string
          start_time: string
          end_time: string
          role: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          house_id: string
          shift_date: string
          start_time: string
          end_time: string
          role?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          house_id?: string
          shift_date?: string
          start_time?: string
          end_time?: string
          role?: string | null
          notes?: string | null
          created_at?: string
        }
        Relationships: []
      }
      startup_documents: {
        Row: {
          id: string
          wizard_id: string
          document_type: string
          title: string
          content: string
          generated_at: string
        }
        Insert: {
          id?: string
          wizard_id: string
          document_type: string
          title: string
          content: string
          generated_at?: string
        }
        Update: {
          id?: string
          wizard_id?: string
          document_type?: string
          title?: string
          content?: string
          generated_at?: string
        }
        Relationships: []
      }
      startup_wizards: {
        Row: {
          id: string
          user_id: string
          organization_name: string
          municipality: string
          narr_level: string
          current_step: number
          completed_steps: number[]
          step_data: Json
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          organization_name?: string
          municipality?: string
          narr_level?: string
          current_step?: number
          completed_steps?: number[]
          step_data?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          organization_name?: string
          municipality?: string
          narr_level?: string
          current_step?: number
          completed_steps?: number[]
          step_data?: Json
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      time_entries: {
        Row: {
          id: string
          staff_id: string
          house_id: string | null
          clock_in: string
          clock_out: string | null
          break_minutes: number
          total_hours: number | null
          created_at: string
        }
        Insert: {
          id?: string
          staff_id: string
          house_id?: string | null
          clock_in?: string
          clock_out?: string | null
          break_minutes?: number
          total_hours?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          staff_id?: string
          house_id?: string | null
          clock_in?: string
          clock_out?: string | null
          break_minutes?: number
          total_hours?: number | null
          created_at?: string
        }
        Relationships: []
      }
      vendor_ratings: {
        Row: {
          id: string
          vendor_id: string
          request_id: string | null
          rating: number
          feedback: string | null
          rated_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          vendor_id: string
          request_id?: string | null
          rating: number
          feedback?: string | null
          rated_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          vendor_id?: string
          request_id?: string | null
          rating?: number
          feedback?: string | null
          rated_by?: string | null
          created_at?: string
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
