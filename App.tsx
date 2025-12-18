import React, { useState, useEffect } from 'react';
import { Transaction, Goal, AppConfig, FilterState, Tab, Debt } from './types';
import { DEFAULT_CONFIG, MONTH_NAMES } from './constants';
import { Dashboard } from './components/Dashboard';
import { SheetView } from './components/SheetView';
import { CreditCardControl } from './components/CreditCardControl'; 
import { GoalsSheet } from './components/GoalsSheet';
import { Settings } from './components/Settings';
import { AdminPanel } from './components/AdminPanel';
import { Investments } from './components/Investments';
import { Courses } from './components/Courses';
import { Debts } from './components/Debts';
import { Login } from './components/Login';
import { Toast } from './components/Toast';
import { Inbox } from './components/Inbox';
import { Tutorial } from './components/Tutorial';
import { FilterBar } from './components/FilterBar';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { CalculatorModal } from './components/CalculatorModal';
import { Logo } from './components/Logo';
import { DBService } from './db';
import { supabase } from './supabaseClient';
import { LayoutDashboard, CreditCard, TrendingUp, Target, Settings as SettingsIcon, Menu, Filter, LogOut, Loader2, ShieldCheck, Mail, Sun, Moon, X, BarChart4, GraduationCap, Scale, Calculator, List, TableProperties, AlertTriangle, RefreshCw, Plus } from 'lucide-react';

const TAB_METADATA: Record<Tab, { label: string; pageTitle: string; icon: React.ReactNode }> = {
    controle: { label: 'Controle', pageTitle: 'Painel de Controle', icon: <LayoutDashboard size={20} /> },
    receitas: { label: 'Receitas', pageTitle: 'Gerenciar Receitas', icon: <TrendingUp size={20} /> },
    despesas: { label: 'Despesas', pageTitle: 'Gerenciar Despesas', icon: <CreditCard size={20} /> },
    dividas: { label: 'Dívidas', pageTitle: 'Gestão de Passivos', icon: <Scale size={20} /> },
    metas: { label: 'Metas', pageTitle: 'Metas Financeiras', icon: <Target size={20} /> },
    investimentos: { label: 'Investimentos', pageTitle: 'Central de Investimentos', icon: <BarChart4 size={20} /> },
    cursos: { label: 'Cursos (Em Construção)', pageTitle: 'Educação Financeira', icon: <GraduationCap size={20} /> },
    config: { label: 'Configurações', pageTitle: 'Ajustes do Sistema', icon: <SettingsIcon size={20} /> },
    admin: { label: 'Administração', pageTitle: 'Painel Administrativo', icon: <ShieldCheck size={20} /> }
};

interface FinanceAppProps {
  user: string;
  onLogout: () => void;
  isEmailConfirmed?: boolean;
}

