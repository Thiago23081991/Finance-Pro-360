import React, { useState, useEffect } from 'react';
import { Transaction, Goal, AppConfig, FilterState, Tab, Debt } from './types';
import { DEFAULT_CONFIG, MONTH_NAMES } from './constants';
import { Dashboard } from './components/Dashboard';
import { SheetView } from './components/SheetView';
import { CreditCardControl } from './components/CreditCardControl';
import { GoalsSheet } from './components/GoalsSheet';
import { Settings } from './components/Settings';
import { AdminPanel } from './components/AdminPanel';
import { Courses } from './components/Courses';
import { Investments } from './components/Investments';
import { Debts } from './components/Debts';
import { Login } from './components/Login';
import { Presell } from './components/Presell';
import { Toast } from './components/Toast';
import { InstallPrompt } from './components/InstallPrompt';
import { Inbox } from './components/Inbox';
import { Tutorial } from './components/Tutorial';
import { FilterBar } from './components/FilterBar';
import { ResetPasswordModal } from './components/ResetPasswordModal';
import { CalculatorModal } from './components/CalculatorModal';
import { RecurringExpenses } from './components/RecurringExpenses';
import { MonthlyReportModal } from './components/MonthlyReportModal';
import { Notifications } from './components/Notifications';
import { StatementImportModal } from './components/StatementImportModal';
import { AIAdvisor } from './components/AIAdvisor';
import { Budget } from './components/Budget';
import { Logo } from './components/Logo';
import { DBService } from './db';
import { supabase } from './supabaseClient';
import { SubscriptionWall } from './components/SubscriptionWall';
import { TrialModal } from './components/TrialModal';
import { LayoutDashboard, CreditCard, TrendingUp, Target, Settings as SettingsIcon, Menu, Filter, LogOut, Loader2, ShieldCheck, Mail, Sun, Moon, X, BarChart4, GraduationCap, Scale, Calculator, List, TableProperties, AlertTriangle, RefreshCw, Plus, User, Receipt, Upload, PieChart } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { MotionWrapper } from './components/MotionWrapper';
import { ThemeSelector } from './components/ThemeSelector';
import { PLANS_CONFIG } from './constants';
import { BiometricGate } from './components/BiometricGate';
import { Haptics, ImpactStyle } from '@capacitor/haptics';

const TAB_METADATA: Record<Tab, { label: string; pageTitle: string; icon: React.ReactNode }> = {
    controle: { label: 'Controle', pageTitle: 'Painel de Controle', icon: <LayoutDashboard size={20} /> },
    receitas: { label: 'Receitas', pageTitle: 'Gerenciar Receitas', icon: <TrendingUp size={20} /> },
    despesas: { label: 'Despesas', pageTitle: 'Gerenciar Despesas', icon: <CreditCard size={20} /> },
    dividas: { label: 'Dívidas', pageTitle: 'Gestão de Passivos', icon: <Scale size={20} /> },
    metas: { label: 'Metas', pageTitle: 'Metas Financeiras', icon: <Target size={20} /> },
    orcamento: { label: 'Orçamento', pageTitle: 'Orçamento Familiar', icon: <PieChart size={20} /> },
    investimentos: { label: 'Investimentos', pageTitle: 'Central de Investimentos', icon: <BarChart4 size={20} /> },
    cursos: { label: 'Cursos', pageTitle: 'Educação Financeira', icon: <GraduationCap size={20} /> },
    config: { label: 'Configurações', pageTitle: 'Ajustes do Sistema', icon: <SettingsIcon size={20} /> },
    admin: { label: 'Administração', pageTitle: 'Painel Administrativo', icon: <ShieldCheck size={20} /> }
};

interface FinanceAppProps {
    user: string;
    onLogout: () => void;
}

