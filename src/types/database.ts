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
      admin_users: {
        Row: {
          created_at: string
          email: string
          full_name: string
          id: string
          is_active: boolean
          last_login_at: string | null
          role: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          full_name: string
          id: string
          is_active?: boolean
          last_login_at?: string | null
          role?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          is_active?: boolean
          last_login_at?: string | null
          role?: string
          updated_at?: string
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "audit_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      gallery_images: {
        Row: {
          alt_text: string | null
          caption: string | null
          category: string
          created_at: string
          id: string
          is_active: boolean
          sort_order: number
          storage_path: string
          updated_at: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          caption?: string | null
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          storage_path: string
          updated_at?: string
          url: string
        }
        Update: {
          alt_text?: string | null
          caption?: string | null
          category?: string
          created_at?: string
          id?: string
          is_active?: boolean
          sort_order?: number
          storage_path?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      guests: {
        Row: {
          cpf: string | null
          created_at: string
          email: string
          full_name: string
          id: string
          nationality: string
          notes: string | null
          phone: string | null
          total_stays: number
          updated_at: string
        }
        Insert: {
          cpf?: string | null
          created_at?: string
          email: string
          full_name: string
          id?: string
          nationality?: string
          notes?: string | null
          phone?: string | null
          total_stays?: number
          updated_at?: string
        }
        Update: {
          cpf?: string | null
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          nationality?: string
          notes?: string | null
          phone?: string | null
          total_stays?: number
          updated_at?: string
        }
        Relationships: []
      }
      housekeeping_logs: {
        Row: {
          admin_user_id: string | null
          created_at: string
          from_status: string | null
          id: string
          note: string | null
          reservation_id: string | null
          room_id: string
          to_status: string
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          reservation_id?: string | null
          room_id: string
          to_status: string
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          from_status?: string | null
          id?: string
          note?: string | null
          reservation_id?: string | null
          room_id?: string
          to_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "housekeeping_logs_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_logs_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "housekeeping_logs_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          admin_notes: string | null
          adults: number | null
          check_in_interest: string | null
          check_out_interest: string | null
          children: number | null
          converted_reservation_id: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          phone: string | null
          room_category_id: string | null
          room_id: string | null
          source: string
          status: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          adults?: number | null
          check_in_interest?: string | null
          check_out_interest?: string | null
          children?: number | null
          converted_reservation_id?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          phone?: string | null
          room_category_id?: string | null
          room_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          adults?: number | null
          check_in_interest?: string | null
          check_out_interest?: string | null
          children?: number | null
          converted_reservation_id?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          phone?: string | null
          room_category_id?: string | null
          room_id?: string | null
          source?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_converted_reservation_id_fkey"
            columns: ["converted_reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_room_category_id_fkey"
            columns: ["room_category_id"]
            isOneToOne: false
            referencedRelation: "room_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leads_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      minimum_stay_rules: {
        Row: {
          applies_to: string
          applies_to_ids: string[] | null
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          minimum_nights: number
          name: string
          start_date: string
          updated_at: string
        }
        Insert: {
          applies_to?: string
          applies_to_ids?: string[] | null
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          minimum_nights: number
          name: string
          start_date: string
          updated_at?: string
        }
        Update: {
          applies_to?: string
          applies_to_ids?: string[] | null
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          minimum_nights?: number
          name?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_brl: number
          asaas_due_date: string | null
          asaas_invoice_url: string | null
          asaas_payment_id: string | null
          asaas_pix_copy_paste: string | null
          asaas_pix_qr_code: string | null
          created_at: string
          id: string
          manual_paid_by: string | null
          manual_payment_method: string | null
          manual_payment_note: string | null
          manual_receipt_path: string | null
          metadata: Json | null
          method: string
          paid_at: string | null
          provider: string
          refund_reason: string | null
          refunded_at: string | null
          reservation_id: string
          status: string
          updated_at: string
        }
        Insert: {
          amount_brl: number
          asaas_due_date?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_copy_paste?: string | null
          asaas_pix_qr_code?: string | null
          created_at?: string
          id?: string
          manual_paid_by?: string | null
          manual_payment_method?: string | null
          manual_payment_note?: string | null
          manual_receipt_path?: string | null
          metadata?: Json | null
          method: string
          paid_at?: string | null
          provider?: string
          refund_reason?: string | null
          refunded_at?: string | null
          reservation_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount_brl?: number
          asaas_due_date?: string | null
          asaas_invoice_url?: string | null
          asaas_payment_id?: string | null
          asaas_pix_copy_paste?: string | null
          asaas_pix_qr_code?: string | null
          created_at?: string
          id?: string
          manual_paid_by?: string | null
          manual_payment_method?: string | null
          manual_payment_note?: string | null
          manual_receipt_path?: string | null
          metadata?: Json | null
          method?: string
          paid_at?: string | null
          provider?: string
          refund_reason?: string | null
          refunded_at?: string | null
          reservation_id?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_manual_paid_by_fkey"
            columns: ["manual_paid_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      promotion_usages: {
        Row: {
          created_at: string
          discount_applied_brl: number
          guest_id: string
          id: string
          promotion_id: string
          reservation_id: string
        }
        Insert: {
          created_at?: string
          discount_applied_brl: number
          guest_id: string
          id?: string
          promotion_id: string
          reservation_id: string
        }
        Update: {
          created_at?: string
          discount_applied_brl?: number
          guest_id?: string
          id?: string
          promotion_id?: string
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "promotion_usages_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_usages_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "promotion_usages_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      promotions: {
        Row: {
          applies_to: string
          applies_to_ids: string[] | null
          code: string
          created_at: string
          description: string | null
          discount_type: string
          discount_value: number
          id: string
          is_active: boolean
          is_public: boolean
          max_uses: number | null
          min_amount_brl: number | null
          min_nights: number
          name: string
          updated_at: string
          uses_count: number
          valid_from: string
          valid_until: string
        }
        Insert: {
          applies_to?: string
          applies_to_ids?: string[] | null
          code: string
          created_at?: string
          description?: string | null
          discount_type: string
          discount_value: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          max_uses?: number | null
          min_amount_brl?: number | null
          min_nights?: number
          name: string
          updated_at?: string
          uses_count?: number
          valid_from: string
          valid_until: string
        }
        Update: {
          applies_to?: string
          applies_to_ids?: string[] | null
          code?: string
          created_at?: string
          description?: string | null
          discount_type?: string
          discount_value?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          max_uses?: number | null
          min_amount_brl?: number | null
          min_nights?: number
          name?: string
          updated_at?: string
          uses_count?: number
          valid_from?: string
          valid_until?: string
        }
        Relationships: []
      }
      reservation_events: {
        Row: {
          created_at: string
          created_by: string
          description: string
          event_type: string
          id: string
          metadata: Json | null
          reservation_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string
          description: string
          event_type: string
          id?: string
          metadata?: Json | null
          reservation_id: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string
          event_type?: string
          id?: string
          metadata?: Json | null
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_events_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservation_notes: {
        Row: {
          admin_user_id: string | null
          created_at: string
          id: string
          note: string
          reservation_id: string
        }
        Insert: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          note: string
          reservation_id: string
        }
        Update: {
          admin_user_id?: string | null
          created_at?: string
          id?: string
          note?: string
          reservation_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservation_notes_admin_user_id_fkey"
            columns: ["admin_user_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservation_notes_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
        ]
      }
      reservations: {
        Row: {
          adults: number
          base_amount_brl: number
          cancellation_reason: string | null
          cancelled_at: string | null
          check_in: string
          check_out: string
          checked_in_at: string | null
          checked_out_at: string | null
          children: number
          created_at: string
          discount_brl: number
          external_id: string | null
          external_source: string | null
          guest_id: string
          id: string
          promotion_code: string | null
          promotion_id: string | null
          room_id: string
          source: string
          special_requests: string | null
          status: string
          token: string
          total_brl: number
          updated_at: string
        }
        Insert: {
          adults?: number
          base_amount_brl: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in: string
          check_out: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          children?: number
          created_at?: string
          discount_brl?: number
          external_id?: string | null
          external_source?: string | null
          guest_id: string
          id?: string
          promotion_code?: string | null
          promotion_id?: string | null
          room_id: string
          source?: string
          special_requests?: string | null
          status?: string
          token: string
          total_brl: number
          updated_at?: string
        }
        Update: {
          adults?: number
          base_amount_brl?: number
          cancellation_reason?: string | null
          cancelled_at?: string | null
          check_in?: string
          check_out?: string
          checked_in_at?: string | null
          checked_out_at?: string | null
          children?: number
          created_at?: string
          discount_brl?: number
          external_id?: string | null
          external_source?: string | null
          guest_id?: string
          id?: string
          promotion_code?: string | null
          promotion_id?: string | null
          room_id?: string
          source?: string
          special_requests?: string | null
          status?: string
          token?: string
          total_brl?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reservations_guest_id_fkey"
            columns: ["guest_id"]
            isOneToOne: false
            referencedRelation: "guests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reservations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      maintenance_tickets: {
        Row: {
          assigned_to: string | null
          blocked_end_date: string | null
          blocked_start_date: string | null
          blocks_room: boolean
          created_at: string
          description: string | null
          id: string
          photo_paths: string[]
          priority: string
          reported_by: string | null
          resolved_at: string | null
          room_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          blocked_end_date?: string | null
          blocked_start_date?: string | null
          blocks_room?: boolean
          created_at?: string
          description?: string | null
          id?: string
          photo_paths?: string[]
          priority?: string
          reported_by?: string | null
          resolved_at?: string | null
          room_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          blocked_end_date?: string | null
          blocked_start_date?: string | null
          blocks_room?: boolean
          created_at?: string
          description?: string | null
          id?: string
          photo_paths?: string[]
          priority?: string
          reported_by?: string | null
          resolved_at?: string | null
          room_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "maintenance_tickets_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_reported_by_fkey"
            columns: ["reported_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "maintenance_tickets_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_availability: {
        Row: {
          blocked_reason: string
          created_at: string
          date: string
          id: string
          is_available: boolean
          maintenance_ticket_id: string | null
          reservation_id: string | null
          room_id: string
          updated_at: string
        }
        Insert: {
          blocked_reason?: string
          created_at?: string
          date: string
          id?: string
          is_available?: boolean
          maintenance_ticket_id?: string | null
          reservation_id?: string | null
          room_id: string
          updated_at?: string
        }
        Update: {
          blocked_reason?: string
          created_at?: string
          date?: string
          id?: string
          is_available?: boolean
          maintenance_ticket_id?: string | null
          reservation_id?: string | null
          room_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_availability_maintenance_ticket_id_fkey"
            columns: ["maintenance_ticket_id"]
            isOneToOne: false
            referencedRelation: "maintenance_tickets"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_availability_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_availability_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          short_description: string | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          short_description?: string | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          short_description?: string | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      room_images: {
        Row: {
          alt_text: string | null
          created_at: string
          id: string
          is_cover: boolean
          room_id: string
          sort_order: number
          storage_path: string
          url: string
        }
        Insert: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          room_id: string
          sort_order?: number
          storage_path: string
          url: string
        }
        Update: {
          alt_text?: string | null
          created_at?: string
          id?: string
          is_cover?: boolean
          room_id?: string
          sort_order?: number
          storage_path?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_images_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_rates: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          min_nights: number
          name: string
          price_per_night: number
          room_id: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          min_nights?: number
          name: string
          price_per_night: number
          room_id: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          min_nights?: number
          name?: string
          price_per_night?: number
          room_id?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_rates_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      rooms: {
        Row: {
          amenities: string[]
          base_price_brl: number
          beds: Json | null
          category_id: string
          created_at: string
          description: string | null
          featured: boolean
          floor: number | null
          housekeeping_status: string
          id: string
          is_active: boolean
          max_guests: number
          name: string
          ocean_view: boolean
          property_id: string | null
          short_description: string | null
          size_sqm: number | null
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          amenities?: string[]
          base_price_brl: number
          beds?: Json | null
          category_id: string
          created_at?: string
          description?: string | null
          featured?: boolean
          floor?: number | null
          housekeeping_status?: string
          id?: string
          is_active?: boolean
          max_guests?: number
          name: string
          ocean_view?: boolean
          property_id?: string | null
          short_description?: string | null
          size_sqm?: number | null
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          amenities?: string[]
          base_price_brl?: number
          beds?: Json | null
          category_id?: string
          created_at?: string
          description?: string | null
          featured?: boolean
          floor?: number | null
          housekeeping_status?: string
          id?: string
          is_active?: boolean
          max_guests?: number
          name?: string
          ocean_view?: boolean
          property_id?: string | null
          short_description?: string | null
          size_sqm?: number | null
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rooms_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "room_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      handoff_requests: {
        Row: {
          assigned_to: string | null
          completed_at: string | null
          completed_by: string | null
          created_at: string
          description: string | null
          id: string
          priority: string
          requested_by: string | null
          reservation_id: string | null
          room_id: string | null
          status: string
          target_department: string
          title: string
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          requested_by?: string | null
          reservation_id?: string | null
          room_id?: string | null
          status?: string
          target_department: string
          title: string
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          description?: string | null
          id?: string
          priority?: string
          requested_by?: string | null
          reservation_id?: string | null
          room_id?: string | null
          status?: string
          target_department?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "handoff_requests_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_requests_completed_by_fkey"
            columns: ["completed_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_requests_reservation_id_fkey"
            columns: ["reservation_id"]
            isOneToOne: false
            referencedRelation: "reservations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "handoff_requests_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          group_name: string
          is_public: boolean
          key: string
          label: string
          updated_at: string
          updated_by: string | null
          value: Json
        }
        Insert: {
          group_name?: string
          is_public?: boolean
          key: string
          label: string
          updated_at?: string
          updated_by?: string | null
          value: Json
        }
        Update: {
          group_name?: string
          is_public?: boolean
          key?: string
          label?: string
          updated_at?: string
          updated_by?: string | null
          value?: Json
        }
        Relationships: [
          {
            foreignKeyName: "settings_updated_by_fkey"
            columns: ["updated_by"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_admin_user: { Args: never; Returns: boolean }
      is_super_admin: { Args: never; Returns: boolean }
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
