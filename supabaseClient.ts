
import { createClient } from '@supabase/supabase-js';

// Safely access environment variables.
// (import.meta as any).env prevents TypeScript errors if types aren't fully loaded,
// and the optional chaining (?.) prevents crashes if 'env' is undefined.
const env = (import.meta as any).env || {};

const supabaseUrl = env.VITE_SUPABASE_URL || 'https://dspjvkaagzlmisgmrfsn.supabase.co';
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcGp2a2FhZ3psbWlzZ21yZnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjI4ODcsImV4cCI6MjA4MDI5ODg4N30.PvjH_Gxyij3ynK0xU7WONxTROZsXzleADfu0EqCCBY0';

export const supabase = createClient(supabaseUrl, supabaseKey);
