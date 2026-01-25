import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0?target=deno";
import webpush from "https://esm.sh/web-push@3.6.7?target=deno";

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Initialized inside handler to avoid boot crash

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders });
    }

    try {
        console.log("Edge Function 'send-due-alerts' invoked");

        // 1. Environment Setup
        const vapidKeys = {
            publicKey: Deno.env.get('VAPID_PUBLIC_KEY'),
            privateKey: Deno.env.get('VAPID_PRIVATE_KEY')
        };

        if (!vapidKeys.publicKey || !vapidKeys.privateKey) {
            console.error("Missing VAPID Keys");
            throw new Error("Server Misconfiguration: VAPID Keys missing");
        }

        try {
            webpush.setVapidDetails(
                'mailto:admin@finance360.com',
                vapidKeys.publicKey,
                vapidKeys.privateKey
            );
        } catch (err: any) {
            console.error("VAPID Setup Error:", err);
            throw new Error("Invalid VAPID Keys configuration");
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL');
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

        if (!supabaseUrl || !supabaseKey) {
            console.error("Missing Supabase Config");
            throw new Error("Server Misconfiguration: Missing SUPABASE_URL or SERVICE_ROLE_KEY");
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // 2. Find debts due in exactly 1 day or overdue today (next 3 days window)
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);

        const todayStr = today.toISOString().split('T')[0];
        const targetStr = threeDaysLater.toISOString().split('T')[0];

        console.log(`Checking debts between ${todayStr} and ${targetStr}`);

        const { data: debts, error: debtError } = await supabase
            .from('debts')
            .select('id, name, total_amount, due_date, user_id')
            .gte('due_date', todayStr)
            .lte('due_date', targetStr);

        if (debtError) {
            console.error("Database Error:", debtError);
            throw debtError;
        }

        if (!debts || debts.length === 0) {
            console.log("No debts found in window.");
            return new Response(JSON.stringify({ message: 'No debts due soon.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        console.log(`Found ${debts.length} debts due.`);

        // 3. Group by user to avoid spamming multiple notifications
        const userDebts: Record<string, any[]> = {};
        debts.forEach(d => {
            if (!userDebts[d.user_id]) userDebts[d.user_id] = [];
            userDebts[d.user_id].push(d);
        });

        const results = [];
        let successCount = 0;

        // 4. Send notifications
        for (const userId of Object.keys(userDebts)) {
            // Get subscriptions for this user
            const { data: subs } = await supabase
                .from('push_subscriptions')
                .select('subscription')
                .eq('user_id', userId);

            if (!subs || subs.length === 0) {
                console.log(`User ${userId} has no push subscriptions.`);
                continue;
            }

            const myDebts = userDebts[userId];
            const title = "⚠️ Contas Vencendo!";
            const body = `Você tem ${myDebts.length} conta(s) vencendo em breve (Total: R$ ${myDebts.reduce((acc: number, cur: any) => acc + cur.total_amount, 0).toFixed(2)}).`;
            const payload = JSON.stringify({
                title,
                body,
                url: 'https://finance-pro-360.vercel.app/'
            });

            console.log(`Sending alert to User ${userId} (${subs.length} devices)`);

            const sendPromises = subs.map(sub =>
                webpush.sendNotification(sub.subscription, payload)
                    .catch((e: any) => {
                        console.error(`Failed to send to device:`, e);
                        if (e.statusCode === 410) {
                            // Cleanup expired subscription
                            supabase.from('push_subscriptions').delete().match({ subscription: sub.subscription }).then(() => console.log("Removed expired subscription"));
                        }
                        return { error: e };
                    })
            );

            const userResults = await Promise.all(sendPromises);
            const userSuccess = userResults.filter((r: any) => !r.error).length;
            successCount += userSuccess;
            results.push({ userId, attempts: subs.length, success: userSuccess });
        }

        console.log("Job Complete. Summary:", results);

        return new Response(JSON.stringify({ sent_count: successCount, details: results }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
        });
    } catch (error: any) {
        console.error("Critical Job Error:", error);
        return new Response(JSON.stringify({ error: error.message }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 500,
        });
    }
});
