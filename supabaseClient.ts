
import { createClient } from '@supabase/supabase-js';

// Safely access environment variables with optional chaining
// This prevents "Cannot read properties of undefined" errors in environments where import.meta.env is not defined
const supabaseUrl = (import.meta as any).env?.VITE_SUPABASE_URL || 'https://dspjvkaagzlmisgmrfsn.supabase.co';
const supabaseKey = (import.meta as any).env?.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcGp2a2FhZ3psbWlzZ21yZnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjI4ODcsImV4cCI6MjA4MDI5ODg4N30.PvjH_Gxyij3ynK0xU7WONxTROZsXzleADfu0EqCCBY0';

export const supabase = createClient(supabaseUrl, supabaseKey);
