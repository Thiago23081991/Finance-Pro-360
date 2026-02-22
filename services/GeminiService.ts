
import { Transaction, Goal } from "../types";

// Force Mock Mode for now to ensure UI renders since we don't have a valid key or working SDK setup yet
const IS_MOCK_MODE = true;

export interface AIInsight {
    type: 'warning' | 'tip' | 'praise' | 'opportunity';
    title: string;
    message: string;
    action?: string;
}

const MOCK_INSIGHTS: AIInsight[] = [
    {
        type: 'warning',
        title: 'Atenção aos Gastos Excessivos',
        message: 'Notei que seus gastos com "Alimentação" superaram 30% da sua renda este mês. Tente cozinhar mais em casa na próxima semana.',
        action: 'Ver Gastos'
    },
    {
        type: 'opportunity',
        title: 'Oportunidade de Investimento',
        message: 'Você tem R$ 500,00 parados na conta corrente. Se aplicar no CDB 100% CDI, pode render aprox. R$ 5,00/mês sem risco.',
        action: 'Investir'
    },
    {
        type: 'praise',
        title: 'Meta Atingida!',
        message: 'Parabéns! Você alcançou 50% da sua meta "Reserva de Emergência". Continue assim!',
        action: 'Ver Metas'
    }
];

export const GeminiService = {
    async getInsights(transactions: Transaction[], goals: Goal[]): Promise<AIInsight[]> {
        // ... (existing logic for insights if needed, or we can deprecate)
        console.warn('Returning Mock Data for UI Test.');
        await new Promise(resolve => setTimeout(resolve, 800));
        return MOCK_INSIGHTS;
    },

    async sendMessage(message: string, context: { transactions: Transaction[], goals: Goal[] }): Promise<string> {
        console.log("Sending message to AI:", message);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate typing delay

        const lowerMsg = message.toLowerCase();

        if (lowerMsg.includes('gastar') || lowerMsg.includes('gastei')) {
            return "Com base nos seus dados recentes, vejo que você gastou bastante com Alimentação. Que tal definirmos um teto de gastos para a próxima semana?";
        }
        if (lowerMsg.includes('investir') || lowerMsg.includes('dinheiro')) {
            return "Para o seu perfil, recomendo começar com uma Reserva de Emergência em CDB de liquidez diária. Você tem R$ 500,00 disponíveis para começar?";
        }
        if (lowerMsg.includes('olá') || lowerMsg.includes('oi')) {
            return "Olá! Sou seu assistente financeiro pessoal. Posso analisar seus gastos, sugerir investimentos ou criar metas. Como posso ajudar hoje?";
        }

        return "Interessante! Estou aprendendo sobre seus hábitos financeiros. Por enquanto, sugiro focar em manter suas despesas essenciais abaixo de 50% da renda.";
    },

    async analyzeReceipt(imageBase64: string): Promise<Partial<Transaction>> {
        console.log("Analyzing receipt image...");
        // Call Edge Function
        const { supabase } = await import('../supabaseClient');
        const { data, error } = await supabase.functions.invoke('financial-advisor', {
            body: {
                message: "Analise esta imagem (recibo/boleto) e extraia os seguintes dados em JSON estrito (apenas as chaves, sem formatação markdown extra): { amount: number, date: 'YYYY-MM-DD', description: string, category: string, type: 'expense' | 'income' }. Use categorias como Alimentação, Transporte, Moradia, etc. Caso não encontre a data puxe a de hoje.",
                image: imageBase64
            }
        });
        if (error) throw error;

        try {
            const rawText = data.reply;
            let cleanJson = rawText.replace(/```json/g, '').replace(/```/g, '').trim();
            const start = cleanJson.indexOf('{');
            const end = cleanJson.lastIndexOf('}');
            cleanJson = cleanJson.substring(start, end + 1);
            return JSON.parse(cleanJson);
        } catch (e) {
            console.error("Failed to parse AI response as JSON", data.reply);
            throw new Error("Não foi possível extrair os dados da imagem.");
        }
    },

    async parseTransaction(text: string): Promise<Partial<Transaction>> {
        console.log("Parsing transaction from text:", text);

        const lowerText = text.toLowerCase();
        let amount = 0;

        // Enhanced Regex to capture amounts like: R$ 30, 30 reais, 30.50, 30,00
        // 1. Look for explicit currency (R$ 30) or suffix (30 reais)
        // Matches "r$", "r$ ", "rs", "rs " followed optionally by space, then digits
        const currencyMatch = lowerText.match(/(?:r\$|rs)\s*([\d.,]+)/) || lowerText.match(/([\d.,]+)\s*(?:reais|real|conto)/);

        if (currencyMatch) {
            // Replace all dots with nothing, then comma with dot IF it's likely thousands separator?
            // Actually, for simple amounts like 1.200,50 vs 1,200.50 vs 300, it's tricky.
            // But for "200" or "30,00" or "30.00":
            let valStr = currencyMatch[1];
            // If strictly integer (no dot/comma), easy.
            if (!valStr.includes(',') && !valStr.includes('.')) {
                amount = parseFloat(valStr);
            } else {
                // Replace comma with dot for standard JS parsing
                valStr = valStr.replace(',', '.');
                amount = parseFloat(valStr);
            }
        } else {
            // 2. Fallback: look for the first standalone number that isn't a date (simple heuristic)
            // This is risky but helps for "Uber 15.90"
            const numberMatch = text.match(/\b(\d+[,.]?\d*)\b/);
            if (numberMatch) {
                // Verify it's not part of a date like 03/02
                if (!text.includes(numberMatch[0] + '/')) {
                    amount = parseFloat(numberMatch[0].replace(',', '.'));
                }
            }
        }

        let date = new Date().toISOString().split('T')[0]; // Default to today

        // Match today/yesterday
        if (lowerText.includes('ontem')) {
            const d = new Date();
            d.setDate(d.getDate() - 1);
            date = d.toISOString().split('T')[0];
        } else {
            // Match DD/MM
            const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
            if (dateMatch) {
                const currentYear = new Date().getFullYear();
                date = `${currentYear}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
            }
        }

        let category = 'Outros';
        // Expanded Keywords
        if (lowerText.match(/(uber|taxi|99|combustivel|gasolina|posto|onibus|passagem|transporte)/)) category = 'Transporte';
        if (lowerText.match(/(ifood|rappi|restaurante|mercado|almoço|jantar|lanche|pizza|açaí|padaria|supermercado|comida)/)) category = 'Alimentação';
        if (lowerText.match(/(aluguel|condominio|luz|agua|energia|internet|net|claro|vivo|tim|oi|casa|limpeza)/)) category = 'Moradia';
        if (lowerText.match(/(cinema|netflix|spotify|prime|hbo|jogo|steam|teatro|show|lazer|viagem)/)) category = 'Lazer';
        if (lowerText.match(/(farmacia|remedio|medico|dentista|exame|saude|convênio)/)) category = 'Saúde';
        if (lowerText.match(/(curso|livro|escola|faculdade|aula|educacao)/)) category = 'Educação';
        if (lowerText.match(/(salario|renda|deposito|pix recebido|lucro|venda)/)) category = 'Receitas'; // Though type needs separate handling

        // Description Cleanup
        let description = text;
        // Remove common stop words at start
        description = description.replace(/^(gastei|paguei|comprei|foi|fiz|recebi|incluir|add|adicionar|inserir)\s+/i, '');
        // Remove amount if present in text to clean up description slightly (optional, but nice)
        // For now, let's just capitalize first letter
        if (description.length > 0) {
            description = description.charAt(0).toUpperCase() + description.slice(1);
        }

        // Guess Type based on keywords or category
        let type: 'income' | 'expense' = 'expense';
        if (category === 'Receitas' || lowerText.match(/(recebi|ganhei|salario|pagamento)/)) {
            type = 'income';
        }

        return {
            amount,
            date,
            category: category === 'Receitas' && type === 'income' ? 'Salário' : category, // Default income cat
            description,
            type
        };
    }
};
