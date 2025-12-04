
import { AppConfig } from "./types";

export const DEFAULT_CONFIG: AppConfig = {
  theme: 'light',
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
    "Dinheiro"
  ],
  enableReminders: true,
  reminderFrequency: 'weekly',
  lastSeenGoals: new Date().toISOString(),
  hasSeenTutorial: false,
  accountStatus: 'active' // Default fallback, but logic overrides this based on DB
};

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];

export const ADMIN_EMAILS = [
    'admin@finance360.com',
    'thiago@finance360.com',
    'thiago@finance.app',
    'tsngti@gmail.com',
    'admin@finance.app'
];
