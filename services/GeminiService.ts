
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

    async parseTransaction(text: string): Promise<Partial<Transaction>> {
        console.log("Parsing transaction from text:", text);
        await new Promise(resolve => setTimeout(resolve, 800)); // Simulate processing delay

        const lowerText = text.toLowerCase();
        let amount = 0;

        // Enhanced Regex to capture amounts like: R$ 30, 30 reais, 30.50, 30,00
        // 1. Look for explicit currency (R$ 30) or suffix (30 reais)
        const currencyMatch = lowerText.match(/(?:r\$|rs)\s*([\d.,]+)/) || lowerText.match(/([\d.,]+)\s*(?:reais|real|conto)/);

        if (currencyMatch) {
            amount = parseFloat(currencyMatch[1].replace(',', '.'));
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
        description = description.replace(/^(gastei|paguei|comprei|foi|fiz|recebi)\s+/i, '');
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
