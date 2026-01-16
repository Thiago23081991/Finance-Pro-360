
import { createClient } from '@supabase/supabase-js';

const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRzcGp2a2FhZ3psbWlzZ21yZnNuIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NDcyMjg4NywiZXhwIjoyMDgwMjk4ODg3fQ.wXhvC-rDL6HVXIUFSiIvRFoXi6vV3y8WtW7tdWme2g0';
const SUPABASE_URL = 'https://dspjvkaagzlmisgmrfsn.supabase.co';

const adminClient = createClient(SUPABASE_URL, SERVICE_KEY, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function repairUser() {
    const userId = '0a6f2111-3f77-4da0-b185-f239c4d918ae';
    const email = 'mauricionascimento58@gmail.com';

    console.log(`Attempting to repair user: ${email} (${userId})`);

    // Check if profile exists first
    const { data: existing } = await adminClient.from('profiles').select('*').eq('id', userId).maybeSingle();

    if (existing) {
        console.log("Profile already exists. Updating license...");
    } else {
        console.log("Profile missing. Creating...");
        const { error } = await adminClient.from('profiles').insert({
            id: userId,
            email: email,
            username: 'Mauricio Nascimento',
            categories: [],
            payment_methods: ['Cartão de Crédito', 'Pix', 'Dinheiro'],
            enable_reminders: true,
            has_seen_tutorial: false,
            license_status: 'active', // Already activating
            plan_type: 'annual',     // Giving Annual
            plan_cycle: 'annual'
        });

        if (error) {
            console.error("Error creating profile:", error);
            return;
        }
        console.log("Profile created successfully via Admin Override.");
    }

    // Ensure license is active either way
    const { error: updateError } = await adminClient.from('profiles').update({
        license_status: 'active',
        plan_type: 'annual',
        plan_cycle: 'annual'
    }).eq('id', userId);

    if (updateError) {
        console.error("Error activating license:", updateError);
    } else {
        console.log("License ACTIVATED successfully.");
    }
}

repairUser();
