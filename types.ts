
export type TransactionType = 'income' | 'expense';

// Centralized Tab definition - Adicionado 'dividas' e 'orcamento'
export type Tab = 'controle' | 'receitas' | 'despesas' | 'dividas' | 'metas' | 'orcamento' | 'investimentos' | 'cursos' | 'config' | 'admin';

// New Interface for Credit Cards
export interface CreditCard {
  id: string;
  name: string;
  limit: number;
  dueDay: number; // Day of month (1-31)
  closingDay: number; // Day of month (1-31)
  color: string;
}

export interface Transaction {
  id: string;
  userId: string; // Link to the user
  date: string; // ISO Date string
  amount: number;
  category: string;
  description: string;
  paymentMethod?: string; // Only for expenses
  cardId?: string; // Optional link to specific credit card
  type: TransactionType;
  isRecurring?: boolean; // If true, this transaction is a template for future months
  recurrenceDay?: number; // Day of month to repeat (1-31)
}

// ... (Goal, Debt, BudgetLimit interfaces remain unchanged)
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

export interface BudgetLimit {
  id: string;
  userId: string;
  category: string;
  amount: number; // Limite mensal
  alertThreshold: number; // Porcentagem para alerta (ex: 80)
}

export interface AppConfig {
  userId?: string;
  name?: string; // Nome do usuário para exibição
  // Subscription Fields
  planType?: 'basic' | 'semiannual' | 'annual';
  subscriptionStatus?: 'active' | 'inactive' | 'canceled' | 'past_due';
  nextBillingDate?: string; // ISO Date for next payment
  planCycle?: 'semiannual' | 'annual';
  theme?: 'light' | 'dark'; // New Theme Field
  currency?: 'BRL' | 'USD' | 'EUR' | 'GBP' | 'JPY'; // Currency Field
  categories: string[]; // Deprecated, kept for backward compat
  incomeCategories: string[]; // New separate list
  expenseCategories: string[]; // New separate list
  paymentMethods: string[];
  creditCardDueDate?: number; // Deprecated: legacy support
  creditCards?: CreditCard[]; // New list of cards
  // New fields for Reminders
  enableReminders?: boolean;
  reminderFrequency?: 'weekly' | 'biweekly' | 'monthly';
  lastSeenGoals?: string; // ISO Date of last time user checked/updated goals
  // Tutorial flag
  hasSeenTutorial?: boolean;
  // Remote Licensing
  licenseKey?: string;
  licenseStatus?: 'active' | 'inactive';
  // Added createdAt to allow checking if the config record exists in the database
  createdAt?: string;
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
  phone?: string; // New field for remarketing
  licenseStatus?: string;
  createdAt?: string; // If available
  isGhost?: boolean; // Flag para usuários detectados via pedidos mas sem perfil
}

export type InvestmentType = 'fixed' | 'variable' | 'fund' | 'crypto' | 'other';

export interface Investment {
  id: string;
  userId: string;
  name: string; // ex: CDB Banco Master, PETR4, Bitcoin
  type: InvestmentType;
  amount: number; // Valor Investido
  currentValue?: number; // Valor Atual (para renda variável)
  date: string; // Data da aplicação
  rate?: string; // Taxa contratada (ex: 120% CDI) - Opcional
}
