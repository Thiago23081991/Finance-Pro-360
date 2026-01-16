
import { createClient } from '@supabase/supabase-js';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcGp2a2FhZ3psbWlzZ21yZnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcyMjg4NywiZXhwIjoyMDgwMjk4ODg3fQ.wXhvC-rDL6HVXIUFSiIvRFoXi6vV3y8WtW7tdWme2g0';
const SUPABASE_URL = 'https://dspjvkaagzlmisgmrfsn.supabase.co';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function run() {
    const { data } = await adminClient.auth.admin.listUsers();
    // Find ANY user with 'mauricio' in email
    const user = data.users.find(u => u.email && u.email.toLowerCase().includes('mauricio'));

    if (user) {
        console.log(`FOUND_EMAIL: ${user.email}`);
        console.log(`FOUND_ID: ${user.id}`);
    } else {
        console.log("NOT_FOUND_ANYTHING");
    }
}

run();
