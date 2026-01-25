
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

async function tryGenerate(model: string, prompt: string) {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }]
        })
    });
    return response;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

    try {
        const { message, context } = await req.json();

        if (!message) return new Response(JSON.stringify({ error: 'Missing message' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        if (!geminiApiKey) return new Response(JSON.stringify({ error: 'Server Config Error: API Key missing' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

        const financialContext = context ? `
        FINANCIAL DATA:
        - Balance (Income - Expense): R$ ${context.balance || '0.00'}
        - Monthly Income: R$ ${context.income || '0.00'}
        - Monthly Expenses: R$ ${context.expenses || '0.00'}
        - Recurring Fixed Costs: R$ ${context.totalRecurring || '0.00'} (Items: ${context.recurringExpenses})
        - Top Spending Categories: ${context.topCategories || 'None'}
        - Active Goals: ${context.goal || 'None'}
        - Debts (Next 7 days): ${context.debts || 'None'}
        - Investments: ${context.investments || 'None'}
        ` : 'No context provided.';

        const fullPrompt = `
        You are "Finance AI", a highly analytical and motivating financial coach.
        Persona: Direct, practical, uses emojis, Brazil Portuguese.
        
        MISSION:
        Analyze the USER's data to answer their question.
        
        RULES:
        1. If Expenses > Income, ALERT the user about the deficit immediately.
        2. If "Recurring Fixed Costs" are high, suggest reviewing subscriptions.
        3. If "Debts" are present, prioritize paying them off before investing.
        4. Be specific: cite the actual values from the data.
        
        ${financialContext}
        
        USER QUESTION: "${message}"
        `;

        // 1. Try Primary Model (Standard Flash)
        let response = await tryGenerate('gemini-flash-latest', fullPrompt);

        // 2. Fallback to Pro Latest if 404 or 429
        if (!response.ok && (response.status === 404 || response.status === 429)) {
            console.log(`Primary failed (${response.status}), trying Gemini Pro Latest...`);
            response = await tryGenerate('gemini-pro-latest', fullPrompt);
        }

        // 3. If still failing, list models for debugging
        if (!response.ok) {
            const errorText = await response.text();
            console.error("AI Generation Failed:", errorText);

            if (response.status === 404) {
                // Fetch available models to show user
                const listResp = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${geminiApiKey}`);
                const listData = await listResp.json();
                const availableModels = listData.models ? listData.models.map((m: any) => m.name).join(', ') : 'No models found';

                throw new Error(`Erro 404. Modelos disponíveis na sua chave: ${availableModels}`);
            }

            throw new Error(`AI Error (${response.status}): ${errorText}`);
        }

        const data = await response.json();
        const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "Erro processando resposta.";

        return new Response(JSON.stringify({ reply: replyText }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Function Error:", error);
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
