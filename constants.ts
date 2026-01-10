
import { AppConfig } from "./types";

export const APP_DOMAIN = "financepro360.com.br";

// CONFIGURAÇÃO DE PLANOS FINANCE PRO 360
export const PLANS_CONFIG = {
  basic: {
    name: "Plano Básico",
    value: 29.90,
    payload: "00020126580014BR.GOV.BCB.PIX0136ae75855f-8720-45b5-86c3-9d1a2411475f520400005303986540529.905802BR5925Thiago da Silva Nasciment6009SAO PAULO62140510ouz7uLxcyU6304BF59",
    features: ["Dashboard Completo", "Gestão de Receitas/Despesas", "Metas Financeiras", "Exportação de Planilhas"]
  },
  premium: {
    name: "Plano Premium (IA + Cursos)",
    value: 80.00,
    payload: "00020126580014br.gov.bcb.pix013671ee2472-12a1-4edf-b0e0-ad0bc4c2a98427600016BR.COM.PAGSEGURO0136D1917A9C-D209-49F6-BFBF-80644AC0D5A4520489995303986540580.005802BR5925THIAGO DA SILVA NASCIMENT6007Aracaju62290525PAGS0000080002512161508466304D551",
    features: ["Tudo do Básico", "Insights com Inteligência Artificial", "Simuladores de Bancos (Nubank)", "Cursos da Finance Academy", "Gestão Avançada de Dívidas"]
  }
};

export const DEFAULT_CONFIG: AppConfig = {
  theme: 'light',
  currency: 'BRL',
  categories: [
    "Alimentação",
    "Transporte",
    "Moradia",
    "Saúde",
    "Lazer",
    "Educação",
    "Salário",
    "Investimentos",
    "Outros"
  ],
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
