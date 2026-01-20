
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { GoogleGenerativeAI } from "npm:@google/generative-ai"

const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { message, context } = await req.json();

        if (!message) {
            return new Response(JSON.stringify({ error: 'Missing message' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        if (!geminiApiKey) {
            return new Response(JSON.stringify({ error: 'Server Configuration Error: API Key missing' }), {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' }
            });
        }

        const genAI = new GoogleGenerativeAI(geminiApiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const financialContext = context ? `
        PLEASE USE THIS REAL DATA TO ANSWER:
        - Current Balance: R$ ${context.balance || '0.00'}
        - Monthly Income: R$ ${context.income || '0.00'}
        - Monthly Expenses: R$ ${context.expenses || '0.00'}
        - Top Spending Categories: ${context.topCategories || 'None'}
        - Active Goals: ${context.goal || 'None'}
        - Upcoming Debts (7 days): ${context.debts || 'None'}
        - Investments: ${context.investments || 'None'}
        - Recurring Bills: ${context.recurringExpenses || 'None'}
        - Total Recurring: R$ ${context.totalRecurring || '0.00'}
        
        Current Date: ${new Date().toLocaleDateString('pt-BR')}
        ` : 'No specific financial context provided.';

        const systemInstruction = `
        You are "Finance AI", an expert personal financial coach for Finance Pro 360.
        
        YOUR PERSONA:
        - You are concise, direct, and motivating.
        - You DON'T use long introductions like "Hello, I am...". Dive straight into the answer.
        - You use emojis occasionally to keep the tone light 💡.
        - You refer to the user's specific numbers. Don't speak in generics if you have data.
        
        YOUR MISSION:
        1. Analyze the user's question using their REAL financial data provided above.
        2. If they have debts due soon, WARN them politely but urgently.
        3. If they want to buy something, check their balance and upcoming bills first.
        4. Suggest practical ways to save based on their top spending categories.
        
        LANGUAGE: Portuguese (Brazil) 🇧🇷.
        FORMATING: Use **bold** for numbers and key takeaways.
        DISCLAIMER: If asked about specific stocks/cryptos, say you are an AI coach, not a certified broker, but provide general analysis.
        `;

        const fullPrompt = `
        ${systemInstruction}

        ${financialContext}

        USER QUESTION: "${message}"
        `;

        const result = await model.generateContent(fullPrompt);
        const response = await result.response;
        const responseText = response.text();

        return new Response(JSON.stringify({ reply: responseText }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error("Edge Function Error:", error);
        return new Response(JSON.stringify({ error: error.message || 'Unknown error' }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
