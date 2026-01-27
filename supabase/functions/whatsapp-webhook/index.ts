
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { google } from "npm:@google/genai"

const geminiApiKey = Deno.env.get('GEMINI_API_KEY') || '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

// Initialize Gemini
const gl = new google.GenAI({ apiKey: geminiApiKey });

// Initialize Supabase Admin
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req) => {
    try {
        // 1. Validar Request (Twilio sends application/x-www-form-urlencoded)
        if (req.method !== 'POST') {
            return new Response('Method Not Allowed', { status: 405 });
        }

        const formData = await req.formData();
        const from = formData.get('From') as string; // Format: whatsapp:+5511999999999
        const body = formData.get('Body') as string;

        if (!from || !body) {
            return new Response('Missing From or Body', { status: 400 });
        }

        console.log(`Recebido de ${from}: ${body}`);

        // 2. Verificar usuário (Phone -> UserID)
        // Precisamos de uma tabela ou coluna para vincular o telefone.
        // Vamos assumir que existe 'phone' na tabela 'profiles' ou criamos um mecanismo de binding.

        // Check if user exists with this phone
        const { data: userProfile, error: userError } = await supabase
            .from('profiles')
            .select('id, email')
            .eq('phone', from.replace('whatsapp:', '')) // Store without prefix usually, or match exact
            .single();

        // Se não encontrou pelo telefone
        if (!userProfile) {
            // Tentar ver se a mensagem é um email para fazer o vínculo
            const emailRegex = /\S+@\S+\.\S+/;
            if (emailRegex.test(body.trim())) {
                const email = body.trim();
                // Buscar usuário pelo email
                const { data: emailProfile, error: emailError } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('email', email)
                    .single();

                if (emailProfile) {
                    // Atualizar perfil com o telefone
                    await supabase
                        .from('profiles')
                        .update({ phone: from.replace('whatsapp:', '') })
                        .eq('id', emailProfile.id);

                    return replyTwilio("Conta vinculada com sucesso! Agora você pode enviar suas despesas por aqui. Ex: 'Almoço 30 reais'");
                } else {
                    return replyTwilio("E-mail não encontrado no sistema. Verifique se digitou corretamente.");
                }
            }

            return replyTwilio("Olá! Seu número não está cadastrado. Por favor, responda com seu *e-mail de cadastro* para vincularmos sua conta.");
        }

        // 3. Processar mensagem com Gemini
        const userId = userProfile.id;
        const model = "gemini-1.5-flash";

        const prompt = `
      You are a financial assistant for a Brazilian user.
      Current Date: ${new Date().toISOString()}

      Task: Extract transaction details from the user message: "${body}".

      Rules:
      1. Currency: 'real', 'reais', 'R$' -> BRL. If no currency, assume BRL.
      2. Type: 
         - 'income' (receita) if receiving money (ganhei, recebi, salário, venda).
         - 'expense' (despesa) if spending (gastei, comprei, paguei, boleto).
      3. Category: STRICTLY match one of these lists:
         - Income: Salários, Vendas Diversas, Aluguel de Carro, Aluguel de Apartamento, Aluguel de Casa, Dividendos, Rendimentos, Aposentadoria, Outros.
         - Expense: Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Investimentos, Outros.
         *Infer the best fit. If unsure, use 'Outros'.*
      
      Return JSON only (no markdown):
      {
        "amount": number (positive float),
        "description": string (short title),
        "type": "income" | "expense",
        "category": string,
        "date": string (ISO 8601 format YYYY-MM-DD, default to today if not mentioned)
      }
      If it's clearly not a transaction (e.g. "Oi", "Tudo bem?"), return { "error": "not_transaction" }.
    `;

        // Generate content
        const result = await gl.models.generateContent({
            model: model,
            contents: [
                {
                    role: 'user',
                    parts: [{ text: prompt }]
                }
            ],
            config: {
                responseMimeType: 'application/json'
            }
        });

        const responseText = result.response.candidates[0].content.parts[0].text;
        console.log("Gemini Response:", responseText);

        let data;
        try {
            data = JSON.parse(responseText);
        } catch (e) {
            console.error("JSON Parse Error", e);
            return replyTwilio("Desculpe, não entendi. Tente algo como 'Gastei 20 em Café'.");
        }

        if (data.error) {
            return replyTwilio("Não entendi isso como uma transação. Tente: 'Almoço 25 reais' ou 'Recebi 100 de pix'.");
        }

        // 4. Salvar no Supabase
        const { error: insertError } = await supabase.from('transactions').insert({
            user_id: userId, // Note: DB column usually is user_id, in types.ts it was userId map to user_id likely? Need to check DB schema. usually snake_case in supabase.
            amount: data.amount,
            description: data.description,
            type: data.type,
            category: data.category,
            date: data.date,
            payment_method: 'Outros' // Default
        });

        if (insertError) {
            console.error("Insert Error:", insertError);
            return replyTwilio("Erro ao salvar transação. Tente novamente.");
        }

        // 5. Confirmar sucesso
        const emoji = data.type === 'expense' ? '💸' : '💰';
        return replyTwilio(`${emoji} Salvo: ${data.description} - R$ ${data.amount}`);

    } catch (error) {
        console.error(error);
        return new Response(error.message, { status: 500 });
    }
});

function replyTwilio(message: string) {
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
  <Response>
      <Message>${message}</Message>
  </Response>`;

    return new Response(twiml, {
        headers: { "Content-Type": "text/xml" },
    });
}
