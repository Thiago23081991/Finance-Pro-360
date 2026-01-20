
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
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // 1. Find debts due in exactly 1 day or overdue today
        // For simplicity, let's just look for debts with due_date in next 3 days
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3);

        const todayStr = today.toISOString().split('T')[0];
        const targetStr = threeDaysLater.toISOString().split('T')[0];

        const { data: debts, error: debtError } = await supabase
            .from('debts')
            .select('id, name, total_amount, due_date, user_id')
            .gte('due_date', todayStr)
            .lte('due_date', targetStr);

        if (debtError) throw debtError;

        if (!debts || debts.length === 0) {
            return new Response(JSON.stringify({ message: 'No debts due soon.' }), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
                status: 200,
            });
        }

        // 2. Group by user to avoid spamming multiple notifications
        const userDebts: Record<string, any[]> = {};
        debts.forEach(d => {
            if (!userDebts[d.user_id]) userDebts[d.user_id] = [];
            userDebts[d.user_id].push(d);
        });

        const results = [];

        // 3. Send notifications
        for (const userId of Object.keys(userDebts)) {
            // Get subscriptions for this user
            const { data: subs } = await supabase
                .from('push_subscriptions')
                .select('subscription')
                .eq('user_id', userId);

            if (!subs || subs.length === 0) continue;

            const myDebts = userDebts[userId];
            const title = "Contas Vencendo!";
            const body = `Você tem ${myDebts.length} conta(s) para pagar em breve. Total: R$ ${myDebts.reduce((acc: number, cur: any) => acc + cur.total_amount, 0).toFixed(2)}`;
            const payload = JSON.stringify({
                title,
                body,
                url: 'https://finance-pro-360.vercel.app/'
            });

            const sendPromises = subs.map(sub =>
                webpush.sendNotification(sub.subscription, payload)
                    .catch((e: any) => {
                        if (e.statusCode === 410) {
                            // Cleanup expired subscription
                            // supabase.from('push_subscriptions').delete().match({ subscription: sub.subscription });
                        }
                        return { error: e };
                    })
            );

            results.push(await Promise.all(sendPromises));
        }

        return new Response(JSON.stringify({ sent_count: results.length }), {
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
