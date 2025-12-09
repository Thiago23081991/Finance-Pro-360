
import React, { useState, useEffect } from 'react';
import { Transaction, Goal, AppConfig, FilterState } from './types';
import { DEFAULT_CONFIG, MONTH_NAMES } from './constants';
import { Dashboard } from './components/Dashboard';
import { SheetView } from './components/SheetView';
import { GoalsSheet } from './components/GoalsSheet';
import { Settings } from './components/Settings';
import { AdminPanel } from './components/AdminPanel';
import { Login } from './components/Login';
import { Toast } from './components/Toast';
import { Inbox } from './components/Inbox';
import { Tutorial, TutorialStepTarget } from './components/Tutorial';
import { DBService } from './db';
import { supabase } from './supabaseClient';
import { LayoutDashboard, CreditCard, TrendingUp, Target, Settings as SettingsIcon, Menu, Filter, LogOut, Loader2, ShieldCheck, Mail, Sun, Moon, X, Home } from 'lucide-react';

type Tab = 'controle' | 'receitas' | 'despesas' | 'metas' | 'config' | 'admin';

interface FinanceAppProps {
  user: string;
  onLogout: () => void;
  isEmailConfirmed?: boolean;
}

// --- Authenticated Application Component ---
const FinanceApp: React.FC<FinanceAppProps> = ({ user, onLogout, isEmailConfirmed }) => {
  
  // Define admin logic based on Email (Supabase)
  const [isAdmin, setIsAdmin] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  // State Management
  const [activeTab, setActiveTab] = useState<Tab>('controle');
  const [loading, setLoading] = useState(true);
  // New state for tab content loading
  const [contentLoading, setContentLoading] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<{label: string, fn: () => void} | undefined>(undefined);

  // Inbox State
  const [showInbox, setShowInbox] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);

  // Filter State
  const [filter, setFilter] = useState<FilterState>({
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      category: 'Todas',
      paymentMethod: 'Todas'
  });

  // Handle Email Confirmation Toast
  useEffect(() => {
    if (isEmailConfirmed) {
        setToastMessage("E-mail confirmado com sucesso! Seja bem-vindo.");
    }
  }, [isEmailConfirmed]);

  // Initial Data Fetch from Database
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            const currentUser = await DBService.getCurrentUser();
            if (currentUser) {
                setUserEmail(currentUser.email || '');
                // Check admin list
                const adminEmails = [
                    'admin@finance360.com', 
                    'thiago@finance360.com', 
                    'tsngti@gmail.com'
                ];
                
                if (currentUser.email && adminEmails.includes(currentUser.email)) {
                    setIsAdmin(true);
                }
            }

            const [txs, gls, cfg] = await Promise.all([
                DBService.getTransactions(user),
                DBService.getGoals(user),
                DBService.getConfig(user)
            ]);
            
            setTransactions(txs);
            setGoals(gls);
            
            const mergedConfig = { ...DEFAULT_CONFIG, ...cfg, userId: user };
            setConfig(mergedConfig);

            checkUnreadMessages();

            if (!isAdmin && mergedConfig.hasSeenTutorial === false) {
                setTimeout(() => setShowTutorial(true), 500);
            }

        } catch (error) {
            console.error("Failed to load data from Supabase", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [user]); // user is the UUID from supabase

  // Apply Theme Effect
  useEffect(() => {
    if (config.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [config.theme]);

  // Poll for unread messages periodically
  useEffect(() => {
    const interval = setInterval(checkUnreadMessages, 15000); 
    return () => clearInterval(interval);
  }, [user]);

  const checkUnreadMessages = async () => {
      try {
          const msgs = await DBService.getMessagesForUser(user);
          const unreadCount = msgs.filter(m => !m.read).length;
          setUnreadMessages(unreadCount);
      } catch (e) {
          console.error("Error checking messages", e);
      }
  };

  // Reminder Logic
  useEffect(() => {
      if (!loading && config.enableReminders && !showTutorial && !isAdmin) {
          const lastSeen = config.lastSeenGoals ? new Date(config.lastSeenGoals) : new Date(0);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - lastSeen.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          let thresholdDays = 7; 
          if (config.reminderFrequency === 'biweekly') thresholdDays = 15;
          if (config.reminderFrequency === 'monthly') thresholdDays = 30;

          if (diffDays > thresholdDays) {
              const timer = setTimeout(() => {
                  setToastMessage("Faz um tempo que você não atualiza suas metas. Que tal conferir seu progresso hoje?");
                  setToastAction({
                      label: "Ver Metas",
                      fn: () => handleTabChange('metas')
                  });
              }, 3000);
              return () => clearTimeout(timer);
          }
      }
  }, [loading, config.enableReminders, config.reminderFrequency, showTutorial, isAdmin, config.lastSeenGoals]);

  const handleTabChange = async (tab: Tab) => {
    if (tab === activeTab) return;
    
    setIsMobileMenuOpen(false); // Close mobile menu on navigation
    setContentLoading(true); // Start loading visual
    setActiveTab(tab);
    
    // Smooth Transition + Data Refresh Logic
    // This ensures data is fresh when switching context
    try {
        const minLoadTime = new Promise(resolve => setTimeout(resolve, 400)); // Min 400ms for visual smoothness
        
        const dataPromises: Promise<any>[] = [minLoadTime];

        if (tab === 'controle' || tab === 'receitas' || tab === 'despesas') {
             dataPromises.push(DBService.getTransactions(user).then(setTransactions));
        } else if (tab === 'metas') {
             dataPromises.push(DBService.getGoals(user).then(setGoals));
        } else if (tab === 'config') {
             dataPromises.push(DBService.getConfig(user).then((cfg) => setConfig({ ...DEFAULT_CONFIG, ...cfg, userId: user })));
        }

        await Promise.all(dataPromises);

        if (tab === 'metas') {
            const now = new Date().toISOString();
            const newConfig = { ...config, lastSeenGoals: now };
            setConfig(newConfig);
            await DBService.saveConfig(newConfig);
            
            if (toastMessage && toastMessage.includes("metas")) {
                setToastMessage(null);
            }
        }
    } catch (error) {
        console.error("Error refreshing data on tab change", error);
    } finally {
        setContentLoading(false);
    }
  };

  const addTransaction = async (t: Transaction) => {
      const tWithUser = { ...t, userId: user };
      await DBService.addTransaction(tWithUser);
      // Refresh to ensure ID consistency if needed, but local push is faster
      setTransactions(prev => [...prev, tWithUser]);
  };

  const updateTransaction = async (t: Transaction) => {
      const tWithUser = { ...t, userId: user };
      await DBService.addTransaction(tWithUser);
      setTransactions(prev => prev.map(x => x.id === t.id ? tWithUser : x));
  };

  const deleteTransaction = async (id: string) => {
      await DBService.deleteTransaction(id);
      setTransactions(prev => prev.filter(x => x.id !== id));
  };
  
  const addGoal = async (g: Goal) => {
      const gWithUser = { ...g, userId: user };
      await DBService.saveGoal(gWithUser);
      setGoals(prev => [...prev, gWithUser]);
  };

  const deleteGoal = async (id: string) => {
      await DBService.deleteGoal(id);
      setGoals(prev => prev.filter(x => x.id !== id));
  };

  const updateGoalValue = async (id: string, val: number) => {
      const goal = goals.find(g => g.id === id);
      if (goal) {
          const updatedGoal = { ...goal, currentValue: val };
          await DBService.saveGoal(updatedGoal);
          setGoals(prev => prev.map(x => x.id === id ? updatedGoal : x));
      }
  };

  const updateConfig = async (newConfig: AppConfig) => {
      const configWithUser = { ...newConfig, userId: user };
      await DBService.saveConfig(configWithUser);
      setConfig(configWithUser);
  };

  const handleTutorialComplete = async () => {
      setShowTutorial(false);
      const newConfig = { ...config, hasSeenTutorial: true };
      setConfig(newConfig);
      await updateConfig(newConfig);
  };

  const handleTutorialStepChange = (target: TutorialStepTarget) => {
      setActiveTab(target as Tab);
  };

  // Helper for page titles
  const getPageTitle = (tab: Tab) => {
    switch (tab) {
        case 'controle': return 'Controle'; // Aba 1 - CON
        case 'config': return 'Configurações';
        case 'admin': return 'Painel Admin';
        default: return tab.charAt(0).toUpperCase() + tab.slice(1);
    }
  };

  // Sidebar Menu
  let menuItems = [
      { id: 'controle', label: 'Controle', icon: <LayoutDashboard size={20} /> },
      { id: 'receitas', label: 'Receitas', icon: <TrendingUp size={20} /> },
      { id: 'despesas', label: 'Despesas', icon: <CreditCard size={20} /> },
      { id: 'metas', label: 'Metas', icon: <Target size={20} /> },
      { id: 'config', label: 'Configurações', icon: <SettingsIcon size={20} /> },
  ];

  if (isAdmin) {
      menuItems.push({ id: 'admin', label: 'Administração', icon: <ShieldCheck size={20} /> });
  }

  // Filter Component
  const FilterBar = () => (
      <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 shadow-sm transition-colors">
              <Filter size={14} className="text-slate-400 dark:text-slate-500 mr-2"/>
              <select 
                value={filter.month} 
                onChange={e => setFilter({...filter, month: parseInt(e.target.value)})}
                className="bg-transparent outline-none text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
              >
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i} className="dark:bg-slate-800">{m}</option>)}
              </select>
              <span className="mx-2 text-slate-300 dark:text-slate-600">|</span>
              <select 
                value={filter.year} 
                onChange={e => setFilter({...filter, year: parseInt(e.target.value)})}
                className="bg-transparent outline-none text-slate-700 dark:text-slate-200 font-medium cursor-pointer"
              >
                  {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y} className="dark:bg-slate-800">{y}</option>)}
              </select>
          </div>
          
          {activeTab === 'controle' && (
            <>
                <select 
                    value={filter.category} 
                    onChange={e => setFilter({...filter, category: e.target.value})}
                    className="bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 shadow-sm outline-none text-slate-700 dark:text-slate-200 text-sm cursor-pointer hidden md:block transition-colors"
                >
                    <option value="Todas" className="dark:bg-slate-800">Todas Categorias</option>
                    {config.categories.map(c => <option key={c} value={c} className="dark:bg-slate-800">{c}</option>)}
                </select>
                 <select 
                    value={filter.paymentMethod} 
                    onChange={e => setFilter({...filter, paymentMethod: e.target.value})}
                    className="bg-white dark:bg-slate-800 rounded-md border border-slate-300 dark:border-slate-600 px-3 py-1.5 shadow-sm outline-none text-slate-700 dark:text-slate-200 text-sm cursor-pointer hidden md:block transition-colors"
                >
                    <option value="Todas" className="dark:bg-slate-800">Todos Pagamentos</option>
                    {config.paymentMethods.map(c => <option key={c} value={c} className="dark:bg-slate-800">{c}</option>)}
                </select>
            </>
          )}
      </div>
  );

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-[#f3f4f6] dark:bg-slate-950 transition-colors">
              <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-emerald-600" size={48} />
                  <p className="text-slate-500 dark:text-slate-400 font-medium animate-pulse">Sincronizando dados...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6] dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans overflow-hidden transition-colors">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20 hidden md:flex border-r border-slate-800 dark:border-slate-800">
        <div className="p-6 border-b border-slate-800">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black">F</div>
                Finance Pro 360
            </h1>
        </div>
        <div className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
            Menu Principal
        </div>
        <nav className="flex-1 px-4 space-y-1">
            {menuItems.map(item => (
                <button
                    key={item.id}
                    onClick={() => handleTabChange(item.id as Tab)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                        activeTab === item.id 
                        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50 translate-x-1' 
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                >
                    {item.icon}
                    {item.label}
                </button>
            ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
            <div className="flex items-center justify-between px-2 mb-3">
                <div className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white ${isAdmin ? 'bg-indigo-600 ring-2 ring-indigo-400' : 'bg-slate-700'}`}>
                        {(userEmail || 'U').substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-xs font-medium text-slate-200 truncate max-w-[100px]" title={userEmail}>
                            {userEmail}
                        </div>
                        {isAdmin && <span className="text-[10px] text-indigo-400 font-semibold uppercase">Administrator</span>}
                    </div>
                </div>
                <button 
                    onClick={onLogout}
                    className="text-slate-500 hover:text-rose-500 transition-colors" 
                    title="Sair"
                >
                    <LogOut size={18} />
                </button>
            </div>
        </div>
      </aside>

      {/* Mobile Sidebar (Only for Secondary items like Config/Logout) */}
      {isMobileMenuOpen && (
          <div className="fixed inset-0 z-50 md:hidden flex">
              <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
              <aside className="relative w-64 bg-slate-900 text-white flex flex-col shadow-2xl h-full animate-fade-in">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                    <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                        <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center text-white font-black">F</div>
                        Finance Pro
                    </h1>
                    <button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400 hover:text-white">
                        <X size={20} />
                    </button>
                </div>
                <nav className="flex-1 px-4 space-y-1 mt-4">
                    {/* Show all items in burger menu too */}
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => handleTabChange(item.id as Tab)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                activeTab === item.id 
                                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/50' 
                                : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                            }`}
                        >
                            {item.icon}
                            {item.label}
                        </button>
                    ))}
                </nav>
                <div className="p-4 border-t border-slate-800">
                    <button 
                        onClick={onLogout}
                        className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-rose-400 hover:bg-rose-900/20 hover:text-rose-300 transition-colors"
                    >
                        <LogOut size={20} />
                        Sair da Conta
                    </button>
                </div>
              </aside>
          </div>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="bg-white dark:bg-slate-900 h-16 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 shadow-sm z-10 transition-colors">
            <div className="flex items-center gap-4">
                <button 
                    onClick={() => setIsMobileMenuOpen(true)}
                    className="md:hidden text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 p-2 rounded-lg transition-colors"
                >
                    <Menu />
                </button>
                <h2 className="text-lg font-semibold text-slate-800 dark:text-white capitalize truncate max-w-[120px] sm:max-w-none">
                    {getPageTitle(activeTab)}
                </h2>
            </div>

            <div className="flex items-center gap-2 sm:gap-4">
                <div className="hidden sm:block">
                    <FilterBar />
                </div>
                
                <button
                    onClick={() => updateConfig({...config, theme: config.theme === 'dark' ? 'light' : 'dark'})}
                    className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    {config.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
                </button>

                <button 
                    onClick={() => setShowInbox(true)}
                    className="relative p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                    title="Caixa de Entrada"
                >
                    <Mail size={20} />
                    {unreadMessages > 0 && (
                        <span className="absolute top-1 right-1 w-3 h-3 bg-rose-500 rounded-full border-2 border-white dark:border-slate-900"></span>
                    )}
                </button>
            </div>
        </header>

        {/* Content Area - Adjusted padding for bottom nav on mobile */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar mb-16 md:mb-0 relative">
            
            {contentLoading ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-20">
                    <Loader2 size={40} className="animate-spin text-blue-600 dark:text-blue-400 mb-3" />
                    <p className="text-sm font-medium text-slate-600 dark:text-slate-300 animate-pulse">
                        Carregando {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}...
                    </p>
                </div>
            ) : null}

            {/* Mobile Filter Bar (Visible only on small screens inside content) */}
            <div className="sm:hidden mb-4">
                 <FilterBar />
            </div>

            <div className={`transition-opacity duration-300 ${contentLoading ? 'opacity-40' : 'opacity-100'}`}>
                {activeTab === 'controle' && (
                    <Dashboard transactions={transactions} goals={goals} filter={filter} />
                )}
                
                {activeTab === 'receitas' && (
                    <SheetView 
                        type="income"
                        transactions={transactions}
                        categories={config.categories}
                        paymentMethods={config.paymentMethods}
                        onAdd={addTransaction}
                        onUpdate={updateTransaction}
                        onDelete={deleteTransaction}
                    />
                )}

                {activeTab === 'despesas' && (
                    <SheetView 
                        type="expense"
                        transactions={transactions}
                        categories={config.categories}
                        paymentMethods={config.paymentMethods}
                        onAdd={addTransaction}
                        onUpdate={updateTransaction}
                        onDelete={deleteTransaction}
                    />
                )}

                {activeTab === 'metas' && (
                    <GoalsSheet 
                        goals={goals}
                        onAdd={addGoal}
                        onDelete={deleteGoal}
                        onUpdate={updateGoalValue}
                    />
                )}

                {activeTab === 'config' && (
                    <Settings 
                        config={config} 
                        onUpdateConfig={updateConfig} 
                        transactions={transactions}
                    />
                )}

                {activeTab === 'admin' && isAdmin && (
                    <AdminPanel />
                )}
            </div>
        </div>

        {/* BOTTOM NAVIGATION FOR MOBILE */}
        <nav className="md:hidden fixed bottom-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 z-40 flex justify-around items-center pb-safe pt-1 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
            <button 
                onClick={() => handleTabChange('controle')}
                className={`flex flex-col items-center justify-center p-2 w-full ${activeTab === 'controle' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
            >
                <LayoutDashboard size={20} className={activeTab === 'controle' ? 'fill-current opacity-20' : ''} />
                <span className="text-[10px] mt-1 font-medium">Controle</span>
            </button>
            <button 
                onClick={() => handleTabChange('receitas')}
                className={`flex flex-col items-center justify-center p-2 w-full ${activeTab === 'receitas' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
            >
                <TrendingUp size={20} />
                <span className="text-[10px] mt-1 font-medium">Receitas</span>
            </button>
            <div className="relative -top-5">
                <button 
                    onClick={() => handleTabChange('despesas')}
                    className="flex items-center justify-center w-14 h-14 bg-blue-600 rounded-full shadow-lg shadow-blue-900/30 text-white hover:scale-105 transition-transform border-4 border-[#f3f4f6] dark:border-slate-950"
                >
                    <CreditCard size={24} />
                </button>
            </div>
            <button 
                onClick={() => handleTabChange('metas')}
                className={`flex flex-col items-center justify-center p-2 w-full ${activeTab === 'metas' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
            >
                <Target size={20} />
                <span className="text-[10px] mt-1 font-medium">Metas</span>
            </button>
            <button 
                onClick={() => handleTabChange('config')}
                className={`flex flex-col items-center justify-center p-2 w-full ${activeTab === 'config' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}`}
            >
                <SettingsIcon size={20} />
                <span className="text-[10px] mt-1 font-medium">Ajustes</span>
            </button>
        </nav>

        {toastMessage && (
            <Toast 
                message={toastMessage} 
                onClose={() => setToastMessage(null)}
                actionLabel={toastAction?.label}
                onAction={toastAction?.fn}
            />
        )}

        {showTutorial && (
            <Tutorial 
                onComplete={handleTutorialComplete}
                onStepChange={handleTutorialStepChange}
            />
        )}

        <Inbox 
            userId={user}
            isOpen={showInbox}
            onClose={() => setShowInbox(false)}
            onUpdateUnread={checkUnreadMessages}
        />
      </main>
    </div>
  );
};

// --- Root App Component ---
function App() {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [emailConfirmed, setEmailConfirmed] = useState(false);

  useEffect(() => {
    // Check URL Hash for errors or confirmation signals before Supabase clears them
    const hash = window.location.hash;
    
    // Check for error description in URL (Supabase redirect)
    if (hash && hash.includes('error_description')) {
        const params = new URLSearchParams(hash.substring(1)); // remove #
        const errorDesc = params.get('error_description');
        if (errorDesc) {
            setAuthError(decodeURIComponent(errorDesc).replace(/\+/g, ' '));
        }
    }

    // Check for email confirmation (type=signup or type=invite)
    // Note: Supabase puts these in the hash for implicit flow
    if (hash && (hash.includes('type=signup') || hash.includes('type=invite') || hash.includes('type=recovery'))) {
        setEmailConfirmed(true);
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
          setSession(session);
          // If we detected a signup flow in the hash earlier, it persists here
      } else if (event === 'SIGNED_OUT') {
          setSession(null);
          setEmailConfirmed(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = (user: string) => {
    // Legacy support or fallback
  };

  const handleLogout = async () => {
      await supabase.auth.signOut();
      window.location.hash = ''; // Clear hash on logout
      setAuthError(null);
  };

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-slate-950">
               <Loader2 className="animate-spin text-white" size={32} />
          </div>
      )
  }

  if (!session) {
      return (
        <Login 
            onLogin={handleLogin} 
            initialMessage={authError} 
            messageType="error" 
        />
      );
  }

  return (
    <FinanceApp 
        key={session.user.id} 
        user={session.user.id} 
        onLogout={handleLogout} 
        isEmailConfirmed={emailConfirmed}
    />
  );
}

export default App;