const FinanceApp: React.FC<FinanceAppProps> = ({ user, onLogout }) => {
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
    const [toastAction, setToastAction] = useState<{ label: string, fn: () => void } | undefined>(undefined);
    const [showInbox, setShowInbox] = useState(false);
    const [unreadMessages, setUnreadMessages] = useState(0);
    const [showTutorial, setShowTutorial] = useState(false);
    const [showCalculatorModal, setShowCalculatorModal] = useState(false);
    const [showRecurringExpenses, setShowRecurringExpenses] = useState(false);

    // Trial State
    const [isTrialExpired, setIsTrialExpired] = useState(false);
    const [showTrialModal, setShowTrialModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);
    const [daysRemaining, setDaysRemaining] = useState(0);

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
                const isUserAdmin = currentUser.email && adminEmails.includes(currentUser.email);
                if (isUserAdmin) setIsAdmin(true);

                const cfg = await DBService.getConfig(user);

                if (!cfg.createdAt) {
                    const initialName = currentUser.user_metadata?.full_name || currentUser.email?.split('@')[0];
                    await DBService.saveConfig({
                        ...DEFAULT_CONFIG,
                        userId: user,
                        name: initialName
                    });
                    cfg.name = initialName;
                }

                const [txs, gls] = await Promise.all([
                    DBService.getTransactions(user),
                    DBService.getGoals(user)
                ]);

                if (isUserAdmin) {
                    cfg.planType = 'annual';
                    cfg.licenseStatus = 'active';
                }

                setTransactions(txs);
                setGoals(gls);
                setConfig({ ...DEFAULT_CONFIG, ...cfg, userId: user });

                checkUnreadMessages();

                // Trial Logic Implementation
                if (cfg.licenseStatus !== 'active') {
                    const createdAt = cfg.createdAt ? new Date(cfg.createdAt) : new Date();
                    const now = new Date();
                    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    // Note: diffDays=1 means first day. 

                    if (diffDays > 3) {
                        setIsTrialExpired(true);
                    } else {
                        setDaysRemaining(4 - diffDays); // If day 1, 3 days remaining.
                        // Only show modal once per session
                        const hasSeenModal = sessionStorage.getItem('fp360_seen_trial_modal');
                        if (!hasSeenModal) {
                            setTimeout(() => setShowTrialModal(true), 1500);
                            sessionStorage.setItem('fp360_seen_trial_modal', 'true');
                        }
                    }
                }

                if (!isAdmin && cfg.hasSeenTutorial === false) {
                    setTimeout(() => setShowTutorial(true), 500);
                }
            }
        } catch (error: any) {
            console.error("Erro no fetchData:", error);
            setDataError("Erro de sincronização. Tente atualizar a página.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchData(); }, [user]);

    useEffect(() => {
        if (config.theme === 'dark') document.documentElement.classList.add('dark');
        else document.documentElement.classList.remove('dark');
    }, [config.theme]);

    // Checagem de Mensagens
    useEffect(() => {
        const checkInterval = setInterval(checkUnreadMessages, 15000);
        return () => clearInterval(checkInterval);
    }, [user]);

    const checkUnreadMessages = async () => {
        try {
            const msgs = await DBService.getMessagesForUser(user);
            setUnreadMessages(msgs.filter(m => !m.read).length);
        } catch (e) { }
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
            else if (tab === 'orcamento') { /* Data loaded inside component */ }
            else if (tab === 'dividas') dataPromises.push(DBService.getDebts(user).then(setDebts));
            else if (tab === 'config') dataPromises.push(DBService.getConfig(user).then((cfg) => setConfig({ ...DEFAULT_CONFIG, ...cfg, userId: user })));
            await Promise.all(dataPromises);
            if (tab === 'metas') {
                const newConfig = { ...config, lastSeenGoals: new Date().toISOString() };
                setConfig(newConfig);
                await DBService.saveConfig(newConfig);
            }
        } catch (error) { } finally { setContentLoading(false); }
    };

    const addTransaction = async (t: Transaction) => {
        try {
            await Haptics.impact({ style: ImpactStyle.Light });
        } catch (e) { } // Ignore on web
        const tWithUser = { ...t, userId: user };
        await DBService.addTransaction(tWithUser);

        // Optimistic Update
        const newTxs = [...transactions, tWithUser];
        setTransactions(prev => [...prev, tWithUser]);
        setToastMessage(`✅ Transação Salva!`);
    };
    const handleBatchImport = async (newTransactions: Transaction[]) => {
        const txsWithUser = newTransactions.map(t => ({ ...t, userId: user }));
        await DBService.addTransactions(txsWithUser);
        setTransactions(prev => [...prev, ...txsWithUser]);
        setToastMessage(`${newTransactions.length} transações importadas com sucesso!`);
    };
    const addTransactions = async (ts: Transaction[]) => {
        const tsWithUser = ts.map(t => ({ ...t, userId: user }));
        await DBService.addTransactions(tsWithUser);
        setTransactions(prev => [...prev, ...tsWithUser]);
    };

    const updateTransaction = async (t: Transaction) => { const tWithUser = { ...t, userId: user }; await DBService.addTransaction(tWithUser); setTransactions(prev => prev.map(x => x.id === t.id ? tWithUser : x)); };

    const deleteTransaction = async (id: string) => {
        try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch (e) { }
        await DBService.deleteTransaction(id);
        setTransactions(prev => prev.filter(x => x.id !== id));
    };

    const addGoal = async (g: Goal) => {
        try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) { }
        const gWithUser = { ...g, userId: user }; await DBService.saveGoal(gWithUser); setGoals(prev => [...prev, gWithUser]);
    };

    const deleteGoal = async (id: string) => {
        try { await Haptics.impact({ style: ImpactStyle.Heavy }); } catch (e) { }
        await DBService.deleteGoal(id); setGoals(prev => prev.filter(x => x.id !== id));
    };

    const updateGoalValue = async (id: string, val: number) => {
        const goal = goals.find(g => g.id === id);
        if (goal) {
            try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) { }
            const updatedGoal = { ...goal, currentValue: val };
            await DBService.saveGoal(updatedGoal);
            setGoals(prev => prev.map(x => x.id === id ? updatedGoal : x));
        }
    };

    const addDebt = async (d: Debt) => {
        try { await Haptics.impact({ style: ImpactStyle.Light }); } catch (e) { }
        const dWithUser = { ...d, userId: user };
        await DBService.saveDebt(dWithUser); setDebts(prev => [...prev, dWithUser]);
    };

    const deleteDebt = async (id: string) => {
        try { await Haptics.impact({ style: ImpactStyle.Medium }); } catch (e) { }
        await DBService.deleteDebt(id); setDebts(prev => prev.filter(d => d.id !== id));
    };
    const updateConfig = async (newConfig: AppConfig) => { const configWithUser = { ...newConfig, userId: user }; await DBService.saveConfig(configWithUser); setConfig(configWithUser); };
    const handleTutorialComplete = async () => { setShowTutorial(false); const newConfig = { ...config, hasSeenTutorial: true }; setConfig(newConfig); await updateConfig(newConfig); };

    const handleTutorialStepChange = (tab: Tab) => {
        setActiveTab(tab);
    };

    const handleOpenGoalFormShortcut = () => {
        handleTabChange('metas');
        setToastMessage("Abra a aba Metas para criar seu novo objetivo financeiro!");
    };

    const displayName = config.name || userEmail.split('@')[0];

    if (loading) return <div className="h-screen w-full flex items-center justify-center bg-[#f3f4f6] dark:bg-slate-950 transition-colors"><Loader2 className="animate-spin text-brand-blue" size={48} /></div>;

    if (isTrialExpired) {
        return <SubscriptionWall userId={user} userEmail={userEmail} />;
    }

    return (
        <BiometricGate requireBiometrics={!!config.requireBiometrics}>
            <div className="flex h-[100dvh] bg-slate-50 dark:bg-slate-950 text-textMain font-sans overflow-hidden transition-colors duration-300">
                <aside className="w-64 bg-brand-blue/95 dark:bg-slate-950/95 backdrop-blur-xl text-white flex flex-col shadow-2xl z-20 hidden md:flex border-r border-white/5">
                    <div className="p-6 border-b border-white/10"><Logo className="w-9 h-9" textClassName="text-white" /></div>
                    <nav className="flex-1 px-4 space-y-1 mt-4 overflow-y-auto custom-scrollbar">
                        {(['controle', 'receitas', 'despesas', 'orcamento', 'dividas', 'metas', 'investimentos', 'cursos', 'config'] as Tab[]).concat(isAdmin ? ['admin'] : []).map(tabId => (
                            <button key={tabId} onClick={() => handleTabChange(tabId)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${activeTab === tabId ? 'bg-gradient-to-r from-brand-gold to-yellow-600 text-white shadow-lg shadow-amber-500/20 font-bold translate-x-1' : 'text-slate-300 hover:bg-white/10 hover:translate-x-1'}`}>
                                {TAB_METADATA[tabId].icon}{TAB_METADATA[tabId].label}
                            </button>
                        ))}
                    </nav>

                    {/* Sidebar CTA for Free Users */}
                    {config.licenseStatus !== 'active' && (
                        <div className="mx-4 mb-4 p-4 rounded-xl bg-gradient-to-br from-brand-gold to-yellow-600 shadow-lg text-center">
                            <h4 className="font-black text-brand-blue text-sm mb-1">Seja Premium 🚀</h4>
                            <p className="text-[10px] text-brand-blue/80 font-medium mb-3 leading-tight">Desbloqueie todos os recursos agora!</p>
                            <a
                                href={PLANS_CONFIG.annual.checkoutUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full py-2 bg-brand-blue text-white text-xs font-bold rounded-lg hover:brightness-110 transition-all shadow-md"
                            >
                                UPGRADE
                            </a>
                        </div>
                    )}
                    <div className="p-4 border-t border-white/10 bg-black/20 flex items-center justify-between">
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-brand-gold flex items-center justify-center text-xs font-bold text-brand-blue shrink-0">
                                {(displayName || 'U').substring(0, 1).toUpperCase()}
                            </div>
                            <div className="flex flex-col overflow-hidden">
                                <span className="text-xs font-bold truncate text-white">{displayName}</span>

                            </div>
                        </div>
                        <button onClick={onLogout} className="text-slate-400 hover:text-rose-400 p-1 shrink-0"><LogOut size={18} /></button>
                    </div>
                </aside>

                {isMobileMenuOpen && (
                    <div className="fixed inset-0 z-50 flex md:hidden"><div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div><aside className="relative w-64 bg-brand-blue text-white flex flex-col shadow-2xl h-full animate-fade-in border-r border-white/10"><div className="p-6 border-b border-white/10 flex justify-between items-center"><Logo className="w-8 h-8" textClassName="text-white" /><button onClick={() => setIsMobileMenuOpen(false)} className="text-slate-400"><X size={20} /></button></div><nav className="flex-1 px-4 mt-4 overflow-y-auto">{(['controle', 'receitas', 'despesas', 'orcamento', 'dividas', 'metas', 'investimentos', 'config'] as Tab[]).map(tabId => (<button key={tabId} onClick={() => handleTabChange(tabId)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${activeTab === tabId ? 'bg-brand-gold text-white' : 'text-slate-300'}`}>{TAB_METADATA[tabId].icon}{TAB_METADATA[tabId].label}</button>))}</nav></aside></div>
                )}

                <main className="flex-1 flex flex-col h-full overflow-hidden relative bg-slate-50 dark:bg-slate-950">
                    <header className="glass-header h-16 flex items-center justify-between px-4 z-30 transition-all">
                        <div className="flex items-center gap-3"><button onClick={() => setIsMobileMenuOpen(true)} className="md:hidden text-slate-500 hover:bg-slate-100 p-2 rounded-lg -ml-2"><Menu /></button><h2 className="text-lg font-semibold dark:text-white truncate max-w-[200px]">{TAB_METADATA[activeTab].pageTitle}</h2></div>
                        <div className="flex items-center gap-2 sm:gap-4">
                            <div className="hidden sm:block"><FilterBar filter={filter} setFilter={setFilter} activeTab={activeTab} config={config} /></div>
                            <div className="hidden md:block"><ThemeSelector /></div>
                            <button onClick={() => updateConfig({ ...config, theme: config.theme === 'dark' ? 'light' : 'dark' })} className="p-2 text-slate-500 dark:hover:bg-slate-800 rounded-full transition-colors">{config.theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}</button>
                            <Notifications transactions={transactions} goals={goals} debts={debts} config={config} onNavigate={(tab) => { handleTabChange(tab as Tab); if (tab === 'despesas') setExpenseSubTab('cards'); }} />
                            <button onClick={() => setShowImportModal(true)} className="p-3 text-slate-500 dark:hover:bg-slate-800 rounded-full transition-all hover:scale-105 active:scale-95" title="Importar Extrato"><Upload size={20} /></button>
                            <button onClick={() => setShowRecurringExpenses(true)} className="p-3 text-slate-500 dark:hover:bg-slate-800 rounded-full transition-all hover:scale-105 active:scale-95" title="Organizador de Assinaturas"><Receipt size={20} /></button>
                            <button onClick={() => setShowCalculatorModal(true)} className="p-3 text-slate-500 dark:hover:bg-slate-800 rounded-full transition-all hover:scale-105 active:scale-95"><Calculator size={20} /></button>
                            <button onClick={() => setShowInbox(true)} className="relative p-3 text-slate-500 dark:hover:bg-slate-800 rounded-full transition-all hover:scale-105 active:scale-95"><Mail size={20} />{unreadMessages > 0 && <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-brand-gold rounded-full border-2 border-white dark:border-slate-900 animate-pulse"></span>}</button>
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-4 custom-scrollbar pb-28 md:pb-6 relative">
                        {contentLoading && <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 dark:bg-slate-950/80 backdrop-blur-sm z-20"><Loader2 size={40} className="animate-spin text-brand-gold mb-3" /><p className="text-sm font-medium animate-pulse">Sincronizando...</p></div>}
                        <div className={`transition-opacity duration-300 ${contentLoading ? 'opacity-40' : 'opacity-100'}`}>
                            <AnimatePresence mode="wait">
                                {activeTab === 'controle' && (
                                    <MotionWrapper key="controle">
                                        <Dashboard transactions={transactions} goals={goals} filter={filter} currency={config.currency} isPremium={config.licenseStatus === 'active'} config={config} />
                                    </MotionWrapper>
                                )}
                                {activeTab === 'receitas' && (
                                    <MotionWrapper key="receitas">
                                        <SheetView type="income" transactions={transactions} categories={config.incomeCategories || DEFAULT_CONFIG.incomeCategories} paymentMethods={config.paymentMethods} onAdd={addTransaction} onAddBatch={addTransactions} onUpdate={updateTransaction} onDelete={deleteTransaction} currency={config.currency} />
                                    </MotionWrapper>
                                )}

                                {activeTab === 'despesas' && (
                                    <MotionWrapper key="despesas">
                                        <div className="flex flex-col gap-4">
                                            <div className="flex justify-center">
                                                <div className="bg-slate-200 dark:bg-slate-800 p-1 rounded-lg flex items-center border border-slate-200 dark:border-slate-700">
                                                    <button
                                                        onClick={() => setExpenseSubTab('general')}
                                                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${expenseSubTab === 'general'
                                                            ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white'
                                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                            }`}
                                                    >
                                                        Lista Geral
                                                    </button>
                                                    <button
                                                        onClick={() => setExpenseSubTab('cards')}
                                                        className={`flex items-center gap-2 px-4 py-1.5 text-xs font-bold rounded-md transition-all ${expenseSubTab === 'cards'
                                                            ? 'bg-white dark:bg-slate-700 shadow-sm text-slate-800 dark:text-white'
                                                            : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
                                                            }`}
                                                    >
                                                        Controle de Cartão e Crédito
                                                    </button>
                                                </div>
                                            </div>
                                            {expenseSubTab === 'general' ? (
                                                <MotionWrapper key="expense-general">
                                                    <SheetView type="expense" transactions={transactions} categories={config.expenseCategories || DEFAULT_CONFIG.expenseCategories} paymentMethods={config.paymentMethods} onAdd={addTransaction} onAddBatch={addTransactions} onUpdate={updateTransaction} onDelete={deleteTransaction} currency={config.currency} />
                                                </MotionWrapper>
                                            ) : (
                                                <MotionWrapper key="expense-cards">
                                                    <CreditCardControl transactions={transactions} onDelete={deleteTransaction} onAdd={addTransaction} onAddBatch={addTransactions} currency={config.currency} config={config} onUpdateConfig={updateConfig} />
                                                </MotionWrapper>
                                            )}
                                        </div>
                                    </MotionWrapper>
                                )}

                                {activeTab === 'orcamento' && (
                                    <MotionWrapper key="orcamento">
                                        <Budget transactions={transactions} config={config} filter={filter} />
                                    </MotionWrapper>
                                )}
                                {activeTab === 'dividas' && (
                                    <MotionWrapper key="dividas">
                                        <Debts config={config} debts={debts} onAddDebt={addDebt} onDeleteDebt={deleteDebt} onNavigateToSettings={() => handleTabChange('config')} />
                                    </MotionWrapper>
                                )}
                                {activeTab === 'metas' && (
                                    <MotionWrapper key="metas">
                                        <GoalsSheet goals={goals} onAdd={addGoal} onDelete={deleteGoal} onUpdate={updateGoalValue} currency={config.currency} />
                                    </MotionWrapper>
                                )}
                                {activeTab === 'investimentos' && (
                                    <MotionWrapper key="investimentos">
                                        <Investments config={config} onNavigateToSettings={() => handleTabChange('config')} />
                                    </MotionWrapper>
                                )}
                                {activeTab === 'cursos' && (
                                    <MotionWrapper key="cursos">
                                        <Courses config={config} userEmail={userEmail} onNavigateToSettings={() => handleTabChange('config')} />
                                    </MotionWrapper>
                                )}
                                {activeTab === 'config' && (
                                    <MotionWrapper key="config">
                                        <Settings config={config} onUpdateConfig={updateConfig} transactions={transactions} />
                                    </MotionWrapper>
                                )}
                                {activeTab === 'admin' && isAdmin && (
                                    <MotionWrapper key="admin">
                                        <AdminPanel />
                                    </MotionWrapper>
                                )}
                            </AnimatePresence>
                        </div>
                    </div>

                    <button
                        onClick={handleOpenGoalFormShortcut}
                        className="fixed bottom-36 right-4 md:bottom-24 md:right-8 w-14 h-14 md:w-16 md:h-16 bg-gradient-to-r from-brand-gold to-yellow-500 text-white rounded-full shadow-[0_8px_30px_rgb(212,175,55,0.4)] flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-40 border-[3px] border-white/50 dark:border-slate-800/50 backdrop-blur-md"
                        title="Nova Meta Financeira"
                    >
                        <Plus size={24} />
                    </button>

                    <nav className="md:hidden fixed bottom-0 w-full glass-panel z-50 flex justify-around items-center pb-safe pt-1">
                        {(['controle', 'receitas', 'despesas', 'cursos', 'config'] as Tab[]).map(t => (
                            <button
                                key={t}
                                onClick={() => handleTabChange(t)}
                                className={`flex flex-col items-center justify-center p-2 min-w-[70px] min-h-[60px] active:scale-95 transition-transform ${activeTab === t ? 'text-brand-blue dark:text-brand-gold' : 'text-slate-400'}`}
                            >
                                {TAB_METADATA[t].icon}
                                <span className="text-[10px] mt-1 font-medium">{TAB_METADATA[t].label}</span>
                            </button>
                        ))}
                    </nav>
                    {toastMessage && <Toast message={toastMessage} onClose={() => setToastMessage(null)} actionLabel={toastAction?.label} onAction={toastAction?.fn} />}
                    {showTutorial && <Tutorial onComplete={handleTutorialComplete} onStepChange={handleTutorialStepChange} />}
                    {showTrialModal && <TrialModal daysRemaining={daysRemaining} onClose={() => setShowTrialModal(false)} />}
                    <Inbox userId={user} isOpen={showInbox} onClose={() => setShowInbox(false)} onUpdateUnread={checkUnreadMessages} />
                    <CalculatorModal isOpen={showCalculatorModal} onClose={() => setShowCalculatorModal(false)} />
                    {showRecurringExpenses && <RecurringExpenses config={config} onClose={() => setShowRecurringExpenses(false)} />}
                    {showImportModal && (
                        <StatementImportModal
                            isOpen={showImportModal}
                            onClose={() => setShowImportModal(false)}
                            onImport={handleBatchImport}
                            config={config}
                        />
                    )}

                    {/* Prompt de Instalação PWA */}
                    <InstallPrompt />

                    {/* AI Advisor Chat (Global) */}
                    <AIAdvisor userId={user} transactions={transactions} goals={goals} />



                </main>
            </div>
        </BiometricGate>
    );
};

const App: React.FC = () => {
    const [user, setUser] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setUser(session?.user?.id ?? null);
            setLoading(false);
        });

        // Listen for changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user?.id ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleLogout = async () => {
        await DBService.logout();
    };

    if (loading) {
        return <div className="h-screen w-full flex items-center justify-center bg-background transition-colors"><Loader2 className="animate-spin text-primary" size={48} /></div>;
    }

    if (window.location.pathname === '/apresentacao') {
        return <Presell />;
    }

    if (!user) {
        return <Login onLogin={() => { }} />;
    }

    return (
        <FinanceApp user={user} onLogout={handleLogout} />
    );
};

export default App;