const FinanceApp: React.FC<FinanceAppProps> = ({ user, onLogout, isEmailConfirmed }) => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [activeTab, setActiveTab] = useState<Tab>('controle');
  const [expenseSubTab, setExpenseSubTab] = useState<'general' | 'cards'>('general');
  const [loading, setLoading] = useState(true);
  const [dataError, setDataError] = useState<string | null>(null);
  const [contentLoading, setContentLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [debts, setDebts] = useState<Debt[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<{label: string, fn: () => void} | undefined>(undefined);
  const [showInbox, setShowInbox] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [showCalculator, setOfCalculator] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showCalculatorModal, setShowCalculatorModal] = useState(false);
  const [filter, setFilter] = useState<FilterState>({
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      category: 'Todas',
      paymentMethod: 'Todas'
  });

  const fetchData = async () => {
      setLoading(true);
      setDataError(null);
      try {
          const currentUser = await DBService.getCurrentUser();
          if (currentUser) {
              setUserEmail(currentUser.email || '');
              const adminEmails = ['admin@finance360.com', 'thiago@finance360.com', 'tsngti@gmail.com'];
              if (currentUser.email && adminEmails.includes(currentUser.email)) setIsAdmin(true);
          }
          const [txs, gls, cfg] = await Promise.all([DBService.getTransactions(user), DBService.getGoals(user), DBService.getConfig(user)]);
          setTransactions(txs);
          setGoals(gls);
          const mergedConfig = { ...DEFAULT_CONFIG, ...cfg, userId: user };
          setConfig(mergedConfig);
          checkUnreadMessages();
          if (!isAdmin && mergedConfig.hasSeenTutorial === false) setTimeout(() => setShowTutorial(true), 500);
      } catch (error: any) {
          setDataError("Não conseguimos sincronizar seus dados. Tente atualizar a página em alguns segundos.");
      } finally {
          setLoading(false);
      }
  };

  useEffect(() => { fetchData(); }, [user]);
  useEffect(() => { if (isEmailConfirmed) setToastMessage("E-mail confirmado com sucesso!"); }, [isEmailConfirmed]);
  useEffect(() => {
    if (config.theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [config.theme]);

  useEffect(() => {
    const interval = setInterval(checkUnreadMessages, 15000); 
    return () => clearInterval(interval);
  }, [user]);

  const checkUnreadMessages = async () => {
      try {
          const msgs = await DBService.getMessagesForUser(user);
          setUnreadMessages(msgs.filter(m => !m.read).length);
      } catch (e) {}
  };

  const handleTabChange = async (tab: Tab) => {
    if (tab === activeTab) return;
    setIsMobileMenuOpen(false);
    setContentLoading(true);
    setActiveTab(tab);
    try {
        const minLoadTime = new Promise(resolve => setTimeout(resolve, 400));
        const dataPromises: Promise<any>[] = [minLoadTime];
        if (tab === 'controle' || tab === 'receitas' || tab === 'despesas') dataPromises.push(DBService.getTransactions(user).then(setTransactions));
        else if (tab === 'metas') dataPromises.push(DBService.getGoals(user).then(setGoals));
        else if (tab === 'dividas') dataPromises.push(DBService.getDebts(user).then(setDebts));
        else if (tab === 'config') dataPromises.push(DBService.getConfig(user).then((cfg) => setConfig({ ...DEFAULT_CONFIG, ...cfg, userId: user })));
        await Promise.all(dataPromises);
        if (tab === 'metas') {
            const newConfig = { ...config, lastSeenGoals: new Date().toISOString() };
            setConfig(newConfig);
            await DBService.saveConfig(newConfig);
        }
    } catch (error) {} finally { setContentLoading(false); }
  };

  const addTransaction = async (t: Transaction) => { const tWithUser = { ...t, userId: user }; await DBService.addTransaction(tWithUser); setTransactions(prev => [...prev, tWithUser]); };
  const updateTransaction = async (t: Transaction) => { const tWithUser = { ...t, userId: user }; await DBService.addTransaction(tWithUser); setTransactions(prev => prev.map(x => x.id === t.id ? tWithUser : x)); };
  const deleteTransaction = async (id: string) => { await DBService.deleteTransaction(id); setTransactions(prev => prev.filter(x => x.id !== id)); };
  const addGoal = async (g: Goal) => { const gWithUser = { ...g, userId: user }; await DBService.saveGoal(gWithUser); setGoals(prev => [...prev, gWithUser]); };
  const deleteGoal = async (id: string) => { await DBService.deleteGoal(id); setGoals(prev => prev.filter(x => x.id !== id)); };
  const updateGoalValue = async (id: string, val: number) => {
      const goal = goals.find(g => g.id === id);
      if (goal) {
          const updatedGoal = { ...goal, currentValue: val };
          await DBService.saveGoal(updatedGoal);
          setGoals(prev => prev.map(x => x.id === id ? updatedGoal : x));
      }
  };
  const addDebt = async (d: Debt) => { const dWithUser = { ...d, userId: user }; await DBService.saveDebt(dWithUser); setDebts(prev => [...prev, dWithUser]); };
  const deleteDebt = async (id: string) => { await DBService.deleteDebt(id); setDebts(prev => prev.filter(d => d.id !== id)); };
  const updateConfig = async (newConfig: AppConfig) => { const configWithUser = { ...newConfig, userId: user }; await DBService.saveConfig(configWithUser); setConfig(configWithUser); };
  const handleTutorialComplete = async () => { setShowTutorial(false); const newConfig = { ...config, hasSeenTutorial: true }; setConfig(newConfig); await updateConfig(newConfig); };

  // Fix: Add missing handleTutorialStepChange function
  const handleTutorialStepChange = (tab: Tab) => {
      setActiveTab(tab);
  };

  const handleOpenGoalFormShortcut = () => {
      handleTabChange('metas');
      // Pequeno delay para garantir que a tab carregou antes de disparar o comando visual (se houver um componente de form específico)
      setToastMessage("Abra a aba Metas para criar seu novo objetivo financeiro!");
  };

  if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#f3f4f6] dark:bg-slate-950 transition-colors"><Loader2 className="animate-spin text-brand-blue" size={48} /></div>;

  return (
    <div className="flex h-screen bg-[#f3f4f6] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden transition-colors">
      <aside className="w-64 bg-brand-blue text-white flex flex-col shadow-xl z-20 hidden md:flex border-r border-slate-800/50">
        <div className="p-6 border-b border-white/10"><Logo className="w-9 h-9" textClassName="text-white" /></div>
        <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
            {(['controle', 'receitas', 'despesas', 'dividas', 'metas', 'investimentos', 'cursos', 'config'] as Tab[]).concat(isAdmin ? ['admin'] : []).map(tabId => (
                <button key={tabId} onClick={() => handleTabChange(tabId)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tabId ? 'bg-brand-gold text-white shadow-lg font-bold' : 'text-slate-300 hover:bg-white/10'}`}>
                    {TAB_METADATA[tabId].icon}{TAB_METADATA[tabId].label}
                </button>
            ))}
        </nav>
        <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
            <div className="flex items-center gap-2"><div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold">{(userEmail || 'U').substring(0, 2).toUpperCase()}</div><span className="text-xs truncate max-w-[80px]">{userEmail}</span></div>
            <button onClick={onLogout} className="text-slate-400 hover:text-rose-400"><LogOut size={18} /></button>
        </div>
      </aside>

      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden"><div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div><aside className="relative w-64 bg-brand-blue text-white flex flex-col shadow-2xl h-full animate-fade-in border-r border-white/10"><div className="p-6 border-b border-white/10 flex justify-between items-center"><Logo className="w-8 h-8" textClassName="text-white" /><button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400"><X size={20} /></button></div><nav className="flex-1 px-4 mt-4 overflow-y-auto">{(['controle', 'receitas', 'despesas', 'dividas', 'metas', 'investimentos', 'config'] as Tab[]).map(tabId => (<button key={tabId} onClick={() => handleTabChange(tabId)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tabId ? 'bg-brand-gold text-white' : 'text-slate-300'}`}>{TAB_METADATA[tabId].icon}{TAB_METADATA[tabId].label}</button>))}</nav></aside></div>
      )}

      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        <header className="bg-white dark:bg-slate-900 h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 transition-colors">
            <div className="flex items-center gap-4"><button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-500 hover:bg-slate-100 p-2 rounded-lg"><Menu /></button><h2 className="text-lg font-semibold dark:text-white">{TAB_METADATA[activeTab].pageTitle}</h2></div>
            <div className="flex items-center gap-2 sm:gap-4"><div className="hidden sm:block"><FilterBar filter={filter} setFilter={setFilter} activeTab={activeTab} config={config} /></div><button onClick={() => updateConfig({...config, theme: config.theme === 'dark' ? 'light' : 'dark'})} className="p-2 text-slate-500 dark:hover:bg-slate-800 rounded-full transition-colors">{config.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button><button onClick={() => setShowCalculatorModal(true)} className="p-2 text-slate-500 dark:hover:bg-slate-800 rounded-full transition-colors"><Calculator size={20} /></button><button onClick={() => setShowInbox(true)} className="relative p-2 text-slate-500 dark:hover:bg-slate-800 rounded-full transition-colors"><Mail size={20} />{unreadMessages > 0 && <span className="absolute top-1 right-1 w-3 h-3 bg-brand-gold rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>}</button></div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar mb-16 md:mb-0 relative">
            {contentLoading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-20"><Loader2 size={40} className="animate-spin text-brand-gold mb-3" /><p className="text-sm font-medium animate-pulse">Carregando...</p></div>}
            <div className={`transition-opacity duration-300 ${contentLoading ? 'opacity-40' : 'opacity-100'}`}>
                {activeTab === 'controle' && <Dashboard transactions={transactions} goals={goals} filter={filter} currency={config.currency} />}
                {activeTab === 'receitas' && <SheetView type="income" transactions={transactions} categories={config.categories} paymentMethods={config.paymentMethods} onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} currency={config.currency} />}
                {activeTab === 'despesas' && (<>{/* ... subtabs despesas ... */}{expenseSubTab === 'general' ? <SheetView type="expense" transactions={transactions} categories={config.categories} paymentMethods={config.paymentMethods} onAdd={addTransaction} onUpdate={updateTransaction} onDelete={deleteTransaction} currency={config.currency} /> : <CreditCardControl transactions={transactions} onDelete={deleteTransaction} onAdd={addTransaction} categories={config.categories} currency={config.currency} />}</>)}
                {activeTab === 'dividas' && <Debts config={config} debts={debts} onAddDebt={addDebt} onDeleteDebt={deleteDebt} onNavigateToSettings={() => handleTabChange('config')} />}
                {activeTab === 'metas' && <GoalsSheet goals={goals} onAdd={addGoal} onDelete={deleteGoal} onUpdate={updateGoalValue} currency={config.currency} />}
                {activeTab === 'investimentos' && <Investments config={config} onNavigateToSettings={() => handleTabChange('config')} />}
                {activeTab === 'cursos' && <Courses config={config} onNavigateToSettings={() => handleTabChange('config')} />}
                {activeTab === 'config' && <Settings config={config} onUpdateConfig={updateConfig} transactions={transactions} />}
                {activeTab === 'admin' && isAdmin && <AdminPanel />}
            </div>
        </div>

        {/* Global Floating Action Button for Goals/Actions */}
        <button 
            onClick={handleOpenGoalFormShortcut}
            className="fixed bottom-24 right-6 md:bottom-8 md:right-8 w-14 h-14 bg-brand-gold text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-all z-40 border-4 border-white dark:border-slate-800"
            title="Nova Meta Financeira"
        >
            <Plus size={28} />
        </button>

        <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 flex justify-around items-center pb-safe pt-1 shadow-lg">
            {(['controle', 'receitas', 'despesas', 'dividas', 'config'] as Tab[]).map(t => (<button key={t} onClick={() => handleTabChange(t)} className={`flex flex-col items-center justify-center p-2 w-full ${activeTab === t ? 'text-brand-blue dark:text-brand-gold' : 'text-slate-400'}`}>{TAB_METADATA[t].icon}<span className="text-[10px] mt-1 font-medium">{TAB_METADATA[t].label}</span></button>))}
        </nav>
        {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} actionLabel={toastAction?.label} onAction={toastAction?.fn} />}
        {showTutorial && <Tutorial onComplete={handleTutorialComplete} onStepChange={handleTutorialStepChange} />}
        <Inbox userId={user} isOpen={showInbox} onClose={() => setShowInbox(false)} onUpdateUnread={checkUnreadMessages} />
        <CalculatorModal isOpen={showCalculatorModal} onClose={() => setShowCalculatorModal(false)} />
      </main>
    </div>
  );
};

const App: React.FC = () => {
    const [user, setUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        const checkSession = async () => { try { const u = await DBService.getCurrentUser(); if (u) setUser(u.id); } catch (e) {} finally { setLoading(false); } };
        checkSession();
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => { if (session?.user) setUser(session.user.id); else setUser(null); setLoading(false); });
        return () => subscription.unsubscribe();
    }, []);
    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#f3f4f6] dark:bg-slate-950 transition-colors"><Loader2 className="animate-spin text-blue-600" size={48} /></div>;
    if (!user) return <Login onLogin={(userId) => setUser(userId)} />;
    return <FinanceApp user={user} onLogout={() => DBService.logout().then(() => setUser(null))} />;
};

export default App;