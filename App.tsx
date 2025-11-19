import React, { useState, useEffect } from 'react';
import { Transaction, Goal, AppConfig, FilterState } from './types';
import { DEFAULT_CONFIG, MONTH_NAMES } from './constants';
import { Dashboard } from './components/Dashboard';
import { SheetView } from './components/SheetView';
import { GoalsSheet } from './components/GoalsSheet';
import { Settings } from './components/Settings';
import { Login } from './components/Login';
import { LayoutDashboard, CreditCard, TrendingUp, Target, Settings as SettingsIcon, Menu, Filter, LogOut } from 'lucide-react';

type Tab = 'dashboard' | 'receitas' | 'despesas' | 'metas' | 'config';

interface FinanceAppProps {
  user: string;
  onLogout: () => void;
}

// Helper function to safely parse JSON from localStorage
const safeJsonParse = <T,>(key: string, fallback: T): T => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;
  } catch (error) {
    console.error(`Error parsing ${key} from localStorage:`, error);
    return fallback;
  }
};

// --- Authenticated Application Component ---
const FinanceApp: React.FC<FinanceAppProps> = ({ user, onLogout }) => {
  const getStorageKey = (key: string) => `fp360_data_${user}_${key}`;

  // State Management with Safe Parsing
  const [activeTab, setActiveTab] = useState<Tab>('dashboard');
  
  const [transactions, setTransactions] = useState<Transaction[]>(() => 
    safeJsonParse(getStorageKey('transactions'), [])
  );
  
  const [goals, setGoals] = useState<Goal[]>(() => 
    safeJsonParse(getStorageKey('goals'), [])
  );
  
  const [config, setConfig] = useState<AppConfig>(() => 
    safeJsonParse(getStorageKey('config'), DEFAULT_CONFIG)
  );

  // Filter State
  const [filter, setFilter] = useState<FilterState>({
      month: new Date().getMonth(),
      year: new Date().getFullYear(),
      category: 'Todas',
      paymentMethod: 'Todas'
  });

  // Persistence
  useEffect(() => { localStorage.setItem(getStorageKey('transactions'), JSON.stringify(transactions)); }, [transactions, user]);
  useEffect(() => { localStorage.setItem(getStorageKey('goals'), JSON.stringify(goals)); }, [goals, user]);
  useEffect(() => { localStorage.setItem(getStorageKey('config'), JSON.stringify(config)); }, [config, user]);

  // Handlers
  const addTransaction = (t: Transaction) => setTransactions(prev => [...prev, t]);
  const updateTransaction = (t: Transaction) => setTransactions(prev => prev.map(x => x.id === t.id ? t : x));
  const deleteTransaction = (id: string) => setTransactions(prev => prev.filter(x => x.id !== id));
  
  const addGoal = (g: Goal) => setGoals(prev => [...prev, g]);
  const deleteGoal = (id: string) => setGoals(prev => prev.filter(x => x.id !== id));
  const updateGoalValue = (id: string, val: number) => setGoals(prev => prev.map(x => x.id === id ? {...x, currentValue: val} : x));

  // Sidebar Menu
  const menuItems = [
      { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      { id: 'receitas', label: 'Receitas', icon: <TrendingUp size={20} /> },
      { id: 'despesas', label: 'Despesas', icon: <CreditCard size={20} /> },
      { id: 'metas', label: 'Metas', icon: <Target size={20} /> },
      { id: 'config', label: 'Configurações', icon: <SettingsIcon size={20} /> },
  ];

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
                    onClick={() => setActiveTab(item.id as Tab)}
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
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white">
                        {user.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="text-sm font-medium text-slate-200 truncate max-w-[100px]" title={user}>
                        {user}
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
                    {activeTab.replace('config', 'Configurações')}
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
                    onUpdateConfig={setConfig} 
                />
            )}
        </div>
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