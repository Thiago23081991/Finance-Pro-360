
import { createClient } from '@supabase/supabase-js';

// Safely access environment variables.
// Use a function with try-catch to handle potential access errors in different environments.
const getEnvVar = (key: string, defaultValue: string): string => {
  try {
    const env = (import.meta as any).env;
    if (env && env[key]) {
      return env[key];
    }
  } catch (e) {
    // Ignore errors accessing import.meta
  }
  return defaultValue;
};

const supabaseUrl = getEnvVar('VITE_SUPABASE_URL', 'https://dspjvkaagzlmisgmrfsn.supabase.co');
const supabaseKey = getEnvVar('VITE_SUPABASE_ANON_KEY', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcGp2a2FhZ3psbWlzZ21yZnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjI4ODcsImV4cCI6MjA4MDI5ODg4N30.PvjH_Gxyij3ynK0xU7WONxTROZsXzleADfu0EqCCBY0');

export const supabase = createClient(supabaseUrl, supabaseKey);
