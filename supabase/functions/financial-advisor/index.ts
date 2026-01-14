
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { google } from "npm:@google/genai"

const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';

// Initialize Gemini
const gl = new google.GenAI({ apiKey: geminiApiKey });

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const { message, context } = await req.json();

        if (!message) {
            return new Response('Missing message', { status: 400, headers: corsHeaders });
        }

        const model = "gemini-1.5-flash";

        // Construct the prompt with financial context
        const financialContext = context ? `
    User Financial Context:
    - Balance: ${context.balance || 'Unknown'}
    - Total Income (Month): ${context.income || 0}
    - Total Expenses (Month): ${context.expenses || 0}
    - Top Expense Categories: ${context.topCategories || 'None'}
    - Financial Goal: ${context.goal || 'None'}
    
    Current Date: ${new Date().toLocaleDateString('pt-BR')}
    ` : 'No specific financial context provided.';

        const systemInstruction = `
    You are "Finance AI", an expert financial advisor for the Finance Pro 360 app.
    Your goal is to help the user manage their money better, save for goals, and reduce debt.
    
    Rules:
    1. Be concise, encouraging, and practical.
    2. Use the provided "User Financial Context" to give specific advice.
    3. If the user asks about something unrelated to finance, politely steer them back to money topics.
    4. Speak in Portuguese (Brazil).
    5. Use markdown for formatting (bold, lists).
    6. Do not give legal or investment advice (disclaimer: "Lembre-se que não sou um consultor de investimentos credenciado CVM, apenas uma IA de apoio.").
    `;

        const fullPrompt = `
    ${systemInstruction}

    ${financialContext}

    User Question: "${message}"
    `;

        // Generate content
        const result = await gl.models.generateContent({
            model: model,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: fullPrompt }]
                }
            ],
        });

        const responseText = result.response.candidates[0].content.parts[0].text;

        return new Response(JSON.stringify({ reply: responseText }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });

    } catch (error: any) {
        console.error(error);
        return new Response(JSON.stringify({ error: error.message }), {
            status: 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
