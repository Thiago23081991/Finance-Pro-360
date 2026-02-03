
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
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing delay

        // Simple Regex Mock Logic for Demo Purposes
        // Extracts amount (R$ XX,XX or XX.XX), date (DD/MM), and guesses category
        const lowerText = text.toLowerCase();

        let amount = 0;
        const amountMatch = text.match(/R\$\s?(\d+[,.]\d+)/i) || text.match(/(\d+[,.]\d+)/);
        if (amountMatch) {
            amount = parseFloat(amountMatch[1].replace(',', '.'));
        }

        let date = new Date().toISOString().split('T')[0]; // Default to today
        const dateMatch = text.match(/(\d{1,2})\/(\d{1,2})/);
        if (dateMatch) {
            const currentYear = new Date().getFullYear();
            date = `${currentYear}-${dateMatch[2].padStart(2, '0')}-${dateMatch[1].padStart(2, '0')}`;
        }

        let category = 'Outros';
        if (lowerText.includes('uber') || lowerText.includes('taxi') || lowerText.includes('combustivel')) category = 'Transporte';
        if (lowerText.includes('ifood') || lowerText.includes('restaurante') || lowerText.includes('mercado')) category = 'Alimentação';
        if (lowerText.includes('luz') || lowerText.includes('internet') || lowerText.includes('aluguel')) category = 'Moradia';
        if (lowerText.includes('cinema') || lowerText.includes('netflix')) category = 'Lazer';

        let description = 'Despesa identificada';
        // Simple heuristic: take the first 3 words
        const words = text.split(' ');
        if (words.length > 0) description = words.slice(0, 4).join(' ');

        return {
            amount,
            date,
            category,
            description,
            type: 'expense' // Default assumption
        };
    }
};
