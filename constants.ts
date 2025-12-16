
import { AppConfig } from "./types";

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
    "Dinheiro"
  ],
  enableReminders: true,
  reminderFrequency: 'weekly',
  lastSeenGoals: new Date().toISOString(),
  hasSeenTutorial: false
};

export const MONTH_NAMES = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
];
