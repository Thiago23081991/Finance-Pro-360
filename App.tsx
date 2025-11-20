
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
import { Tutorial, TutorialStepTarget } from './components/Tutorial';
import { DBService } from './db';
import { LayoutDashboard, CreditCard, TrendingUp, Target, Settings as SettingsIcon, Menu, Filter, LogOut, Loader2, ShieldCheck } from 'lucide-react';

type Tab = 'dashboard' | 'receitas' | 'despesas' | 'metas' | 'config' | 'admin';

interface FinanceAppProps {
  user: string;
  onLogout: () => void;
}

// --- Authenticated Application Component ---
const FinanceApp: React.FC<FinanceAppProps> = ({ user, onLogout }) => {
  
  // Define admin users here
  const isAdmin = user === 'admin' || user === 'Thiago Nascimento';

  // State Management
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  const [loading, setLoading] = useState(true);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [config, setConfig] = useState<AppConfig>(DEFAULT_CONFIG);

  // Toast Notification State
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastAction, setToastAction] = useState<{label: string, fn: () => void} | undefined>(undefined);

  // Tutorial State
  const [showTutorial, setShowTutorial] = useState(false);

  // Filter State
  const [filter, setFilter] = useState<FilterState>({
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      category: 'Todas',
      paymentMethod: 'Todas'
  });

  // Initial Data Fetch from Database
  useEffect(() => {
    const fetchData = async () => {
        setLoading(true);
        try {
            // Se for admin, talvez queira carregar dados diferentes, mas por enquanto mantemos o fluxo padrão
            // O componente AdminPanel carrega seus próprios dados
            const [txs, gls, cfg] = await Promise.all([
                DBService.getTransactions(user),
                DBService.getGoals(user),
                DBService.getConfig(user)
            ]);
            
            setTransactions(txs);
            setGoals(gls);
            // Merge with defaults to ensure new fields exist
            const mergedConfig = { ...DEFAULT_CONFIG, ...cfg };
            setConfig(mergedConfig);

            // Check for tutorial (skip for admin)
            if (!isAdmin && mergedConfig.hasSeenTutorial === false) {
                // Slight delay to allow UI to settle
                setTimeout(() => setShowTutorial(true), 500);
            }

        } catch (error) {
            console.error("Failed to load data from DB", error);
        } finally {
            setLoading(false);
        }
    };
    fetchData();
  }, [user, isAdmin]);

  // Reminder Logic
  useEffect(() => {
      if (!loading && config.enableReminders && !showTutorial && !isAdmin) {
          // Default check: If last seen goals was more than 3 days ago
          const lastSeen = config.lastSeenGoals ? new Date(config.lastSeenGoals) : new Date(0);
          const now = new Date();
          const diffTime = Math.abs(now.getTime() - lastSeen.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // If > 3 days (using 3 for demo purposes, typically 7)
          if (diffDays > 3) {
              // Slight delay to not overwhelm user on immediate load
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
  }, [loading, config.enableReminders, showTutorial, isAdmin]);

  // Enhanced Tab Change Handler to track usage
  const handleTabChange = async (tab: Tab) => {
    setActiveTab(tab);
    
    // If user visits 'metas', update the lastSeenGoals timestamp
    if (tab === 'metas') {
        const now = new Date().toISOString();
        // We update local state immediately
        const newConfig = { ...config, lastSeenGoals: now };
        setConfig(newConfig);
        
        // And save to DB
        const configWithUser = { ...newConfig, userId: user };
        await DBService.saveConfig(configWithUser);
        
        // Dismiss related toast if exists
        if (toastMessage && toastMessage.includes("metas")) {
            setToastMessage(null);
        }
    }
  };

  // Handlers with Async DB Updates
  const addTransaction = async (t: Transaction) => {
      const tWithUser = { ...t, userId: user };
      await DBService.addTransaction(tWithUser);
      setTransactions(prev => [...prev, tWithUser]);
  };

  const updateTransaction = async (t: Transaction) => {
      const tWithUser = { ...t, userId: user }; // Ensure userId stays
      await DBService.addTransaction(tWithUser); // put acts as update
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
      setConfig(newConfig); // Update local state first for speed
      await updateConfig(newConfig); // Persist
  };

  const handleTutorialStepChange = (target: TutorialStepTarget) => {
      // Just switch the tab visually, don't trigger DB updates associated with tab switching
      setActiveTab(target as Tab);
  };

  // Sidebar Menu
  let menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'receitas', label: 'Receitas', icon: <TrendingUp size={20} /> },
      { id: 'despesas', label: 'Despesas', icon: <CreditCard size={20} /> },
      { id: 'metas', label: 'Metas', icon: <Target size={20} /> },
      { id: 'config', label: 'Configurações', icon: <SettingsIcon size={20} /> },
  ];

  // Insert Admin Tab if needed
  if (isAdmin) {
      menuItems.push({ id: 'admin', label: 'Administração', icon: <ShieldCheck size={20} /> });
  }

  // Filter Component
  const FilterBar = () => (
      <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center bg-white rounded-md border border-slate-300 px-3 py-1.5 shadow-sm">
              <Filter size={14} className="text-slate-400 mr-2"/>
              <select 
                value={filter.month} 
                onChange={e => setFilter({...filter, month: parseInt(e.target.value)})}
                className="bg-transparent outline-none text-slate-700 font-medium cursor-pointer"
              >
                  {MONTH_NAMES.map((m, i) => <option key={i} value={i}>{m}</option>)}
              </select>
              <span className="mx-2 text-slate-300">|</span>
              <select 
                value={filter.year} 
                onChange={e => setFilter({...filter, year: parseInt(e.target.value)})}
                className="bg-transparent outline-none text-slate-700 font-medium cursor-pointer"
              >
                  {[2023, 2024, 2025, 2026, 2027, 2028, 2029, 2030].map(y => <option key={y} value={y}>{y}</option>)}
              </select>
          </div>
          
          {activeTab === 'dashboard' && (
            <>
                <select 
                    value={filter.category} 
                    onChange={e => setFilter({...filter, category: e.target.value})}
                    className="bg-white rounded-md border border-slate-300 px-3 py-1.5 shadow-sm outline-none text-slate-700 text-sm cursor-pointer hidden md:block"
                >
                    <option value="Todas">Todas Categorias</option>
                    {config.categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                 <select 
                    value={filter.paymentMethod} 
                    onChange={e => setFilter({...filter, paymentMethod: e.target.value})}
                    className="bg-white rounded-md border border-slate-300 px-3 py-1.5 shadow-sm outline-none text-slate-700 text-sm cursor-pointer hidden md:block"
                >
                    <option value="Todas">Todos Pagamentos</option>
                    {config.paymentMethods.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
            </>
          )}
      </div>
  );

  if (loading) {
      return (
          <div className="h-screen w-full flex items-center justify-center bg-[#f3f4f6]">
              <div className="flex flex-col items-center gap-4">
                  <Loader2 className="animate-spin text-blue-600" size={48} />
                  <p className="text-slate-500 font-medium animate-pulse">Carregando banco de dados seguro...</p>
              </div>
          </div>
      );
  }

  return (
    <div className="flex h-screen bg-[#f3f4f6] text-slate-800 font-sans overflow-hidden">
      {/* Sidebar - Desktop */}
      <aside className="w-64 bg-slate-900 text-white flex flex-col shadow-xl z-20 hidden md:flex">
        <div className="p-6 border-b border-slate-800">
            <h1 className="text-lg font-bold tracking-tight flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center text-white font-black">F</div>
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
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/50 translate-x-1' 
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
                        {user.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <div className="text-sm font-medium text-slate-200 truncate max-w-[100px]" title={user}>
                            {user}
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
            <div className="text-xs text-slate-600 text-center pt-2 border-t border-slate-800">
                Finance Pro 360 © 2030
            </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Header */}
        <header className="bg-white h-16 border-b border-slate-200 flex items-center justify-between px-6 shadow-sm z-10">
            <div className="flex items-center gap-4">
                <button className="md:hidden text-slate-500"><Menu /></button>
                <h2 className="text-lg font-semibold text-slate-800 capitalize">
                    {activeTab === 'admin' ? 'Painel Administrativo' : activeTab.replace('config', 'Configurações')}
                </h2>
            </div>
            <FilterBar />
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activeTab === 'dashboard' && (
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

        {/* Toast Notifications */}
        {toastMessage && (
            <Toast 
                message={toastMessage} 
                onClose={() => setToastMessage(null)}
                actionLabel={toastAction?.label}
                onAction={toastAction?.fn}
            />
        )}

        {/* Tutorial Overlay */}
        {showTutorial && (
            <Tutorial 
                onComplete={handleTutorialComplete}
                onStepChange={handleTutorialStepChange}
            />
        )}
      </main>
    </div>
  );
};

// --- Root App Component ---
function App() {
  const [currentUser, setCurrentUser] = useState<string | null>(() => {
      return localStorage.getItem('fp360_active_session');
  });

  const handleLogin = (user: string) => {
      localStorage.setItem('fp360_active_session', user);
      setCurrentUser(user);
  };

  const handleLogout = () => {
      localStorage.removeItem('fp360_active_session');
      setCurrentUser(null);
  };

  if (!currentUser) {
      return <Login onLogin={handleLogin} />;
  }

  return <FinanceApp key={currentUser} user={currentUser} onLogout={handleLogout} />;
}

export default App;
