import React, { useState, useMemo } from 'react';
import { Transaction, Goal, AppConfig, FilterState, Tab, BankAccount } from '../types';
import { formatCurrency, getBudgetCategoryType } from '../utils';
import { MONTH_NAMES } from '../constants';
import { Utensils, Car, Home, HeartPulse, PartyPopper, GraduationCap, Banknote, ShoppingBag, Zap, CircleDollarSign, TrendingUp, Search, Calendar, Tag, CreditCard, Inbox, ArrowDownRight, ArrowUpRight, X } from 'lucide-react';

interface OutlookDashboardProps {
    transactions: Transaction[];
    goals: Goal[];
    filter: FilterState;
    currency?: string;
    isPremium?: boolean;
    config?: AppConfig;
    onNavigate?: (tab: Tab) => void;
    bankAccounts?: BankAccount[];
}

const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('aliment')) return <Utensils size={18} />;
    if (lower.includes('transporte') || lower.includes('carro')) return <Car size={18} />;
    if (lower.includes('moradia') || lower.includes('casa')) return <Home size={18} />;
    if (lower.includes('saúde') || lower.includes('medico')) return <HeartPulse size={18} />;
    if (lower.includes('lazer') || lower.includes('viagem')) return <PartyPopper size={18} />;
    if (lower.includes('educa') || lower.includes('curso')) return <GraduationCap size={18} />;
    if (lower.includes('salário')) return <Banknote size={18} />;
    if (lower.includes('invest')) return <TrendingUp size={18} />;
    if (lower.includes('mercado')) return <ShoppingBag size={18} />;
    if (lower.includes('luz') || lower.includes('agua')) return <Zap size={18} />;
    return <CircleDollarSign size={18} />;
};

