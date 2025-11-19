export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  date: string; // ISO Date string
  amount: number;
  category: string;
  description: string;
  paymentMethod?: string; // Only for expenses
  type: TransactionType;
}

export interface Goal {
  id: string;
  name: string;
  targetValue: number;
  currentValue: number;
  status: 'Concluída' | 'Em andamento';
}

export interface AppConfig {
  categories: string[];
  paymentMethods: string[];
}

export interface FilterState {
  month: number; // 0-11
  year: number;
  category: string;
  paymentMethod: string;
}