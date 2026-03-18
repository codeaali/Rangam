import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';

export const supabase = createClient(supabaseUrl, supabaseKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          email: string;
          phone: string;
          created_at?: string;
        };
      };
      movies: {
        Row: {
          id: string;
          name: string;
        };
        Insert: {
          id?: string;
          name: string;
        };
      };
      shows: {
        Row: {
          id: string;
          movie_id: string;
          show_time: string;
          seat_limit: number;
        };
        Insert: {
          id?: string;
          movie_id: string;
          show_time: string;
          seat_limit: number;
        };
      };
      bookings: {
        Row: {
          id: string;
          booking_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          user_id: string;
          created_at?: string;
        };
      };
      booking_items: {
        Row: {
          id: string;
          booking_id: string;
          show_id: string;
          seats: number;
        };
        Insert: {
          id?: string;
          booking_id: string;
          show_id: string;
          seats: number;
        };
      };
    };
  };
};