export const OutlookDashboard: React.FC<OutlookDashboardProps> = ({ transactions, goals, filter, currency = 'BRL', config, onNavigate, bankAccounts = [] }) => {
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredTransactions = useMemo<Transaction[]>(() => {
        return transactions.filter(t => {
            const d = new Date(t.date + 'T12:00:00');
            const matchesMonth = d.getMonth() === filter.month && d.getFullYear() === filter.year;
            const matchesSearch = t.description?.toLowerCase().includes(searchTerm.toLowerCase()) || t.category?.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesMonth && matchesSearch;
        }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions, filter, searchTerm]);

    const kpiData = useMemo(() => {
        const income = filteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = income - expense;
        return { income, expense, balance };
    }, [filteredTransactions]);

    return (
        <div className="flex h-full w-full gap-4 overflow-hidden">
            {/* Middle Pane: Inbox (Transaction List) */}
            <div className="w-[380px] shrink-0 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl flex flex-col shadow-sm overflow-hidden">
                
                {/* Search Bar & Header */}
                <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex flex-col gap-3">
                    <div className="flex justify-between items-center">
                        <h2 className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                            <Inbox size={20} className="text-brand-blue" />
                            Transações
                        </h2>
                    </div>
                    <div className="relative">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                        <input 
                            type="text" 
                            placeholder="Pesquisar..." 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            className="w-full bg-slate-100 dark:bg-slate-800 border-none rounded-md pl-9 pr-3 py-2 text-sm focus:ring-1 focus:ring-brand-blue outline-none text-slate-800 dark:text-slate-200"
                        />
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto custom-scrollbar">
                    {filteredTransactions.length === 0 ? (
                        <div className="p-8 text-center text-slate-500 text-sm">Nenhuma transação encontrada.</div>
                    ) : (
                        filteredTransactions.map(t => (
                            <div 
                                key={t.id} 
                                onClick={() => setSelectedTransaction(t)}
                                className={`flex items-start gap-3 p-4 border-b border-slate-100 dark:border-slate-800/50 cursor-pointer transition-colors ${selectedTransaction?.id === t.id ? 'bg-brand-blue/5 dark:bg-brand-blue/10 border-l-4 border-l-brand-blue' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 border-l-4 border-l-transparent'}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${t.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'}`}>
                                    {getCategoryIcon(t.category)}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-200 truncate pr-2">{t.description || t.category}</p>
                                        <p className="text-xs text-slate-500 shrink-0">{new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}</p>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <p className="text-xs text-slate-500 truncate">{t.category}</p>
                                        <p className={`text-sm font-bold ${t.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-300'}`}>
                                            {t.type === 'expense' ? '-' : ''}{formatCurrency(t.amount, currency).replace('R$', '').trim()}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Right Pane: Reading Pane / Summary */}
            <div className="flex-1 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 rounded-xl overflow-y-auto custom-scrollbar shadow-sm">
                {selectedTransaction ? (
                    <div className="p-8 max-w-2xl mx-auto h-full flex flex-col">
                        <div className="flex justify-between items-center mb-8 pb-6 border-b border-slate-200 dark:border-slate-800">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Detalhes da Transação</h2>
                            <button onClick={() => setSelectedTransaction(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors text-slate-500">
                                <X size={20} />
                            </button>
                        </div>

                        <div className="flex flex-col items-center justify-center py-8 mb-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
                            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-4 shadow-sm ${selectedTransaction.type === 'income' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-white dark:bg-slate-700 text-slate-600 dark:text-slate-300'}`}>
                                {getCategoryIcon(selectedTransaction.category)}
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-1">{selectedTransaction.description || selectedTransaction.category}</h3>
                            <p className={`text-3xl font-black ${selectedTransaction.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-100'}`}>
                                {selectedTransaction.type === 'expense' ? '-' : ''}{formatCurrency(selectedTransaction.amount, currency)}
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-6 mb-8">
                            <div>
                                <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2"><Calendar size={14}/> Data</p>
                                <p className="text-base text-slate-800 dark:text-slate-200 font-medium">{new Date(selectedTransaction.date).toLocaleDateString('pt-BR')}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2"><Tag size={14}/> Categoria</p>
                                <p className="text-base text-slate-800 dark:text-slate-200 font-medium">{selectedTransaction.category}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2"><CreditCard size={14}/> Pagamento</p>
                                <p className="text-base text-slate-800 dark:text-slate-200 font-medium">{selectedTransaction.paymentMethod || 'Não informado'}</p>
                            </div>
                            <div>
                                <p className="text-sm font-semibold text-slate-400 mb-1 flex items-center gap-2"><CircleDollarSign size={14}/> Tipo</p>
                                <p className="text-base text-slate-800 dark:text-slate-200 font-medium">{selectedTransaction.type === 'income' ? 'Receita' : 'Despesa'}</p>
                            </div>
                        </div>

                        <div className="mt-auto pt-6 border-t border-slate-200 dark:border-slate-800 flex justify-end gap-3">
                            <button 
                                onClick={() => { if(onNavigate) onNavigate(selectedTransaction.type === 'income' ? 'receitas' : 'despesas'); }}
                                className="px-5 py-2 text-sm font-bold text-white bg-brand-blue hover:bg-blue-700 rounded-lg transition-colors shadow-sm"
                            >
                                Editar (Ir para Lista)
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="p-8 h-full">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-800 dark:text-slate-100">Resumo de {MONTH_NAMES[filter.month]}</h2>
                            <p className="text-slate-500 text-sm mt-1">Selecione uma transação ao lado para ver os detalhes, ou acompanhe seus saldos abaixo.</p>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <p className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2"><ArrowDownRight size={16} className="text-emerald-500"/> Receitas</p>
                                <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(kpiData.income, currency)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <p className="text-sm font-semibold text-slate-500 mb-2 flex items-center gap-2"><ArrowUpRight size={16} className="text-rose-500"/> Despesas</p>
                                <p className="text-2xl font-black text-slate-800 dark:text-slate-200">{formatCurrency(kpiData.expense, currency)}</p>
                            </div>
                            <div className="bg-slate-50 dark:bg-slate-800/50 p-5 rounded-xl border border-slate-200 dark:border-slate-800">
                                <p className="text-sm font-semibold text-slate-500 mb-2">Saldo do Mês</p>
                                <p className={`text-2xl font-black ${kpiData.balance >= 0 ? 'text-brand-blue' : 'text-rose-500'}`}>{formatCurrency(kpiData.balance, currency)}</p>
                            </div>
                        </div>

                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Minhas Contas</h3>
                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {bankAccounts.length > 0 ? bankAccounts.map(account => (
                                    <div key={account.id} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800">
                                        <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 mb-2">{account.name}</p>
                                        <p className="text-xl font-black text-slate-800 dark:text-slate-100">
                                            {formatCurrency(account.currentBalance ?? account.initialBalance, currency)}
                                        </p>
                                    </div>
                                )) : (
                                    <div className="col-span-full p-4 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-center text-slate-500 text-sm">
                                        Nenhuma conta cadastrada.
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};
