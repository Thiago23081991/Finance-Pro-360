
import { AppConfig } from "./types";

export const APP_DOMAIN = "financepro360.com.br";

// CONFIGURAÇÃO DE PLANOS FINANCE PRO 360
export const PLANS_CONFIG = {
  basic: {
    name: "Plano Essencial",
    value: 47.90,
    checkoutUrl: "https://pay.kiwify.com.br/4A8FZ7I",
    features: ["Dashboard Completo", "Gestão de Receitas/Despesas", "Metas Financeiras", "Exportação de Planilhas"]
  },
  premium: {
    name: "Plano Premium AI",
    value: 97.00,
    checkoutUrl: "https://pay.kiwify.com.br/PZzs9Up",
    features: ["Tudo do Básico", "Insights com Inteligência Artificial", "Simuladores de Bancos (Nubank)", "Cursos da Finance Academy", "Gestão Avançada de Dívidas"]
  }
};

export const DEFAULT_INCOME_CATEGORIES = [
  "Salários",
  "Vendas Diversas",
  "Aluguel de Carro",
  "Aluguel de Apartamento",
  "Aluguel de Casa",
  "Dividendos",
  "Rendimentos",
  "Aposentadoria",
  "Outros"
];

export const DEFAULT_EXPENSE_CATEGORIES = [
  "Alimentação",
  "Transporte",
  "Moradia",
  "Saúde",
  "Lazer",
  "Educação",
  "Investimentos",
  "Outros"
];

export const DEFAULT_CONFIG: AppConfig = {
  planType: 'basic',
  theme: 'light',
  currency: 'BRL',
  categories: [], // Legacy empty
  incomeCategories: DEFAULT_INCOME_CATEGORIES,
  expenseCategories: DEFAULT_EXPENSE_CATEGORIES,
  paymentMethods: [
    "Débito",
    "Crédito",
    "PIX",
    "Dinheiro",
    "Boleto",
    "Transferência"
  ],
  creditCardDueDate: 10,
  enableReminders: true,
  reminderFrequency: 'weekly',
  lastSeenGoals: new Date().toISOString(),
  hasSeenTutorial: false
};

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
