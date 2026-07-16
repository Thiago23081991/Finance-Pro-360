
import { Transaction, Goal, Debt, BudgetLimit, AppConfig, UserAccount, PurchaseRequest, AdminMessage, SystemStats, UserProfile, Investment, SupportTicket, TicketMessage, BankAccount } from "./types";
import { DEFAULT_CONFIG } from "./constants";
import { supabase } from "./supabaseClient";
import { generateId, validateLicenseKey } from "./utils";

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
        categories: [], // Legacy
        payment_methods: DEFAULT_CONFIG.paymentMethods,
        enable_reminders: true,
        has_seen_tutorial: false,
        plan_type: 'basic'
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
      bankAccountId: t.bank_account_id || undefined,
      type: t.type,
      isRecurring: t.is_recurring,
      recurrenceDay: t.recurrence_day
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
      bank_account_id: t.bankAccountId || null,
      type: t.type,
      is_recurring: t.isRecurring,
      recurrence_day: t.recurrenceDay
    };

    const { error } = await supabase.from('transactions').upsert(payload);
    if (error) throw new Error(error.message);
  }

  static async addTransactions(transactions: Transaction[]): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Usuário não autenticado");

    if (transactions.length === 0) return;

    const payload = transactions.map(t => ({
      id: t.id,
      user_id: user.id,
      date: t.date,
      amount: t.amount,
      category: t.category,
      description: t.description,
      payment_method: t.paymentMethod,
      bank_account_id: t.bankAccountId || null,
      type: t.type,
      is_recurring: t.isRecurring,
      recurrence_day: t.recurrenceDay
    }));

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

  // --- BUDGET OPERATIONS ---

  static async getBudgetLimits(userId: string): Promise<BudgetLimit[]> {
    const { data, error } = await supabase.from('budget_limits').select('*');

    if (error) {
      // Fallback for when table doesn't exist yet or offline
      const localData = localStorage.getItem(`fp360_budget_${userId}`);
      if (localData) return JSON.parse(localData);
      return [];
    }

    return data.map((b: any) => ({
      id: b.id,
      userId: b.user_id,
      category: b.category,
      amount: parseFloat(b.amount),
      alertThreshold: b.alert_threshold
    }));
  }

  static async saveBudgetLimit(b: BudgetLimit): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Usuário não autenticado");

    const payload = {
      id: b.id,
      user_id: user.id,
      category: b.category,
      amount: b.amount,
      alert_threshold: b.alertThreshold
    };

    const { error } = await supabase.from('budget_limits').upsert(payload);

    if (error) {
      // Fallback local
      const current = await this.getBudgetLimits(user.id);
      const index = current.findIndex(x => x.id === b.id);
      if (index >= 0) current[index] = b;
      else current.push(b);
      localStorage.setItem(`fp360_budget_${user.id}`, JSON.stringify(current));
    }
  }

  static async deleteBudgetLimit(id: string): Promise<void> {
    const { error } = await supabase.from('budget_limits').delete().eq('id', id);
    if (error) {
      const user = await this.getCurrentUser();
      if (user) {
        const current = await this.getBudgetLimits(user.id);
        const filtered = current.filter(b => b.id !== id);
        localStorage.setItem(`fp360_budget_${user.id}`, JSON.stringify(filtered));
      }
    }
  }

  // --- INVESTMENT OPERATIONS ---

  static async getInvestments(userId: string): Promise<Investment[]> {
    const { data, error } = await supabase.from('investments').select('*').order('date', { ascending: false });

    if (error) {
      // Fallback to LocalStorage if table doesn't exist yet
      const localData = localStorage.getItem(`fp360_investments_${userId}`);
      if (localData) return JSON.parse(localData);
      return [];
    }

    return data.map((i: any) => ({
      id: i.id,
      userId: i.user_id,
      name: i.name,
      type: i.type,
      amount: parseFloat(i.amount),
      currentValue: i.current_value ? parseFloat(i.current_value) : parseFloat(i.amount),
      date: i.date,
      rate: i.rate
    }));
  }

  static async saveInvestment(inv: Investment): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Usuário não autenticado");

    const payload = {
      id: inv.id,
      user_id: user.id,
      name: inv.name,
      type: inv.type,
      amount: inv.amount,
      current_value: inv.currentValue,
      date: inv.date,
      rate: inv.rate
    };

    const { error } = await supabase.from('investments').upsert(payload);

    if (error) {
      // Fallback to LocalStorage
      const current = await this.getInvestments(user.id);
      const index = current.findIndex(x => x.id === inv.id);
      if (index >= 0) current[index] = inv;
      else current.push(inv);
      localStorage.setItem(`fp360_investments_${user.id}`, JSON.stringify(current));
    }
  }

  static async deleteInvestment(id: string): Promise<void> {
    const { error } = await supabase.from('investments').delete().eq('id', id);
    if (error) {
      const user = await this.getCurrentUser();
      if (user) {
        const current = await this.getInvestments(user.id);
        const filtered = current.filter(i => i.id !== id);
        localStorage.setItem(`fp360_investments_${user.id}`, JSON.stringify(filtered));
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
      categories: data.categories || [], // Legacy
      incomeCategories: data.income_categories || localConfig.incomeCategories || DEFAULT_CONFIG.incomeCategories,
      expenseCategories: data.expense_categories || localConfig.expenseCategories || DEFAULT_CONFIG.expenseCategories,
      paymentMethods: data.payment_methods || DEFAULT_CONFIG.paymentMethods,
      enableReminders: data.enable_reminders ?? localConfig.enableReminders ?? true,
      reminderFrequency: data.reminder_frequency || localConfig.reminderFrequency,
      lastSeenGoals: data.last_seen_goals || localConfig.lastSeenGoals,
      hasSeenTutorial: data.has_seen_tutorial ?? localConfig.hasSeenTutorial ?? false,
      licenseKey: data.license_key || localConfig.licenseKey,
      licenseStatus: data.license_status || localConfig.licenseStatus,
      planType: data.plan_type || localConfig.planType || 'basic',
      subscriptionExpiresAt: data.subscription_expires_at || localConfig.subscriptionExpiresAt,
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
      categories: config.categories, // Legacy
      payment_methods: config.paymentMethods,
      enable_reminders: config.enableReminders,
      reminder_frequency: config.reminderFrequency,
      last_seen_goals: config.lastSeenGoals,
      has_seen_tutorial: config.hasSeenTutorial,
      license_key: config.licenseKey,
      license_status: config.licenseStatus,
      plan_type: config.planType,
      subscription_expires_at: config.subscriptionExpiresAt ?? null
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



  static async activateLicenseKey(userId: string, key: string): Promise<boolean> {
    const isValid = validateLicenseKey(userId, key);
    if (!isValid) return false;

    await this.updateUserLicense(userId, 'active');
    return true;
  }

  static async createProfileManually(userId: string, email: string, name: string): Promise<void> {
    const payload = {
      id: userId,
      email: email,
      username: name,
      categories: [], // Legacy
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
    // Attempt to fetch phone if it exists (using * is safer if schema varies)
    const { data, error } = await supabase.from('profiles').select('*');
    if (error) throw new Error(error.message);

    return data.map((p: any) => ({
      id: p.id,
      name: p.username, // mapping username column to name prop as per legacy
      email: p.email,
      username: p.username,
      phone: p.phone, // Include phone
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
          license_status: 'active',
          plan_type: 'annual',
          plan_cycle: 'annual'
        }, { onConflict: 'id' });

      if (profileError) console.error("Erro ao ativar licença no perfil:", profileError);
    }
  }

  static async updateUserLicense(userId: string, status: 'active' | 'inactive'): Promise<void> {
    const updates: any = { license_status: status };
    if (status === 'active') {
      updates.plan_type = 'annual';
      updates.plan_cycle = 'annual';
    }
    const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
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

  // --- PUSH NOTIFICATIONS ---

  static async savePushSubscription(subscription: PushSubscription): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) return;

    // Convert subscription to simple JSON object if it's not already
    const subJSON = JSON.parse(JSON.stringify(subscription));

    const { error } = await supabase.from('push_subscriptions').upsert({
      user_id: user.id,
      subscription: subJSON,
      device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    }, { onConflict: 'user_id, subscription' });

    if (error) {
      console.error("Erro ao salvar inscrição push:", error);
    }
  }

  static async sendPushNotification(userId: string, title: string, body: string): Promise<void> {
    const { error } = await supabase.functions.invoke('send-push-notification', {
      body: { userId, title, body }
    });
    if (error) {
      console.error("DETAILED PUSH ERROR:", error);
      throw new Error("Erro ao enviar push: " + (error.message || JSON.stringify(error)));
    }
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

  // --- SUPPORT TICKETS OPERATIONS (Hybrid) ---

  static async getSupportTickets(userId?: string): Promise<SupportTicket[]> {
    let query = supabase.from('support_tickets').select('*');
    if (userId) {
      query = query.eq('user_id', userId);
    }

    // Sort by updated_at descending natively if possible
    query = query.order('updated_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      // Fallback to LocalStorage if table doesn't exist yet
      const localKey = userId ? `fp360_support_tickets_${userId}` : `fp360_support_tickets_all`;
      const localData = localStorage.getItem(localKey);
      if (localData) return JSON.parse(localData);
      return [];
    }

    return data.map((t: any) => ({
      id: t.id,
      userId: t.user_id,
      userEmail: t.user_email,
      userName: t.user_name,
      subject: t.subject,
      status: t.status,
      createdAt: t.created_at,
      updatedAt: t.updated_at,
      messages: typeof t.messages === 'string' ? JSON.parse(t.messages) : t.messages,
      unreadAdmin: t.unread_admin,
      unreadUser: t.unread_user
    }));
  }

  static async saveSupportTicket(ticket: SupportTicket): Promise<void> {
    const user = await this.getCurrentUser();

    // Convert to DB snake_case payload
    const payload = {
      id: ticket.id,
      user_id: ticket.userId,
      user_email: ticket.userEmail,
      user_name: ticket.userName,
      subject: ticket.subject,
      status: ticket.status,
      created_at: ticket.createdAt,
      updated_at: ticket.updatedAt,
      messages: ticket.messages, // Supabase can handle JSON arrays, or stringify if needed based on schema
      unread_admin: ticket.unreadAdmin,
      unread_user: ticket.unreadUser
    };

    const { error } = await supabase.from('support_tickets').upsert(payload);

    if (error) {
      console.warn("Saving ticket to LocalStorage due to remote error:", error.message);
      // Fallback Local Storage
      const current = await this.getSupportTickets(user ? user.id : undefined);
      const index = current.findIndex(x => x.id === ticket.id);

      let newTickets = [...current];
      if (index >= 0) newTickets[index] = ticket;
      else newTickets.push(ticket);

      // Keep it sorted
      newTickets.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

      if (user) localStorage.setItem(`fp360_support_tickets_${user.id}`, JSON.stringify(newTickets));
      localStorage.setItem(`fp360_support_tickets_all`, JSON.stringify(newTickets));
    }
  }

  // --- AI CONTEXT OPERATIONS ---

  static async getFinancialContext(userId: string): Promise<any> {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();
    const today = new Date();

    const [transactions, goals, debts, investments] = await Promise.all([
      this.getTransactions(userId),
      this.getGoals(userId),
      this.getDebts(userId),
      this.getInvestments(userId)
    ]);

    // Filter for current month
    const monthlyTxs = transactions.filter(t => {
      const d = new Date(t.date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    });

    const income = monthlyTxs
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const expenses = monthlyTxs
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    // Calculate top categories with percentages
    const categoryTotals: Record<string, number> = {};
    monthlyTxs.filter(t => t.type === 'expense').forEach(t => {
      categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
    });

    const topCategories = Object.entries(categoryTotals)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([cat, amount]) => {
        const percent = expenses > 0 ? ((amount / expenses) * 100).toFixed(0) : 0;
        return `${cat}: R$ ${amount.toFixed(2)} (${percent}%)`;
      })
      .join(', ');

    // Active Goals
    const activeGoals = goals
      .filter(g => g.status === 'Em andamento')
      .map(g => `${g.name} (Meta: R$ ${g.targetValue}, Atual: R$ ${g.currentValue})`)
      .join(', ');

    // Upcoming Debts (Next 7 days)
    const nextWeek = new Date();
    nextWeek.setDate(today.getDate() + 7);

    // Adjusted for correct Debt interface props
    const upcomingDebts = debts
      .filter(d => {
        if (!d.dueDate) return false;
        const dueDate = new Date(d.dueDate);
        return dueDate >= today && dueDate <= nextWeek;
      })
      .map(d => `${d.name} (Vence ${new Date(d.dueDate!).toLocaleDateString()}, R$ ${d.totalAmount})`)
      .join(', ');

    // Investments Total
    const totalInvested = investments.reduce((acc, inv) => acc + (inv.currentValue || inv.amount), 0);
    const investmentBreakdown = investments.map(i => `${i.name} (${i.type}): R$ ${i.currentValue || i.amount}`).join(', ');

    // Recurring Expenses for AI Context
    const recurringTxs = transactions.filter(t => t.type === 'expense' && t.isRecurring);
    const recurringList = recurringTxs.map(t => `${t.description} (R$ ${t.amount})`).join(', ');
    const totalRecurring = recurringTxs.reduce((acc, t) => acc + t.amount, 0);

    return {
      balance: (income - expenses).toFixed(2),
      income: income.toFixed(2),
      expenses: expenses.toFixed(2),
      topCategories: topCategories || 'Nenhuma despesa este mês',
      goal: activeGoals || 'Nenhuma meta definida',
      debts: upcomingDebts || 'Nenhuma conta vencendo nos próximos 7 dias',
      investments: `Total: R$ ${totalInvested.toFixed(2)}. Detalhes: ${investmentBreakdown || 'Nenhum'}`,
      recurringExpenses: recurringList || 'Nenhuma assinatura/conta fixa identificada',
      totalRecurring: totalRecurring.toFixed(2)
    };
  }

  // ─── TELEGRAM INTEGRATION ─────────────────────────────────────────────

  /** Gera um código único de 6 chars para vincular a conta do Telegram */
  static async generateTelegramLinkCode(userId: string): Promise<string> {
    // Gerar código alfanumérico legível: FP-XXXXXX
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // sem 0/O/1/I para evitar confusão
    let code = 'FP-';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }

    // Invalidar códigos antigos do mesmo usuário antes de criar novo
    await supabase
      .from('telegram_link_codes')
      .update({ used: true })
      .eq('user_id', userId)
      .eq('used', false);

    // Inserir novo código (expira em 10 minutos)
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from('telegram_link_codes')
      .insert({ code, user_id: userId, expires_at: expiresAt, used: false });

    if (error) throw new Error(error.message);
    return code;
  }

  /** Verifica se o usuário tem uma conta do Telegram vinculada */
  static async getTelegramLinkStatus(userId: string): Promise<{ linked: boolean; username?: string; linkedAt?: string }> {
    const { data } = await supabase
      .from('telegram_links')
      .select('telegram_username, linked_at')
      .eq('user_id', userId)
      .single();

    if (!data) return { linked: false };
    return { linked: true, username: data.telegram_username, linkedAt: data.linked_at };
  }

  /** Remove o vínculo Telegram do usuário */
  static async unlinkTelegram(userId: string): Promise<void> {
    const { error } = await supabase
      .from('telegram_links')
      .delete()
      .eq('user_id', userId);
    if (error) throw new Error(error.message);
  }

  // --- BANK ACCOUNTS OPERATIONS ---

  /**
   * Busca todas as contas bancárias do usuário com saldo calculado.
   * currentBalance = initialBalance + soma de receitas vinculadas - soma de despesas vinculadas.
   */
  static async getBankAccounts(userId: string): Promise<BankAccount[]> {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      // Fallback local
      const localData = localStorage.getItem(`fp360_bank_accounts_${userId}`);
      if (localData) return JSON.parse(localData);
      return [];
    }

    const accounts: BankAccount[] = data.map((a: any) => ({
      id: a.id,
      userId: a.user_id,
      name: a.name,
      initialBalance: parseFloat(a.initial_balance),
      color: a.color,
      icon: a.icon,
      createdAt: a.created_at,
    }));

    // Calcular saldo atual para cada conta com base nas transações vinculadas
    const { data: txData } = await supabase
      .from('transactions')
      .select('bank_account_id, amount, type')
      .eq('user_id', userId)
      .not('bank_account_id', 'is', null);

    const txList = txData || [];

    return accounts.map(account => {
      const linked = txList.filter((t: any) => t.bank_account_id === account.id);
      const delta = linked.reduce((sum: number, t: any) => {
        return sum + (t.type === 'income' ? parseFloat(t.amount) : -parseFloat(t.amount));
      }, 0);
      return { ...account, currentBalance: account.initialBalance + delta };
    });
  }

  /** Cria ou atualiza uma conta bancária */
  static async saveBankAccount(account: BankAccount): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error('Usuário não autenticado');

    const payload = {
      id: account.id,
      user_id: user.id,
      name: account.name,
      initial_balance: account.initialBalance,
      color: account.color,
      icon: account.icon,
    };

    const { error } = await supabase.from('bank_accounts').upsert(payload);

    if (error) {
      // Fallback local
      const current = await this.getBankAccounts(user.id);
      const idx = current.findIndex(a => a.id === account.id);
      if (idx >= 0) current[idx] = account;
      else current.push(account);
      localStorage.setItem(`fp360_bank_accounts_${user.id}`, JSON.stringify(current));
    }
  }

  /** Remove uma conta bancária (transações são desvinculadas via ON DELETE SET NULL) */
  static async deleteBankAccount(id: string): Promise<void> {
    const { error } = await supabase.from('bank_accounts').delete().eq('id', id);
    if (error) {
      const user = await this.getCurrentUser();
      if (user) {
        const current = await this.getBankAccounts(user.id);
        const filtered = current.filter(a => a.id !== id);
        localStorage.setItem(`fp360_bank_accounts_${user.id}`, JSON.stringify(filtered));
      }
    }
  }
}
