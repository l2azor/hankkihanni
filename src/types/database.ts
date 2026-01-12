// Supabase 데이터베이스 타입 정의

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          nickname: string
          guardian_phone: string | null
          streak: number
          last_check_in: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          nickname: string
          guardian_phone?: string | null
          streak?: number
          last_check_in?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          nickname?: string
          guardian_phone?: string | null
          streak?: number
          last_check_in?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      check_ins: {
        Row: {
          id: string
          user_id: string
          response: 'ate' | 'not_ate' | null
          responded_at: string | null
          scheduled_at: string
          is_missed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          response?: 'ate' | 'not_ate' | null
          responded_at?: string | null
          scheduled_at: string
          is_missed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          response?: 'ate' | 'not_ate' | null
          responded_at?: string | null
          scheduled_at?: string
          is_missed?: boolean
          created_at?: string
        }
      }
      emergency_alerts: {
        Row: {
          id: string
          user_id: string
          guardian_phone: string
          message: string
          sent_at: string
          success: boolean
        }
        Insert: {
          id?: string
          user_id: string
          guardian_phone: string
          message: string
          sent_at?: string
          success?: boolean
        }
        Update: {
          id?: string
          user_id?: string
          guardian_phone?: string
          message?: string
          sent_at?: string
          success?: boolean
        }
      }
    }
  }
}

// 편의를 위한 타입 alias
export type User = Database['public']['Tables']['users']['Row']
export type CheckIn = Database['public']['Tables']['check_ins']['Row']
export type CheckInResponse = 'ate' | 'not_ate'
