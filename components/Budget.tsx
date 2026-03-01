import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, AppConfig, BudgetLimit } from '../types';
import { DBService } from '../db';
import { formatCurrency } from '../utils';
import { Edit2, X, Save, PieChart as PieChartIcon } from 'lucide-react';

interface BudgetProps {
    transactions: Transaction[];
    config: AppConfig;
    filter: { month: number; year: number };
}

export const Budget: React.FC<BudgetProps> = ({ transactions, config, filter }) => {
    const [limits, setLimits] = useState<BudgetLimit[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingLimit, setEditingLimit] = useState<Partial<BudgetLimit>>({});

    // Load limits on mount
    useEffect(() => {
        loadLimits();
    }, [config.userId]);

    const loadLimits = async () => {
        if (!config.userId) return;
        setLoading(true);
        try {
            const data = await DBService.getBudgetLimits(config.userId);
            setLimits(data);
        } catch (error) {
            console.error("Failed to load budget limits", error);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveLimit = async () => {
        if (!config.userId || !editingLimit.category || !editingLimit.amount) return;

        try {
            const id = editingLimit.id || crypto.randomUUID();
            const newLimit: BudgetLimit = {
                id,
                userId: config.userId,
                category: editingLimit.category,
                amount: Number(editingLimit.amount),
                alertThreshold: editingLimit.alertThreshold || 80
            };

            await DBService.saveBudgetLimit(newLimit);
            await loadLimits(); // Reload to refresh list
            setIsModalOpen(false);
            setEditingLimit({});
        } catch (error) {
            console.error("Error saving limit", error);
        }
    };

    const handleDeleteLimit = async (id: string) => {
        if (!confirm('Remover este limite?')) return;
        await DBService.deleteBudgetLimit(id);
        await loadLimits();
    };

    const budgetData = useMemo(() => {
        // Calculate spending per category for current month
        const spending: Record<string, number> = {};

        transactions.forEach(t => {
            if (t.type === 'expense') {
                const d = new Date(t.date + 'T12:00:00');
                if (d.getMonth() === filter.month && d.getFullYear() === filter.year) {
                    spending[t.category] = (spending[t.category] || 0) + t.amount;
                }
            }
        });

        // Combine with limits
        // We want to show all categories that have a limit OR have spending
        const allCategories = new Set([
            ...config.expenseCategories,
            ...Object.keys(spending),
            ...limits.map(l => l.category)
        ]);

        return Array.from(allCategories).map(cat => {
            const spent = spending[cat] || 0;
            const limit = limits.find(l => l.category === cat);
            const limitAmount = limit ? limit.amount : 0;
            const percentage = limitAmount > 0 ? (spent / limitAmount) * 100 : 0;
            const remaining = Math.max(0, limitAmount - spent);

            let status: 'ok' | 'warning' | 'critical' = 'ok';
            if (limit) {
                if (percentage >= 100) status = 'critical';
                else if (percentage >= limit.alertThreshold) status = 'warning';
            }

            return {
                category: cat,
                spent,
                limit: limitAmount,
                percentage,
                remaining,
                status,
                hasLimit: !!limit,
                limitId: limit?.id
            };
        }).sort((a, b) => b.percentage - a.percentage); // Sort by most consumed

    }, [transactions, limits, config.expenseCategories, filter]);

    const totalStats = useMemo(() => {
        const totalLimit = limits.reduce((acc, l) => acc + l.amount, 0);
        const totalSpentWithLimit = budgetData
            .filter(d => d.hasLimit)
            .reduce((acc, d) => acc + d.spent, 0);

        return { totalLimit, totalSpentWithLimit };
    }, [limits, budgetData]);

    const COLORS = ['#10b981', '#f59e0b', '#ef4444'];

    return (
        <div className="space-y-6 animate-fade-in pb-24 md:pb-10">
            {/* Header / Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 bg-gradient-to-r from-slate-800 to-slate-900 text-white p-6 rounded-xl shadow-md relative overflow-hidden">
                    <div className="relative z-10">
                        <h2 className="text-lg font-bold mb-1">Orçamento Familiar</h2>
                        <p className="text-slate-400 text-xs mb-6 uppercase tracking-wider">Visão Geral Mensal</p>

                        <div className="flex flex-col sm:flex-row gap-8">
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Total Orçado</p>
                                <p className="text-3xl font-bold text-emerald-400">{formatCurrency(totalStats.totalLimit)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Realizado (Monitorado)</p>
                                <p className="text-3xl font-bold text-white">{formatCurrency(totalStats.totalSpentWithLimit)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-slate-400 mb-1">Disponível</p>
                                <p className="text-3xl font-bold text-blue-400">{formatCurrency(Math.max(0, totalStats.totalLimit - totalStats.totalSpentWithLimit))}</p>
                            </div>
                        </div>
                    </div>
                    {/* Decorative Background Icon */}
                    <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-1/4 translate-y-1/4">
                        <PieChartIcon size={200} className="w-64 h-64" />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 p-6 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 flex flex-col justify-center items-center text-center">
                    <div className="mb-4 bg-blue-50 dark:bg-blue-900/20 p-4 rounded-full text-blue-600 dark:text-blue-400">
                        <Edit2 size={24} />
                    </div>
                    <h3 className="font-bold text-slate-700 dark:text-slate-200">Gerenciar Limites</h3>
                    <p className="text-sm text-slate-500 mb-4 px-4">Defina tetos de gastos para suas categorias e receba alertas.</p>
                    <button
                        onClick={() => { setEditingLimit({}); setIsModalOpen(true); }}
                        className="bg-brand-blue hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-bold text-sm transition-colors w-full"
                    >
                        Adicionar Limite
                    </button>
                </div>
            </div>

            {/* Budget Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {budgetData.map((item) => (
                    <div key={item.category} className={`bg-white dark:bg-slate-800 p-5 rounded-xl border-l-4 shadow-sm transition-all hover:shadow-md ${!item.hasLimit ? 'border-slate-300 dark:border-slate-600' :
                        item.status === 'critical' ? 'border-rose-500' :
                            item.status === 'warning' ? 'border-amber-500' : 'border-emerald-500'
                        }`}>
                        <div className="flex justify-between items-start mb-3">
                            <h4 className="font-bold text-slate-700 dark:text-slate-200 truncate pr-2">{item.category}</h4>
                            {item.hasLimit ? (
                                <button onClick={() => { setEditingLimit({ category: item.category, amount: item.limit, id: item.limitId }); setIsModalOpen(true); }} className="text-slate-400 hover:text-blue-500 p-1"><Edit2 size={14} /></button>
                            ) : (
                                <button onClick={() => { setEditingLimit({ category: item.category }); setIsModalOpen(true); }} className="text-xs bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors">Definir Meta</button>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between text-xs mb-1">
                                <span className={`font-bold ${item.spent > item.limit && item.hasLimit ? 'text-rose-600' : 'text-slate-600 dark:text-slate-400'
                                    }`}>{formatCurrency(item.spent)}</span>
                                <span className="text-slate-400">{item.hasLimit ? formatCurrency(item.limit) : 'Sem limite'}</span>
                            </div>

                            <div className="w-full bg-slate-100 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden relative">
                                {item.hasLimit ? (
                                    <div
                                        className={`h-full rounded-full transition-all duration-500 ${item.status === 'critical' ? 'bg-rose-500' :
                                            item.status === 'warning' ? 'bg-amber-500' : 'bg-emerald-500'
                                            }`}
                                        style={{ width: `${Math.min(item.percentage, 100)}%` }}
                                    ></div>
                                ) : (
                                    <div className="h-full bg-slate-300 dark:bg-slate-600 w-full opacity-20 stripes"></div>
                                )}
                            </div>

                            {item.hasLimit && (
                                <div className="flex justify-between items-center text-[10px] mt-2">
                                    <span className={`${item.status === 'critical' ? 'text-rose-600 font-bold' :
                                        item.status === 'warning' ? 'text-amber-600 font-bold' : 'text-emerald-600'
                                        }`}>
                                        {item.percentage.toFixed(0)}% Utilizado
                                    </span>
                                    <span className="text-slate-400">
                                        Restante: <span className={item.remaining === 0 ? 'text-rose-500' : 'text-slate-600 dark:text-slate-300'}>{formatCurrency(item.remaining)}</span>
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-md w-full max-w-md overflow-hidden border border-slate-200 dark:border-slate-700">
                        <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center">
                            <h3 className="font-bold text-lg dark:text-white">Definir Orçamento</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-rose-500"><X size={20} /></button>
                        </div>

                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
                                <select
                                    value={editingLimit.category || ''}
                                    onChange={e => setEditingLimit({ ...editingLimit, category: e.target.value })}
                                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-blue"
                                >
                                    <option value="">Selecione...</option>
                                    {config.expenseCategories.map(c => (
                                        <option key={c} value={c}>{c}</option>
                                    ))}
                                    {/* Include categories from transactions that might not be in config */}
                                    {budgetData.filter(b => !config.expenseCategories.includes(b.category)).map(b => (
                                        <option key={b.category} value={b.category}>{b.category}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Limite Mensal (R$)</label>
                                <input
                                    type="number"
                                    value={editingLimit.amount || ''}
                                    onChange={e => setEditingLimit({ ...editingLimit, amount: Number(e.target.value) })}
                                    className="w-full p-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none focus:ring-2 focus:ring-brand-blue text-lg font-bold"
                                    placeholder="0,00"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Alerta em (%)</label>
                                <div className="flex items-center gap-3">
                                    <input
                                        type="range"
                                        min="50" max="100" step="5"
                                        value={editingLimit.alertThreshold || 80}
                                        onChange={e => setEditingLimit({ ...editingLimit, alertThreshold: Number(e.target.value) })}
                                        className="flex-1"
                                    />
                                    <span className="font-bold text-brand-blue w-12 text-right">{editingLimit.alertThreshold || 80}%</span>
                                </div>
                                <p className="text-[10px] text-slate-400 mt-1">Você será notificado quando o gasto atingir essa porcentagem.</p>
                            </div>
                        </div>

                        <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end gap-3">
                            {editingLimit.id && (
                                <button
                                    onClick={() => { if (editingLimit.id) handleDeleteLimit(editingLimit.id); setIsModalOpen(false); }}
                                    className="px-4 py-2 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20 rounded-lg font-bold text-sm transition-colors"
                                >
                                    Excluir
                                </button>
                            )}
                            <button
                                onClick={handleSaveLimit}
                                disabled={!editingLimit.category || !editingLimit.amount}
                                className="bg-brand-blue hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-bold text-sm shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                <Save size={16} /> Salvar Orçamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
