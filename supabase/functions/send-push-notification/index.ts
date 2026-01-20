
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";
import webpush from "https://esm.sh/web-push@3.6.7";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const vapidKeys = {
    publicKey: Deno.env.get('VAPID_PUBLIC_KEY') || 'BCpZYgyHbEfonCDY5NdvLfbG1vlNnGbRvPbiJRW4nniP89YIiAKI3LozraSqQRe9LP65j1H0x0N_ArBAdeonIyQ',
    privateKey: Deno.env.get('VAPID_PRIVATE_KEY') || ''
};

webpush.setVapidDetails(
    'mailto:admin@finance360.com',
    vapidKeys.publicKey,
    vapidKeys.privateKey
);

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        const { userId, title, body, url } = await req.json();

        if (!title || !body) {
            throw new Error("Title and Body are required.");
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        let query = supabase.from('push_subscriptions').select('subscription');

        // If not 'all', filter by userId
        if (userId !== 'all') {
            query = query.eq('user_id', userId);
        }

        const { data: subs, error } = await query;

        if (error) throw error;
        if (!subs || subs.length === 0) {
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

        const sendPromises = subs.map(sub =>
            webpush.sendNotification(sub.subscription, payload)
                .catch((e: any) => {
                    if (e.statusCode === 410) {
                        // Subscription expired
                    }
                    return { error: e };
                })
        );

        const results = await Promise.all(sendPromises);

        return new Response(JSON.stringify({ sent_count: results.length, success: true }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: any) {
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
