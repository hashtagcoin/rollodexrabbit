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
      group_events: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          location: string | null
          start_date: string
          end_date: string | null
          max_participants: number | null
          creator_id: string
          category: string
          image_url: string | null
          is_public: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          title: string
          description: string
          location?: string | null
          start_date: string
          end_date?: string | null
          max_participants?: number | null
          creator_id: string
          category: string
          image_url?: string | null
          is_public?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          title?: string
          description?: string
          location?: string | null
          start_date?: string
          end_date?: string | null
          max_participants?: number | null
          creator_id?: string
          category?: string
          image_url?: string | null
          is_public?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "group_events_creator_id_fkey"
            columns: ["creator_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      group_event_participants: {
        Row: {
          id: string
          event_id: string
          user_id: string
          created_at: string
          status: string
        }
        Insert: {
          id?: string
          event_id: string
          user_id: string
          created_at?: string
          status?: string
        }
        Update: {
          id?: string
          event_id?: string
          user_id?: string
          created_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_event_participants_event_id_fkey"
            columns: ["event_id"]
            referencedRelation: "group_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_event_participants_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      user_profiles: {
        Row: {
          id: string
          username: string | null
          full_name: string | null
          avatar_url: string | null
          bio: string | null
          role: string
        }
        Insert: {
          id: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string
        }
        Update: {
          id?: string
          username?: string | null
          full_name?: string | null
          avatar_url?: string | null
          bio?: string | null
          role?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add other tables from your database here
    }
    Views: {
      group_events_with_details: {
        Row: {
          id: string
          created_at: string
          title: string
          description: string
          location: string | null
          start_date: string
          end_date: string | null
          max_participants: number | null
          creator_id: string
          category: string
          image_url: string | null
          is_public: boolean
          creator_name: string | null
          creator_avatar: string | null
          participant_count: number
        }
        Relationships: [
          {
            foreignKeyName: "group_events_creator_id_fkey"
            columns: ["creator_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      // Add other views from your database here
    }
    Functions: {}
    Enums: {
      event_category: "Interest" | "Social" | "Support" | "Housing"
      relationship_status: "pending" | "accepted" | "rejected" | "blocked"
    }
    CompositeTypes: {}
  }
}

export type Tables<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName]
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions]
    : never

export type TableRow<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TableInsert<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TableUpdate<
  PublicTableNameOrOptions extends
    | keyof Database["public"]["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof Database["public"]["Tables"]
    ? Database["public"]["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof Database["public"]["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof Database["public"]["Enums"]
    ? Database["public"]["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof Database["public"]["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof Database["public"]["CompositeTypes"]
    ? Database["public"]["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      event_category: ["Interest", "Social", "Support", "Housing"],
      relationship_status: ["pending", "accepted", "rejected", "blocked"],
    },
  },
} as const