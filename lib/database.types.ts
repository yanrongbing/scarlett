export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      sessions: {
        Row: {
          created_at: string | null
          date: string
          id: string
          location: string | null
          notes: string | null
          status: string | null
          student_id: string
          time: string
        }
        Insert: {
          created_at?: string | null
          date: string
          id?: string
          location?: string | null
          notes?: string | null
          status?: string | null
          student_id: string
          time: string
        }
        Update: {
          created_at?: string | null
          date?: string
          id?: string
          location?: string | null
          notes?: string | null
          status?: string | null
          student_id?: string
          time?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          contract_pdf: string | null
          created_at: string | null
          ended_at: string | null
          id: string
          name: string
          paused_at: string | null
          phone: string | null
          ratings: Json | null
          refund_amount: number | null
          refund_at: string | null
          renewal_history: Json | null
          session_income: number
          session_price: number
          source: string | null
          status: string | null
          total_fee: number
          total_sessions: number
          training_background: string | null
          training_plan_pdf: string | null
          updated_at: string | null
          venue_fee: number
          wechat: string | null
        }
        Insert: {
          contract_pdf?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          name: string
          paused_at?: string | null
          phone?: string | null
          ratings?: Json | null
          refund_amount?: number | null
          refund_at?: string | null
          renewal_history?: Json | null
          session_income?: number
          session_price?: number
          source?: string | null
          status?: string | null
          total_fee?: number
          total_sessions?: number
          training_background?: string | null
          training_plan_pdf?: string | null
          updated_at?: string | null
          venue_fee?: number
          wechat?: string | null
        }
        Update: {
          contract_pdf?: string | null
          created_at?: string | null
          ended_at?: string | null
          id?: string
          name?: string
          paused_at?: string | null
          phone?: string | null
          ratings?: Json | null
          refund_amount?: number | null
          refund_at?: string | null
          renewal_history?: Json | null
          session_income?: number
          session_price?: number
          source?: string | null
          status?: string | null
          total_fee?: number
          total_sessions?: number
          training_background?: string | null
          training_plan_pdf?: string | null
          updated_at?: string | null
          venue_fee?: number
          wechat?: string | null
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
