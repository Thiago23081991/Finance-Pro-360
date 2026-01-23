import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0?target=deno";
import webpush from "https://esm.sh/web-push@3.6.7?target=deno";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialized inside handler to avoid boot crash


serve(async (req) => {
    // 1. Handle CORS Preflight
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log("Edge Function 'send-push-notification' invoked");

        // 2. Parse Body
        const { userId, title, body, url } = await req.json();
        console.log("Request Payload:", { userId, title, body });

        if (!title || !body) {
            throw new Error("Title and Body are required.");
        }

        // 3. Environment Setup
        const vapidKeys = {
            publicKey: Deno.env.get('VAPID_PUBLIC_KEY') || 'BCpZYgyHbEfonCDY5NdvLfbG1vlNnGbRvPbiJRW4nniP89YIiAKI3LozraSqQRe9LP65j1H0x0N_ArBAdeonIyQ',
            privateKey: Deno.env.get('VAPID_PRIVATE_KEY') || ''
        };

        if (!vapidKeys.privateKey) {
            console.error("Missing VAPID_PRIVATE_KEY");
            throw new Error("Server Misconfiguration: VAPID_PRIVATE_KEY is missing");
        }

        // 4. Init WebPush (Lazy Init to prevent boot crash)
        try {
            webpush.setVapidDetails(
                'mailto:admin@finance360.com',
                vapidKeys.publicKey,
                vapidKeys.privateKey
            );
        } catch (err: any) {
            console.error("VAPID Setup Error:", err);
            throw new Error("Invalid VAPID Keys configuration.");
        }

        // 5. Init Supabase Admin
        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            console.error("Missing Supabase Env Vars", { url: !!supabaseUrl, key: !!supabaseKey });
            throw new Error("Server Misconfiguration: Missing SUPABASE_URL or SERVICE_ROLE_KEY");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        let query = supabase.from('push_subscriptions').select('subscription');

        // If not 'all', filter by userId
        if (userId !== 'all') {
            query = query.eq('user_id', userId);
        }

        const { data: subs, error } = await query;

        if (error) {
            console.error("Database Error:", error);
            throw error;
        }

        if (!subs || subs.length === 0) {
            console.log("No subscriptions found for target:", userId);
            return new Response(JSON.stringify({ message: 'No subscriptions found.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        const payload = JSON.stringify({
            title,
            body,
            url: url || 'https://finance-pro-360.vercel.app/'
        });

        console.log(`Sending to ${subs.length} subscriptions...`);

        const sendPromises = subs.map(sub =>
            webpush.sendNotification(sub.subscription, payload)
                .catch((e: any) => {
                    console.error("Push Send Error:", e);
                    if (e.statusCode === 410) {
                        // Subscription expired - TODO: remove from DB
                    }
                    return { error: e };
                })
        );

        const results = await Promise.all(sendPromises);
        console.log("Send Results:", results);

        return new Response(JSON.stringify({ sent_count: results.length, success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });

    } catch (error: any) {
        console.error("Critical Function Error:", error);
        return new Response(JSON.stringify({ error: error.message, details: error.toString() }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500, // Make sure to return 500 so client knows it failed
        });
    }
});
