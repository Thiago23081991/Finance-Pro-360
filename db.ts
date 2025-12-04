
import { Transaction, Goal, AppConfig, UserAccount, PurchaseRequest, AdminMessage, SystemStats, UserProfile } from "./types";
import { DEFAULT_CONFIG } from "./constants";
import { supabase } from "./supabaseClient";

// O Supabase substitui o IndexedDB.
// Mantemos a classe DBService como fachada para facilitar a migração.

export class DBService {

  // --- AUTH OPERATIONS ---

  static async registerUser(user: UserAccount): Promise<any> {
    // 1. Criar usuário no Auth do Supabase
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: user.username, // Username tratado como email
      password: user.password,
    });

    if (authError) throw new Error(authError.message);
    
    // Retornar dados completos para o frontend decidir se precisa de confirmação de email
    return authData;
  }

  static async loginUser(username: string, password: string): Promise<any> {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: username,
      password: password,
    });

    if (error) {
        // Lançar o erro real para que a UI possa mostrar "Email não confirmado" ou "Senha inválida"
        throw new Error(error.message);
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
    // Nota: Em produção, o Supabase usa email para reset. 
    // Como estamos usando a lógica de "Chave Mestra" do Admin para forçar o reset:
    // O admin precisaria usar a API de Admin do Supabase (service_role) para alterar senha de outros,
    // o que não é seguro expor no frontend.
    // Para este caso específico, vamos permitir que o PRÓPRIO usuário logado mude sua senha.
    
    const { error } = await supabase.auth.updateUser({ password: newPass });
    if (error) throw new Error(error.message);
  }

  // --- DATA OPERATIONS ---

  static async getTransactions(userId: string): Promise<Transaction[]> {
    // userId no Supabase é o UUID do Auth. O parametro 'userId' vindo do App.tsx deve ser ignorado 
    // em favor do auth.uid() real, mas o RLS já garante isso.
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    // Mapear snake_case (DB) para camelCase (App)
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
    // Verifica se é update ou insert
    // Supabase 'upsert' funciona bem se tiver ID.
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Usuário não autenticado");

    const payload = {
      id: t.id, // Se for novo e gerado no front, ok. Se nao, o Supabase gera.
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

  static async getConfig(userId: string): Promise<AppConfig> {
    // Busca perfil. userId parametro é legacy, usamos auth.
    const user = await this.getCurrentUser();
    if (!user) return DEFAULT_CONFIG;

    const { data, error } = await supabase.from('profiles').select('*').eq('id', user.id).maybeSingle();

    if (!data) {
      // SELF-HEALING: Se o usuário existe no Auth mas não tem perfil (ex: erro no registro ou DB não criado na hora), cria agora.
      console.log("Perfil não encontrado. Tentando criar perfil padrão...");
      const { error: insertError } = await supabase.from('profiles').insert({
        id: user.id,
        email: user.email,
        username: user.email?.split('@')[0] || 'User',
        theme: 'light',
        categories: DEFAULT_CONFIG.categories,
        payment_methods: DEFAULT_CONFIG.paymentMethods,
        enable_reminders: true,
        has_seen_tutorial: false
      });
      
      if (!insertError) {
          return { ...DEFAULT_CONFIG, userId: user.id };
      }
      
      console.error("Erro fatal ao criar perfil:", insertError);
      return { ...DEFAULT_CONFIG, userId: user.id };
    }

    return {
      userId: data.id,
      theme: data.theme as 'light' | 'dark',
      categories: data.categories || DEFAULT_CONFIG.categories,
      paymentMethods: data.payment_methods || DEFAULT_CONFIG.paymentMethods,
      enableReminders: data.enable_reminders,
      reminderFrequency: data.reminder_frequency,
      lastSeenGoals: data.last_seen_goals,
      hasSeenTutorial: data.has_seen_tutorial,
      licenseKey: data.license_key,
      licenseStatus: data.license_status
    };
  }

  static async saveConfig(config: AppConfig): Promise<void> {
    const user = await this.getCurrentUser();
    if (!user) return;

    const payload = {
      id: user.id,
      theme: config.theme,
      categories: config.categories,
      payment_methods: config.paymentMethods,
      enable_reminders: config.enableReminders,
      reminder_frequency: config.reminderFrequency,
      last_seen_goals: config.lastSeenGoals,
      has_seen_tutorial: config.hasSeenTutorial,
      license_key: config.licenseKey,
      license_status: config.licenseStatus
    };

    const { error } = await supabase.from('profiles').upsert(payload);
    if (error) console.error("Erro ao salvar config", error);
  }

  // --- BACKUP OPERATIONS ---

  static async createBackup(): Promise<string> {
    const user = await this.getCurrentUser();
    if (!user) throw new Error("Não logado");

    const [txs, goals, profile, reqs, msgs] = await Promise.all([
      supabase.from('transactions').select('*'),
      supabase.from('goals').select('*'),
      supabase.from('profiles').select('*').eq('id', user.id).single(),
      supabase.from('purchase_requests').select('*'),
      supabase.from('messages').select('*').or(`receiver.eq.${user.id},sender.eq.Admin`) 
    ]);

    const backup = {
      transactions: txs.data,
      goals: goals.data,
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

    // Restaurar Transações
    if (data.transactions && data.transactions.length > 0) {
       const cleanTxs = data.transactions.map((t: any) => ({
         ...t, user_id: user.id // Força propriedade do usuário atual
       }));
       await supabase.from('transactions').upsert(cleanTxs);
    }
    
    // Restaurar Metas
    if (data.goals && data.goals.length > 0) {
       const cleanGoals = data.goals.map((g: any) => ({
         ...g, user_id: user.id
       }));
       await supabase.from('goals').upsert(cleanGoals);
    }

    // Configs - Apenas update
    if (data.configs && data.configs.length > 0) {
       // Pega o primeiro config compatível
       const cfg = data.configs[0];
       delete cfg.id; // Não sobrescrever ID
       await supabase.from('profiles').update(cfg).eq('id', user.id);
    }
  }

  // --- ADMIN OPERATIONS ---

  static async getSystemStats(): Promise<SystemStats> {
    // Nota: count('exact') pode ser lento em tabelas gigantes, mas ok para este escopo
    const { count: usersCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
    const { count: txCount } = await supabase.from('transactions').select('*', { count: 'exact', head: true });
    
    // Soma de volumes (requer query real)
    const { data: volData } = await supabase.from('transactions').select('amount');
    const totalVol = volData ? volData.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0) : 0;
    
    // Licenças ativas
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
          email: p.email,
          username: p.username,
          licenseStatus: p.license_status,
          createdAt: p.created_at
      }));
  }

  static async getPurchaseRequest(userId: string): Promise<PurchaseRequest | null> {
    // userId aqui pode ser o UUID do user
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
      receiver: msg.receiver, // UUID do destinatário
      content: msg.content,
      read: msg.read,
      timestamp: msg.timestamp
    };
    const { error } = await supabase.from('messages').insert(payload);
    if (error) throw new Error(error.message);
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
