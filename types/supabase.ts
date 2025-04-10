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
      user_profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          role: string
          ndis_number: string | null
          ndis_verified: boolean
          comfort_traits: string[] | null
          preferred_categories: string[] | null
          preferred_service_formats: string[] | null
          accessibility_needs: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string
          ndis_number?: string | null
          ndis_verified?: boolean
          comfort_traits?: string[] | null
          preferred_categories?: string[] | null
          preferred_service_formats?: string[] | null
          accessibility_needs?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string
          ndis_number?: string | null
          ndis_verified?: boolean
          comfort_traits?: string[] | null
          preferred_categories?: string[] | null
          preferred_service_formats?: string[] | null
          accessibility_needs?: string[] | null
          created_at?: string
          updated_at?: string
        }
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
  }
}