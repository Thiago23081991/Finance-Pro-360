import { AppConfig } from "./types";

export const APP_DOMAIN = "www.financepro360.com.br";

// CONFIGURAÇÃO DE PAGAMENTO PIX REAL (PAGSEGURO)
export const PAYMENT_CONFIG = {
    pixKey: "71ee2472-12a1-4edf-b0e0-ad0bc4c2a984",
    payload: "00020126580014br.gov.bcb.pix013671ee2472-12a1-4edf-b0e0-ad0bc4c2a98427600016BR.COM.PAGSEGURO0136D1917A9C-D209-49F6-BFBF-80644AC0D5A4520489995303986540549.905802BR5925THIAGO DA SILVA NASCIMENT6007Aracaju62290525PAGS0000049902512161508466304D551",
    value: 49.90,
    description: "Finance Pro 360 - Licença Vitalícia",
    receiver: "THIAGO DA SILVA NASCIMENT"
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