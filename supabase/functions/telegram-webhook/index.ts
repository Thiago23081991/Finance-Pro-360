// supabase/functions/telegram-webhook/index.ts
// Finance Pro 360 — Telegram Bot Integration
// Deploy: supabase functions deploy telegram-webhook

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ─── ENV ───────────────────────────────────────────────
const BOT_TOKEN    = Deno.env.get("TELEGRAM_BOT_TOKEN") || "";
const GEMINI_KEY   = Deno.env.get("GEMINI_API_KEY")     || "";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")       || "";
const SERVICE_KEY  = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

const TELEGRAM_API = `https://api.telegram.org/bot${BOT_TOKEN}`;
const GEMINI_API   = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent";

// ─── TELEGRAM HELPERS ──────────────────────────────────
async function sendMessage(chatId: number, text: string, parseMode = "Markdown") {
  await fetch(`${TELEGRAM_API}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
}

// ─── GEMINI PARSE ─────────────────────────────────────
async function parseTransactionWithAI(message: string): Promise<any> {
  const today = new Date().toISOString().split("T")[0];

  const prompt = `Você é um assistente financeiro para usuário brasileiro.
Data de hoje: ${today}

Tarefa: Extraia os dados da transação da mensagem: "${message}"

Regras:
1. Moeda: 'real', 'reais', 'R$' → BRL. Se não informado, assuma BRL.
2. Tipo:
   - 'income' se recebendo dinheiro (ganhei, recebi, salário, venda, pix recebido, entrada)
   - 'expense' se gastando (gastei, comprei, paguei, saiu, débito, conta)
3. Categoria — escolha EXATAMENTE uma:
   - Despesa: Alimentação, Transporte, Moradia, Saúde, Lazer, Educação, Investimentos, Outros
   - Receita: Salários, Vendas Diversas, Aluguel de Carro, Aluguel de Apartamento, Aluguel de Casa, Dividendos, Rendimentos, Aposentadoria, Outros
4. Descrição: título curto e claro (máx 40 chars)
5. Data: YYYY-MM-DD. Use hoje (${today}) se não mencionado.

Retorne APENAS JSON válido (sem markdown):
{
  "amount": number,
  "description": string,
  "type": "income" | "expense",
  "category": string,
  "date": string
}
Se não for uma transação (saudação, pergunta, etc.), retorne: {"error": "not_transaction"}`;

  const res = await fetch(`${GEMINI_API}?key=${GEMINI_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { responseMimeType: "application/json", temperature: 0.1 },
    }),
  });

  const json = await res.json();
  const text = json?.candidates?.[0]?.content?.parts?.[0]?.text || '{"error":"ai_failed"}';
  return JSON.parse(text.trim());
}

// ─── FORMATTERS ────────────────────────────────────────
function formatBRL(n: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);
}

