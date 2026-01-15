
import { AppConfig } from "./types";

export const APP_DOMAIN = "financepro360.com.br";

// CONFIGURAÇÃO DE PLANOS FINANCE PRO 360
export const PLANS_CONFIG = {
  semiannual: {
    name: "Plano Semestral",
    value: 47.90,
    checkoutUrl: "https://pay.kiwify.com.br/4A8FZ7I",
    features: ["Acesso Completo ao Sistema", "Inteligência Artificial Ilimitada", "Gestão de Metas e Dívidas", "Cursos Finance Academy", "Renovação a cada 6 meses"],
    period: "semestral"
  },
  annual: {
    name: "Plano Anual",
    value: 80.00,
    checkoutUrl: "https://pay.kiwify.com.br/PZzs9Up",
    features: ["Todos os benefícios do Semestral", "Economia Garantida", "Acesso por 12 meses", "Renovação Anual", "Prioridade no Suporte"],
    period: "anual"
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
  theme: 'dark',
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
