
export type TransactionType = 'income' | 'expense';

// Centralized Tab definition
export type Tab = 'controle' | 'receitas' | 'despesas' | 'metas' | 'config' | 'admin';

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
  theme?: 'light' | 'dark'; // New Theme Field
  categories: string[];
  paymentMethods: string[];
  // New fields for Reminders
  enableReminders?: boolean;
  reminderFrequency?: 'weekly' | 'biweekly' | 'monthly';
  lastSeenGoals?: string; // ISO Date of last time user checked/updated goals
  // Tutorial flag
  hasSeenTutorial?: boolean;
  // Remote Licensing
  licenseKey?: string;
  licenseStatus?: 'active' | 'inactive';
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

export interface PurchaseRequest {
  id: string;
  userId: string;
  requestDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface AdminMessage {
  id: string;
  sender: string; // 'Admin' or specific admin name
  receiver: string; // userId
  content: string;
  timestamp: string;
  read: boolean;
}

export interface BackupData {
  users: UserAccount[];
  transactions: Transaction[];
  goals: Goal[];
  configs: AppConfig[];
  purchase_requests?: PurchaseRequest[];
  messages?: AdminMessage[];
}

export interface SystemStats {
  totalUsers: number;
  totalTransactions: number;
  totalVolume: number;
  activeLicenses: number;
}

export interface UserProfile {
  id: string;
  email: string;
  username: string;
  licenseStatus?: string;
  createdAt?: string; // If available
}
