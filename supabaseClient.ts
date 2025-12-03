import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dspjvkaagzlmisgmrfsn.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcGp2a2FhZ3psbWlzZ21yZnNuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3MjI4ODcsImV4cCI6MjA4MDI5ODg4N30.PvjH_Gxyij3ynK0xU7WONxTROZsXzleADfu0EqCCBY0';

export const supabase = createClient(supabaseUrl, supabaseKey);