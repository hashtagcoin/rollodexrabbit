export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      achievement_types: {
        Row: {
          created_at: string | null
          description: string | null
          name: string
          type: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          name: string
          type: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          name?: string
          type?: string
        }
        Relationships: []
      }
      badge_definitions: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon_url: string | null
          id: string
          is_active: boolean
          name: string
          points: number
          requirements: Json
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name: string
          points?: number
          requirements?: Json
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon_url?: string | null
          id?: string
          is_active?: boolean
          name?: string
          points?: number
          requirements?: Json
        }
        Relationships: []
      },
      shared_items: {
        Row: {
          shared_item_id: string
          sender_id: string
          recipient_id: string
          item_type: 'group_event' | 'service_provider' | 'housing_listing' | 'housing_group'
          item_id: string
          created_at: string
          is_favourited: boolean
          dismissed: boolean
        }
        Insert: {
          shared_item_id?: string
          sender_id: string
          recipient_id: string
          item_type: 'group_event' | 'service_provider' | 'housing_listing' | 'housing_group'
          item_id: string
          created_at?: string
          is_favourited?: boolean
          dismissed?: boolean
        }
        Update: {
          shared_item_id?: string
          sender_id?: string
          recipient_id?: string
          item_type?: 'group_event' | 'service_provider' | 'housing_listing' | 'housing_group'
          item_id?: string
          created_at?: string
          is_favourited?: boolean
          dismissed?: boolean
        }
        Relationships: [
          {
            foreignKeyName: 'shared_items_sender_id_fkey'
            columns: ['sender_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'shared_items_recipient_id_fkey'
            columns: ['recipient_id']
            referencedRelation: 'users'
            referencedColumns: ['id']
          }
        ]
      }
      badges: {
        Row: {
          category: string
          created_at: string | null
          description: string
          icon_url: string | null
          id: string
          name: string
          points: number | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description: string
          icon_url?: string | null
          id?: string
          name: string
          points?: number | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string
          icon_url?: string | null
          id?: string
          name?: string
          points?: number | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          created_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          created_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          created_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          points: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          points: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          points?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
  }
}

// Utility types for Supabase Database

// Table utilities
export type TableNames = keyof Database['public']['Tables'];
export type TableRow<T extends TableNames> = Database['public']['Tables'][T]['Row'];
export type TableInsert<T extends TableNames> = Database['public']['Tables'][T]['Insert'];
export type TableUpdate<T extends TableNames> = Database['public']['Tables'][T]['Update'];