// ─── MAIN HANDLER ─────────────────────────────────────
serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("OK", { status: 200 });
  }

  let update: any;
  try {
    update = await req.json();
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  // Suporte a mensagens normais e edições
  const message = update.message || update.edited_message;
  if (!message?.text) {
    return new Response("No text", { status: 200 });
  }

  const chatId   = message.chat.id as number;
  const userId   = message.from?.id;
  const username = message.from?.username || message.from?.first_name || "Usuário";
  const text     = message.text.trim();

  console.log(`[TG] ${username} (${chatId}): ${text}`);

  // ── /start ──────────────────────────────────────────
  if (text === "/start" || text.startsWith("/start ")) {
    await sendMessage(chatId, `👋 Olá, *${username}*! Bem-vindo ao *Finance Pro 360 Bot*!

Para começar, vincule sua conta:

1️⃣ Abra o *Finance Pro 360* → Configurações → Integrações
2️⃣ Clique em *"Conectar Telegram"*
3️⃣ Um código será gerado (ex: \`FP-4A7X\`)
4️⃣ Envie aqui: \`/vincular SEU-CÓDIGO\`

Depois disso, basta me enviar suas transações em linguagem natural! 💬`);
    return new Response("OK");
  }

  // ── /vincular CÓDIGO ────────────────────────────────
  if (text.startsWith("/vincular")) {
    const parts = text.split(/\s+/);
    const code  = parts[1]?.toUpperCase();

    if (!code) {
      await sendMessage(chatId, "❌ Use: `/vincular SEU-CÓDIGO`\n\nGere o código em Configurações → Integrações no app.");
      return new Response("OK");
    }

    // Buscar código na tabela
    const { data: linkCode, error: codeError } = await supabase
      .from("telegram_link_codes")
      .select("user_id, expires_at, used")
      .eq("code", code)
      .single();

    if (codeError || !linkCode) {
      await sendMessage(chatId, "❌ Código inválido ou não encontrado.\n\nGere um novo código em Configurações → Integrações.");
      return new Response("OK");
    }

    if (linkCode.used) {
      await sendMessage(chatId, "❌ Este código já foi utilizado. Gere um novo código no app.");
      return new Response("OK");
    }

    if (new Date(linkCode.expires_at) < new Date()) {
      await sendMessage(chatId, "⏰ Código expirado. Volte ao app e gere um novo código (válido por 10 minutos).");
      return new Response("OK");
    }

    // Upsert vínculo Telegram ↔ usuário Finance Pro 360
    const { error: linkError } = await supabase
      .from("telegram_links")
      .upsert({
        user_id:          linkCode.user_id,
        telegram_chat_id: chatId,
        telegram_username: username,
        linked_at:        new Date().toISOString(),
      }, { onConflict: "user_id" });

    if (linkError) {
      console.error("Link error:", linkError);
      await sendMessage(chatId, "❌ Erro ao vincular. Tente novamente.");
      return new Response("OK");
    }

    // Marcar código como usado
    await supabase
      .from("telegram_link_codes")
      .update({ used: true })
      .eq("code", code);

    await sendMessage(chatId, `✅ *Conta vinculada com sucesso!*

Agora você pode enviar suas transações aqui em linguagem natural:

💸 *Despesa:* "gastei 45 no mercado"
💰 *Receita:* "recebi 3500 de salário"

Outros comandos:
• \`/saldo\` — saldo do mês atual
• \`/metas\` — suas metas financeiras
• \`/resumo\` — resumo financeiro
• \`/desvincular\` — remover conexão
• \`/ajuda\` — lista completa`);
    return new Response("OK");
  }

  // ── Verificar se usuário está vinculado ─────────────
  const { data: link, error: linkFetchError } = await supabase
    .from("telegram_links")
    .select("user_id")
    .eq("telegram_chat_id", chatId)
    .single();

  if (!link) {
    await sendMessage(chatId, `🔗 Sua conta não está vinculada ainda.

Para vincular:
1. Abra o *Finance Pro 360*
2. Vá em Configurações → Integrações
3. Clique em *"Conectar Telegram"*
4. Envie aqui: \`/vincular SEU-CÓDIGO\``);
    return new Response("OK");
  }

  const fp360UserId = link.user_id;

  // ── /desvincular ────────────────────────────────────
  if (text === "/desvincular") {
    await supabase.from("telegram_links").delete().eq("telegram_chat_id", chatId);
    await sendMessage(chatId, "🔓 Conta desvinculada com sucesso.\n\nVocê pode vincular novamente a qualquer momento pelo app.");
    return new Response("OK");
  }

  // ── /saldo ──────────────────────────────────────────
  if (text === "/saldo") {
    const now   = new Date();
    const month = now.getMonth() + 1;
    const year  = now.getFullYear();
    const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate   = `${year}-${String(month).padStart(2, "0")}-31`;

    const { data: txs } = await supabase
      .from("transactions")
      .select("amount, type")
      .eq("user_id", fp360UserId)
      .gte("date", startDate)
      .lte("date", endDate);

    const income  = (txs || []).filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = (txs || []).filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);
    const balance = income - expense;
    const emoji   = balance >= 0 ? "🟢" : "🔴";

    const monthNames = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];

    await sendMessage(chatId, `📊 *Saldo — ${monthNames[month - 1]}/${year}*

💰 Receitas:  *${formatBRL(income)}*
💸 Despesas: *${formatBRL(expense)}*
${emoji} Saldo:     *${formatBRL(balance)}*`);
    return new Response("OK");
  }

  // ── /metas ──────────────────────────────────────────
  if (text === "/metas") {
    const { data: goals } = await supabase
      .from("goals")
      .select("name, target_value, current_value, status")
      .eq("user_id", fp360UserId)
      .eq("status", "Em andamento");

    if (!goals || goals.length === 0) {
      await sendMessage(chatId, "🎯 Você não tem metas em andamento.\n\nCrie metas no app Finance Pro 360!");
      return new Response("OK");
    }

    const lines = goals.map(g => {
      const pct = g.target_value > 0 ? Math.round((g.current_value / g.target_value) * 100) : 0;
      const bar = "█".repeat(Math.floor(pct / 10)) + "░".repeat(10 - Math.floor(pct / 10));
      return `🎯 *${g.name}*\n${bar} ${pct}%\n${formatBRL(g.current_value)} / ${formatBRL(g.target_value)}`;
    }).join("\n\n");

    await sendMessage(chatId, `*Suas Metas Financeiras*\n\n${lines}`);
    return new Response("OK");
  }

  // ── /resumo ─────────────────────────────────────────
  if (text === "/resumo") {
    const now        = new Date();
    const month      = now.getMonth() + 1;
    const year       = now.getFullYear();
    const startDate  = `${year}-${String(month).padStart(2, "0")}-01`;
    const endDate    = `${year}-${String(month).padStart(2, "0")}-31`;

    const { data: txs } = await supabase
      .from("transactions")
      .select("amount, type, category")
      .eq("user_id", fp360UserId)
      .gte("date", startDate)
      .lte("date", endDate);

    const income  = (txs || []).filter(t => t.type === "income").reduce((s, t) => s + t.amount, 0);
    const expense = (txs || []).filter(t => t.type === "expense").reduce((s, t) => s + t.amount, 0);

    // Top 3 categorias
    const catMap: Record<string, number> = {};
    (txs || []).filter(t => t.type === "expense").forEach(t => {
      catMap[t.category] = (catMap[t.category] || 0) + t.amount;
    });
    const top3 = Object.entries(catMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, val]) => `  • ${cat}: ${formatBRL(val)}`)
      .join("\n");

    const savingsRate = income > 0 ? ((income - expense) / income * 100).toFixed(1) : "0.0";

    await sendMessage(chatId, `📈 *Resumo do Mês*

💰 Receita total: *${formatBRL(income)}*
💸 Despesa total: *${formatBRL(expense)}*
💾 Taxa de poupança: *${savingsRate}%*

*Top categorias de gasto:*
${top3 || "  Nenhuma despesa registrada"}

_Acesse o app para ver análises detalhadas._`);
    return new Response("OK");
  }

  // ── /ajuda ──────────────────────────────────────────
  if (text === "/ajuda" || text === "/help") {
    await sendMessage(chatId, `🤖 *Finance Pro 360 Bot — Comandos*

*Transações (linguagem natural):*
"gastei 45 no mercado"
"recebi 3500 de salário"
"paguei 150 de conta de luz"
"almocei fora, 32 reais"

*Comandos:*
\`/saldo\` — Saldo do mês atual
\`/metas\` — Suas metas em andamento
\`/resumo\` — Resumo financeiro completo
\`/desvincular\` — Remover conexão com o app
\`/ajuda\` — Esta mensagem`);
    return new Response("OK");
  }

  // ── Processar transação (texto livre) ────────────────
  try {
    // Indicar digitando...
    await fetch(`${TELEGRAM_API}/sendChatAction`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, action: "typing" }),
    });

    const data = await parseTransactionWithAI(text);

    if (data.error) {
      await sendMessage(chatId, `🤔 Não entendi isso como uma transação.

Tente algo como:
• "gastei 45 no mercado"
• "recebi 3500 de salário"
• "paguei 89 de internet"

Ou use \`/ajuda\` para ver todos os comandos.`);
      return new Response("OK");
    }

    // Salvar transação
    const { error: insertError } = await supabase.from("transactions").insert({
      user_id:        fp360UserId,
      amount:         data.amount,
      description:    data.description,
      type:           data.type,
      category:       data.category,
      date:           data.date,
      payment_method: "Telegram",
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      await sendMessage(chatId, "❌ Erro ao salvar a transação. Tente novamente.");
      return new Response("OK");
    }

    const emoji = data.type === "expense" ? "💸" : "💰";
    const typeLabel = data.type === "expense" ? "Despesa" : "Receita";

    await sendMessage(chatId, `${emoji} *${typeLabel} registrada!*

📌 *${data.description}*
💵 ${formatBRL(data.amount)}
🏷️ ${data.category}
📅 ${new Date(data.date + "T12:00:00").toLocaleDateString("pt-BR")}

_Já aparece no Finance Pro 360_ ✅`);

  } catch (err) {
    console.error("Processing error:", err);
    await sendMessage(chatId, "❌ Erro inesperado. Tente novamente ou use `/ajuda`.");
  }

  return new Response("OK");
});
