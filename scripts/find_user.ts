
import { createClient } from '@supabase/supabase-js';
import { supabase } from '../supabaseClient'; // Import url/anon key from project
import * as fs from 'fs';
import * as path from 'path';

// Load service role key manually since we are running a standalone script
// In a real app we would use dotenv, but here we'll just grab it or hardcode for the one-off task logic
// Actually, to rely on the file content I just read:
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcGp2a2FhZ3psbWlzZ21yZnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcyMjg4NywiZXhwIjoyMDgwMjk4ODg3fQ.wXhvC-rDL6HVXIUFSiIvRFoXi6vV3y8WtW7tdWme2g0';
const SUPABASE_URL = 'https://dspjvkaagzlmisgmrfsn.supabase.co'; // Extracted from decoded JWT ref or known config

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function findUser() {
    const email = 'mauricionascimento58@gmail.com';
    console.log(`Searching for user: ${email}...`);

    // Supabase Admin API - listUsers is the way to search in Auth
    // Note: listUsers doesn't filter by email in all versions, but creates a list we can filter
    const { data, error } = await adminClient.auth.admin.listUsers();

    if (error) {
        console.error("Error fetching users:", error);
        return;
    }

    const user = data.users.find(u => u.email === email);

    if (user) {
        console.log("\n--- USER FOUND ---");
        console.log(`Email: ${user.email}`);
        console.log(`UUID: ${user.id}`);
        console.log("------------------\n");
    } else {
        console.log("User not found in Auth database.");
    }
}

findUser();
