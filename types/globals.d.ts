// Global type for Supabase JSON columns and PostGIS helpers
// This type is required for Supabase-generated types to compile
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];
