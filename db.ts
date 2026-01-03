
import { Transaction, Goal, Debt, AppConfig, UserAccount, PurchaseRequest, AdminMessage, SystemStats, UserProfile } from "./types";
import { DEFAULT_CONFIG } from "./constants";
import { supabase } from "./supabaseClient";
import { generateId } from "./utils";

export class DBService {

  // --- AUTH OPERATIONS ---

  static async registerUser(user: UserAccount): Promise<any> {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.username,
      password: user.password,
      options: {
        emailRedirectTo: window.location.origin,
        data: {
          full_name: user.name
        }
      }
    });

    if (authError) throw new Error(authError.message);

    if (authData.user && authData.session) {
      // Attempt to create profile with core columns only to be safe
      const { error: profileError } = await supabase.from('profiles').insert({
        id: authData.user.id,
        email: user.username,
        username: user.name || user.username.split('@')[0],
        categories: DEFAULT_CONFIG.categories,
        payment_methods: DEFAULT_CONFIG.paymentMethods,
        enable_reminders: true,
        has_seen_tutorial: false
      });

      if (profileError) {
        console.error("Erro ao criar perfil inicial:", profileError.message);
      }
    }

    return authData;
  }

  static async loginUser(username: string, password: string): Promise<any> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (error) {
      throw new Error(error.message || 'Falha na autenticação');
    }
    return data.user;
  }

  static async logout(): Promise<void> {
    await supabase.auth.signOut();
  }

  static async getCurrentUser(): Promise<any> {
    const { data } = await supabase.auth.getUser();
    return data.user;
  }

  static async resetUserPassword(username: string, newPass: string): Promise<void> {
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw new Error(error.message);
  }

  static async requestPasswordReset(email: string): Promise<void> {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: window.location.origin,
    });
    if (error) throw new Error(error.message);
  }

  static async deleteUserAccount(userId: string): Promise<void> {
    const tablesToDelete = ['transactions', 'goals', 'debts', 'profiles', 'purchase_requests', 'messages'];

    try {
      await Promise.all(tablesToDelete.map(table => {
        let column = 'user_id';
        if (table === 'profiles') column = 'id';
        if (table === 'messages') column = 'receiver';

        return supabase.from(table).delete().eq(column, userId).then(() => { });
      }));

      await this.logout();
    } catch (error: any) {
      throw new Error("Erro ao excluir dados: " + error.message);
    }
  }

  // --- DATA OPERATIONS ---

  static async getTransactions(userId: string): Promise<Transaction[]> {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return data.map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      date: t.date,
      amount: parseFloat(t.amount),
      category: t.category,
      description: t.description,
      paymentMethod: t.payment_method,
      type: t.type
    }));
  }

  static async addTransaction(t: Transaction): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Usuário não autenticado");

    const payload = {
      id: t.id,
      user_id: user.id,
      date: t.date,
      amount: t.amount,
      category: t.category,
      description: t.description,
      payment_method: t.paymentMethod,
      type: t.type
    };

    const { error } = await supabase.from('transactions').upsert(payload);
    if (error) throw new Error(error.message);
  }

  static async deleteTransaction(id: string): Promise<void> {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  static async getGoals(userId: string): Promise<Goal[]> {
    const { data, error } = await supabase.from('goals').select('*');
    if (error) throw error;

    return data.map((g: any) => ({
      id: g.id,
      userId: g.user_id,
      name: g.name,
      targetValue: parseFloat(g.target_value),
      currentValue: parseFloat(g.current_value),
      status: g.status
    }));
  }

  static async saveGoal(g: Goal): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Usuário não autenticado");

    const payload = {
      id: g.id,
      user_id: user.id,
      name: g.name,
      target_value: g.targetValue,
      current_value: g.currentValue,
      status: g.status
    };

    const { error } = await supabase.from('goals').upsert(payload);
    if (error) throw new Error(error.message);
  }

  static async deleteGoal(id: string): Promise<void> {
    const { error } = await supabase.from('goals').delete().eq('id', id);
    if (error) throw new Error(error.message);
  }

  static async getDebts(userId: string): Promise<Debt[]> {
    const { data, error } = await supabase.from('debts').select('*').order('interest_rate', { ascending: false });

    if (error) {
      const localData = localStorage.getItem(`fp360_debts_${userId}`);
      if (localData) return JSON.parse(localData);
      return [];
    }

    return data.map((d: any) => ({
      id: d.id,
      userId: d.user_id,
      name: d.name,
      totalAmount: parseFloat(d.total_amount),
      interestRate: parseFloat(d.interest_rate),
      dueDate: d.due_date,
      category: d.category
    }));
  }

  static async saveDebt(d: Debt): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Usuário não autenticado");

    const payload = {
      id: d.id,
      user_id: user.id,
      name: d.name,
      total_amount: d.totalAmount,
      interest_rate: d.interestRate,
      due_date: d.dueDate,
      category: d.category
    };

    const { error } = await supabase.from('debts').upsert(payload);

    if (error) {
      const currentDebts = await this.getDebts(user.id);
      const index = currentDebts.findIndex(x => x.id === d.id);
      if (index >= 0) currentDebts[index] = d;
      else currentDebts.push(d);
      localStorage.setItem(`fp360_debts_${user.id}`, JSON.stringify(currentDebts));
    }
  }

  static async deleteDebt(id: string): Promise<void> {
    const { error } = await supabase.from('debts').delete().eq('id', id);
    if (error) {
      const user = await this.getCurrentUser();
      if (user) {
        const currentDebts = await this.getDebts(user.id);
        const filtered = currentDebts.filter(d => d.id !== id);
        localStorage.setItem(`fp360_debts_${user.id}`, JSON.stringify(filtered));
      }
    }
  }

  static async getConfig(userId: string): Promise<AppConfig> {
    const user = await this.getCurrentUser();
    if (!user) return DEFAULT_CONFIG;

    // Load from LocalStorage as first source of truth for schema-volatile fields
    const localConfigStr = localStorage.getItem(`fp360_config_${user.id}`);
    const localConfig = localConfigStr ? JSON.parse(localConfigStr) : {};

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

    if (!data) {
      return { ...DEFAULT_CONFIG, ...localConfig, userId: user.id };
    }

    // Merge: Database (primary for shared data) + LocalStorage (fallback for missing columns)
    return {
      userId: data.id,
      name: data.username,
      theme: data.theme || localConfig.theme || 'light',
      currency: data.currency || localConfig.currency || 'BRL',
      categories: data.categories || DEFAULT_CONFIG.categories,
      paymentMethods: data.payment_methods || DEFAULT_CONFIG.paymentMethods,
      enableReminders: data.enable_reminders ?? localConfig.enableReminders ?? true,
      reminderFrequency: data.reminder_frequency || localConfig.reminderFrequency,
      lastSeenGoals: data.last_seen_goals || localConfig.lastSeenGoals,
      hasSeenTutorial: data.has_seen_tutorial ?? localConfig.hasSeenTutorial ?? false,
      licenseKey: data.license_key || localConfig.licenseKey,
      licenseStatus: data.license_status || localConfig.licenseStatus,
      // Added createdAt to support lazy initialization check in App.tsx
      createdAt: data.created_at
    };
  }

  static async saveConfig(config: AppConfig): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) return;

    // Always update local storage first to prevent UI state loss
    localStorage.setItem(`fp360_config_${user.id}`, JSON.stringify(config));

    // Selective payload to avoid crashing on missing columns
    // If 'currency' or other columns are missing, we try to update what we can.
    const corePayload: any = {
      id: user.id,
      // Fixed: Map name back to username field in Supabase profiles table
      username: config.name,
      categories: config.categories,
      payment_methods: config.paymentMethods,
      enable_reminders: config.enableReminders,
      reminder_frequency: config.reminderFrequency,
      last_seen_goals: config.lastSeenGoals,
      // Fix: property name was has_seen_tutorial but AppConfig uses hasSeenTutorial
      has_seen_tutorial: config.hasSeenTutorial,
      license_key: config.licenseKey,
      license_status: config.licenseStatus
    };

    // Try a broad update first
    const { error } = await supabase.from('profiles').upsert({
      ...corePayload,
      theme: config.theme,
      currency: config.currency
    });

    if (error && error.message.includes("column")) {
      console.warn("Schema mismatch detected. Falling back to core columns only.");
      // If it fails due to a column error, retry with only confirmed columns
      await supabase.from('profiles').upsert(corePayload);
    }
  }



  static async createProfileManually(userId: string, email: string, name: string): Promise<void> {
    const payload = {
      id: userId,
      email: email,
      username: name,
      categories: DEFAULT_CONFIG.categories,
      payment_methods: DEFAULT_CONFIG.paymentMethods,
      enable_reminders: true,
      has_seen_tutorial: false,
      license_status: 'inactive'
    };
    const { error } = await supabase.from('profiles').insert(payload);
    if (error) throw new Error(error.message);
  }

  // --- BACKUP OPERATIONS ---

  static async createBackup(): Promise<string> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Não logado");

    const [txs, goals, debts, profile, reqs, msgs] = await Promise.all([
      supabase.from('transactions').select('*'),
      supabase.from('goals').select('*'),
      supabase.from('debts').select('*').then(res => res.error ? { data: [] } : res),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('purchase_requests').select('*'),
      supabase.from('messages').select('*').or(`receiver.eq.${user.id},sender.eq.Admin`)
    ]);

    const backup = {
      transactions: txs.data,
      goals: goals.data,
      debts: debts.data,
      configs: [profile.data],
      purchase_requests: reqs.data,
      messages: msgs.data
    };

    return JSON.stringify(backup);
  }

  static async restoreBackup(jsonString: string): Promise<void> {
    const data = JSON.parse(jsonString);
    const user = await this.getCurrentUser();
    if (!user) return;

    if (data.transactions && data.transactions.length > 0) {
      const cleanTxs = data.transactions.map((t: any) => ({
        ...t, user_id: user.id
      }));
      await supabase.from('transactions').upsert(cleanTxs);
    }

    if (data.goals && data.goals.length > 0) {
      const cleanGoals = data.goals.map((g: any) => ({
        ...g, user_id: user.id
      }));
      await supabase.from('goals').upsert(cleanGoals);
    }

    if (data.debts && data.debts.length > 0) {
      const cleanDebts = data.debts.map((d: any) => ({
        ...d, user_id: user.id
      }));
      await supabase.from('debts').upsert(cleanDebts);
    }

    if (data.configs && data.configs.length > 0) {
      const cfg = data.configs[0];
      delete cfg.id;
      await supabase.from('profiles').update(cfg).eq('id', user.id);
    }
  }

  // --- ADMIN OPERATIONS ---

  static async getSystemStats(): Promise<SystemStats> {
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });

    const { data: volData } = await supabase.from('transactions').select('amount');
    const totalVol = volData ? volData.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0) : 0;

    const { count: licenseCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('license_status', 'active');

    return {
      totalUsers: usersCount || 0,
      totalTransactions: txCount || 0,
      totalVolume: totalVol,
      activeLicenses: licenseCount || 0
    };
  }

  static async getAllProfiles(): Promise<UserProfile[]> {
    const { data, error } = await supabase.from('profiles').select('id, email, username, license_status, created_at');
    if (error) throw new Error(error.message);

    return data.map((p: any) => ({
      id: p.id,
      name: p.username,
      email: p.email,
      username: p.username,
      licenseStatus: p.license_status,
      createdAt: p.created_at
    }));
  }

  static async getPurchaseRequest(userId: string): Promise<PurchaseRequest | null> {
    const { data } = await supabase.from('purchase_requests').select('*').eq('user_id', userId).maybeSingle();

    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      requestDate: data.request_date,
      status: data.status
    };
  }

  static async savePurchaseRequest(req: PurchaseRequest): Promise<void> {
    const payload = {
      id: req.id,
      user_id: req.userId,
      request_date: req.requestDate,
      status: req.status
    };
    const { error } = await supabase.from('purchase_requests').upsert(payload);
    if (error) throw new Error(error.message);

    if (req.status === 'approved') {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: req.userId,
          license_status: 'active'
        }, { onConflict: 'id' });

      if (profileError) console.error("Erro ao ativar licença no perfil:", profileError);
    }
  }

  static async updateUserLicense(userId: string, status: 'active' | 'inactive'): Promise<void> {
    const { error } = await supabase.from('profiles').update({ license_status: status }).eq('id', userId);
    if (error) throw new Error(error.message);
  }

  static async getAllPurchaseRequests(): Promise<PurchaseRequest[]> {
    const { data, error } = await supabase.from('purchase_requests').select('*');
    if (error) return [];

    return data.map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      requestDate: r.request_date,
      status: r.status
    }));
  }

  // --- MESSAGING OPERATIONS ---

  static async sendMessage(msg: AdminMessage): Promise<void> {
    const payload = {
      id: msg.id,
      sender: msg.sender,
      receiver: msg.receiver,
      content: msg.content,
      read: msg.read,
      timestamp: msg.timestamp
    };
    const { error } = await supabase.from('messages').insert(payload);
    if (error) throw new Error(error.message);
  }

  static async sendBroadcastMessage(content: string): Promise<void> {
    const { data: profiles, error } = await supabase.from('profiles').select('id');
    if (error) throw new Error("Erro ao buscar usuários: " + error.message);

    if (!profiles || profiles.length === 0) return;

    const timestamp = new Date().toISOString();
    const messagesToInsert = profiles.map(p => ({
      id: generateId(),
      sender: 'Admin',
      receiver: p.id,
      content: content,
      read: false,
      timestamp: timestamp
    }));

    const { error: insertError } = await supabase.from('messages').insert(messagesToInsert);
    if (insertError) throw new Error("Erro ao disparar mensagens: " + insertError.message);
  }

  static async getMessagesForUser(userId: string): Promise<AdminMessage[]> {
    const { data, error } = await supabase.from('messages').select('*').eq('receiver', userId);
    if (error) return [];

    return data.map((m: any) => ({
      id: m.id,
      sender: m.sender,
      receiver: m.receiver,
      content: m.content,
      timestamp: m.timestamp,
      read: m.read
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static async getAllMessages(): Promise<AdminMessage[]> {
    const { data, error } = await supabase.from('messages').select('*');
    if (error) return [];

    return data.map((m: any) => ({
      id: m.id,
      sender: m.sender,
      receiver: m.receiver,
      content: m.content,
      timestamp: m.timestamp,
      read: m.read
    })).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  static async markMessageAsRead(msgId: string): Promise<void> {
    const { error } = await supabase.from('messages').update({ read: true }).eq('id', msgId);
    if (error) throw new Error(error.message);
  }
}
