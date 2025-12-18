
import { AppConfig } from "./types";

export const APP_DOMAIN = "www.financepro360.com.br";

// COLOQUE AQUI SEUS LINKS DE CHECKOUT REAIS
export const CHECKOUT_URLS = {
    kiwify: "https://pay.kiwify.com.br/SEU_LINK_AQUI", 
    hotmart: "https://pay.hotmart.com/SEU_LINK_AQUI"
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
