import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const getBotToken = () => Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const getSupabaseUrl = () => Deno.env.get("SUPABASE_URL") || "";
const getServiceKey = () => Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(getSupabaseUrl(), getServiceKey());

async function sendMessage(chatId: number, text: string) {
  const TELEGRAM_API = `https://api.telegram.org/bot${getBotToken()}`;
  try {
    const response = await fetch(`${TELEGRAM_API}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "Markdown" }),
    });
    if (!response.ok) {
        console.error("Telegram API Error:", await response.text());
    }
  } catch (error) {
    console.error("Failed to send message:", error);
  }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// ==========================================
// 1. RESUMO SEMANAL (Domingos às 09:00 UTC-3)
// No Cron (UTC), 09:00 BRT = 12:00 UTC
// Cron pattern: 0 12 * * 0
// ==========================================
Deno.cron("Resumo Semanal", "0 12 * * 0", async () => {
    console.log("Iniciando rotina de Resumo Semanal...");
    
    // Obter usuários com telegram vinculado
    const { data: links, error: linkErr } = await supabase.from('telegram_links').select('*');
    if (linkErr || !links) {
        console.error("Erro ao buscar telegram links:", linkErr);
        return;
    }

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    
    const startDate = sevenDaysAgo.toISOString().split('T')[0];
    const endDate = today.toISOString().split('T')[0];

    for (const link of links) {
        // Obter transações dos últimos 7 dias
        const { data: transactions } = await supabase
            .from('transactions')
            .select('amount, type')
            .eq('user_id', link.user_id)
            .gte('date', startDate)
            .lte('date', endDate);
            
        if (!transactions || transactions.length === 0) continue; // Sem movimentação na semana

        let income = 0;
        let expense = 0;
        
        for (const t of transactions) {
            if (t.type === 'income') income += Number(t.amount);
            if (t.type === 'expense') expense += Number(t.amount);
        }

        const balance = income - expense;
        
        const emoji = balance >= 0 ? "✅" : "⚠️";
        
        const message = `📊 *Seu Resumo Semanal Finance Pro 360*\n\n` +
                        `Aqui está o balanço dos últimos 7 dias:\n` +
                        `*Receitas:* ${formatCurrency(income)}\n` +
                        `*Despesas:* ${formatCurrency(expense)}\n\n` +
                        `${emoji} *Saldo da Semana:* ${formatCurrency(balance)}\n\n` +
                        `Bom domingo e uma ótima semana! 🚀`;

        await sendMessage(Number(link.telegram_chat_id), message);
    }
});

// ==========================================
// 2. ALERTA DE ORÇAMENTO (Diário às 10:00 UTC-3)
// No Cron (UTC), 10:00 BRT = 13:00 UTC
// Cron pattern: 0 13 * * *
// ==========================================
Deno.cron("Alerta de Orcamento", "0 13 * * *", async () => {
    console.log("Iniciando rotina de Alerta de Orçamento...");
    
    // Obter todos os limites
    const { data: limits, error: limErr } = await supabase.from('budget_limits').select('*');
    if (limErr || !limits) return;

    // Obter vínculos para saber o chat_id
    const { data: links } = await supabase.from('telegram_links').select('*');
    if (!links) return;

    const today = new Date();
    const currentMonth = today.getMonth() + 1;
    const currentYear = today.getFullYear();
    const monthStr = `${currentYear}-${String(currentMonth).padStart(2, '0')}`;

    for (const limit of limits) {
        // Verificar se já foi enviado alerta neste mês
        if (limit.last_alert_sent) {
            const lastSentDate = new Date(limit.last_alert_sent);
            if (lastSentDate.getMonth() + 1 === currentMonth && lastSentDate.getFullYear() === currentYear) {
                continue; // Alerta já enviado neste mês para esta categoria
            }
        }

        // Encontrar o chat_id do usuário
        const userLink = links.find(l => l.user_id === limit.user_id);
        if (!userLink) continue;

        // Calcular gastos da categoria no mês atual
        const startDate = `${currentYear}-${String(currentMonth).padStart(2, '0')}-01`;
        
        const { data: transactions } = await supabase
            .from('transactions')
            .select('amount')
            .eq('user_id', limit.user_id)
            .eq('type', 'expense')
            .eq('category', limit.category)
            .gte('date', startDate);
            
        if (!transactions) continue;

        const totalSpent = transactions.reduce((sum, t) => sum + Number(t.amount), 0);
        const limitValue = Number(limit.amount);
        const threshold = Number(limit.alert_threshold) || 80;
        
        const percentageSpent = (totalSpent / limitValue) * 100;

        if (percentageSpent >= threshold) {
            // Estourou ou chegou perto do limite!
            const message = `🚨 *Alerta de Orçamento!*\n\n` +
                            `Sua categoria *${limit.category}* atingiu *${percentageSpent.toFixed(0)}%* do limite mensal.\n\n` +
                            `Limite Estipulado: ${formatCurrency(limitValue)}\n` +
                            `Gasto Atual: ${formatCurrency(totalSpent)}\n` +
                            `Disponível: ${formatCurrency(Math.max(0, limitValue - totalSpent))}\n\n` +
                            `Fique de olho nos seus gastos! 👀`;
                            
            await sendMessage(Number(userLink.telegram_chat_id), message);
            
            // Atualizar last_alert_sent
            await supabase
                .from('budget_limits')
                .update({ last_alert_sent: today.toISOString() })
                .eq('id', limit.id);
        }
    }
});

// A Edge function precisa exportar um handler HTTP padrão mesmo rodando como cron,
// caso contrário o deploy falhará ao checar a assinatura da função.
export default async (req: Request) => {
    return new Response(JSON.stringify({ status: "Telegram Alerts Edge Function is Active. Managed by Deno.cron." }), {
        headers: { "Content-Type": "application/json" },
    });
};
