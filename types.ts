
export type TransactionType = 'income' | 'expense';

// Centralized Tab definition - Adicionado 'dividas'
export type Tab = 'controle' | 'receitas' | 'despesas' | 'dividas' | 'metas' | 'investimentos' | 'cursos' | 'config' | 'admin';

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

export interface Debt {
  id: string;
  userId: string;
  name: string; // Nome do Credor ou Serasa
  totalAmount: number; // Valor Total Devido
  interestRate: number; // Taxa de juros mensal (%)
  dueDate?: string; // Vencimento opcional
  category: 'banco' | 'cartao' | 'servico' | 'emprestimo' | 'outro';
}

export interface AppConfig {
  userId?: string;
  name?: string; // Nome do usuário para exibição
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
  name?: string; // Nome completo para registro
  username: string; // Email
  password: string; // In a real app, this should be hashed. For client-side demo, plain text is stored locally.
  createdAt: string;
}

export interface PurchaseRequest {
  id: string;
  userId: string;
  // Campos virtuais para exibição na UI
  userName?: string; 
  userEmail?: string;
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
  debts?: Debt[];
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
  name?: string; // Nome completo
  email: string;
  username: string;
  licenseStatus?: string;
  createdAt?: string; // If available
  isGhost?: boolean; // Flag para usuários detectados via pedidos mas sem perfil
}
