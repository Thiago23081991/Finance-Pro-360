
export type TransactionType = 'income' | 'expense';

export interface Transaction {
  id: string;
  userId: string; // Link to the user
  date: string; // ISO Date string
  amount: number;
  category: string;
  description: string;
  paymentMethod?: string; // Only for expenses
  type: TransactionType;
}

export interface Goal {
  id: string;
  userId: string; // Link to the user
  name: string;
  targetValue: number;
  currentValue: number;
  status: 'Concluída' | 'Em andamento';
}

export interface AppConfig {
  userId?: string;
  categories: string[];
  paymentMethods: string[];
  // New fields for Reminders
  enableReminders?: boolean;
  lastSeenGoals?: string; // ISO Date of last time user checked/updated goals
  // Tutorial flag
  hasSeenTutorial?: boolean;
}

export interface FilterState {
  month: number; // 0-11
  year: number;
  category: string;
  paymentMethod: string;
}

export interface UserAccount {
  username: string;
  password: string; // In a real app, this should be hashed. For client-side demo, plain text is stored locally.
  createdAt: string;
}
