
import React, { useMemo, useState, useEffect } from 'react';
import { Transaction } from '../types';
import { formatCurrency, formatDateRaw, generateId } from '../utils';
import { CreditCard, Calendar, TrendingUp, AlertCircle, ShoppingBag, Plus, Save, X, Trash2 } from 'lucide-react';

interface CreditCardControlProps {
    transactions: Transaction[];
    onDelete: (id: string) => void;
    onAdd: (t: Transaction) => void;
    categories: string[];
    currency?: string;
}

export const CreditCardControl: React.FC<CreditCardControlProps> = ({ transactions, onDelete, onAdd, categories, currency = 'BRL' }) => {
    // --- ADD FORM STATE ---
    const [isAdding, setIsAdding] = useState(false);
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
    const [newAmount, setNewAmount] = useState('');
    const [newCategory, setNewCategory] = useState(categories[0] || '');
    const [newDesc, setNewDesc] = useState('');
    const [installments, setInstallments] = useState(1);
    
    // Ensure categories update if props change
    useEffect(() => {
        if(categories.length > 0 && !newCategory) setNewCategory(categories[0]);
    }, [categories]);

    // Filtrar apenas despesas de Cartão de Crédito
    const cardTransactions = useMemo(() => {
        return transactions.filter(t => 
            t.type === 'expense' && 
            (t.paymentMethod?.toLowerCase().includes('crédito') || t.paymentMethod?.toLowerCase().includes('cartão'))
        ).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [transactions]);

    // Calcular totais
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const stats = useMemo(() => {
        let currentInvoice = 0;
        let totalLimitUsed = 0; // Soma histórica (simulação de limite tomado)
        
        cardTransactions.forEach(t => {
            const d = new Date(t.date + 'T12:00:00');
            totalLimitUsed += t.amount;

            // Fatura Atual (Mês Corrente)
            if (d.getMonth() === currentMonth && d.getFullYear() === currentYear) {
                currentInvoice += t.amount;
            }
        });

        return { currentInvoice, totalLimitUsed };
    }, [cardTransactions, currentMonth, currentYear]);

    const handleSave = () => {
        if (!newAmount || !newCategory || !newDate) return;

        const amountVal = parseFloat(newAmount);
        const numInstallments = Math.max(1, Math.floor(installments));
        const [startYear, startMonth, startDay] = newDate.split('-').map(Number);

        // Gera as parcelas
        for (let i = 0; i < numInstallments; i++) {
            // Lógica de datas para parcelamento (mesmo do SheetView)
            const dateObj = new Date(startYear, (startMonth - 1) + i, startDay, 12, 0, 0, 0);
            const expectedMonthIndex = (startMonth - 1 + i) % 12;
            if (dateObj.getMonth() !== expectedMonthIndex) {
                dateObj.setDate(0);
            }
            
            const dateStr = dateObj.toISOString().split('T')[0];
            
            const description = numInstallments > 1
                ? `${newDesc} (${i + 1}/${numInstallments})`
                : newDesc;

            const transaction: Transaction = {
                id: generateId(),
                userId: 'temp',
                type: 'expense',
                date: dateStr,
                amount: amountVal,
                category: newCategory,
                description: description,
                paymentMethod: 'Crédito' // Forçado para aparecer nesta lista
            };

            onAdd(transaction);
        }

        // Reset
        setNewAmount('');
        setNewDesc('');
        setInstallments(1);
        setIsAdding(false);
    };

    return (
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm flex flex-col h-[calc(100vh-140px)] transition-colors animate-fade-in overflow-hidden">
            
            {/* Header / Dashboard Area */}
            <div className="p-6 bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700 grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Visual Card */}
                <div className="relative h-48 w-full max-w-sm rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-xl overflow-hidden mx-auto md:mx-0 transition-transform hover:scale-[1.02] duration-300">
                    {/* Decorative Circles */}
                    <div className="absolute top-0 right-0 -mr-10 -mt-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-10 -mb-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                    
                    <div className="relative z-10 p-6 flex flex-col justify-between h-full">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2">
                                <CreditCard className="text-brand-gold" size={24} />
                                <span className="text-xs font-semibold tracking-widest uppercase text-slate-300">Cartão Principal</span>
                            </div>
                            <span className="font-mono text-sm tracking-widest opacity-70">**** 3600</span>
                        </div>

                        <div>
                            <p className="text-xs text-slate-400 uppercase mb-1">Fatura Atual ({new Date().toLocaleDateString('pt-BR', { month: 'long' })})</p>
                            <h3 className="text-3xl font-bold tracking-tight">{formatCurrency(stats.currentInvoice, currency)}</h3>
                        </div>

                        <div className="flex justify-between items-end">
                            <div>
                                <p className="text-[10px] text-slate-400 uppercase">Titular</p>
                                <p className="text-sm font-medium tracking-wide">SEU NOME</p>
                            </div>
                            <div className="w-10 h-6 bg-white/20 rounded flex items-center justify-center">
                                <div className="w-4 h-4 bg-red-500/80 rounded-full -mr-2"></div>
                                <div className="w-4 h-4 bg-yellow-500/80 rounded-full"></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Stats / Info */}
                <div className="flex flex-col justify-center gap-4">
                    <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex items-center gap-4">
                        <div className="p-3 bg-rose-100 dark:bg-rose-900/30 text-rose-600 rounded-lg">
                            <TrendingUp size={24} />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase">Total Gasto (Histórico)</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white">{formatCurrency(stats.totalLimitUsed, currency)}</p>
                        </div>
                    </div>

                    <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 text-sm text-blue-800 dark:text-blue-300 flex items-start gap-3">
                        <AlertCircle className="shrink-0 mt-0.5" size={18} />
                        <p>
                            Adicione compras aqui para que sejam registradas automaticamente como <strong>"Crédito"</strong>.
                        </p>
                    </div>
                </div>
            </div>

            {/* Actions Bar */}
            <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-white dark:bg-slate-800 sticky top-0 z-10">
                <h3 className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                    <ShoppingBag size={18} />
                    Extrato de Lançamentos
                </h3>
                <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-400 hidden sm:inline">{cardTransactions.length} registros</span>
                    {!isAdding && (
                        <button
                            onClick={() => setIsAdding(true)}
                            className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-sm text-xs font-medium hover:bg-emerald-700 transition-colors shadow-sm"
                        >
                            <Plus size={14} /> Nova Despesa
                        </button>
                    )}
                </div>
            </div>

            {/* Add Form (Only visible when isAdding is true) */}
            {isAdding && (
                <div className="p-4 border-b border-emerald-100 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-900/10 grid grid-cols-12 gap-3 items-start animate-fade-in relative z-20">
                    <div className="col-span-12 mb-2 flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-xs uppercase tracking-wide">
                        <Plus size={14} /> Adicionar Compra no Cartão
                    </div>

                    <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Data</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => setNewDate(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-sm px-2 py-1.5 text-xs focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Valor {installments > 1 ? '(Mensal)' : ''}</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-sm px-2 py-1.5 text-xs focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Categoria</label>
                        <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-sm px-2 py-1.5 text-xs focus:border-blue-500 outline-none"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>
                    <div className="col-span-6 sm:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Parcelas</label>
                        <input
                            type="number"
                            min="1"
                            max="60"
                            value={installments}
                            onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
                            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-sm px-2 py-1.5 text-xs focus:border-blue-500 outline-none text-center"
                        />
                    </div>
                    <div className="col-span-12 sm:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Descrição</label>
                        <input
                            type="text"
                            placeholder="O que você comprou?"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-sm px-2 py-1.5 text-xs focus:border-blue-500 outline-none"
                        />
                    </div>
                    <div className="col-span-12 sm:col-span-1 flex items-end gap-2 mt-4 sm:mt-0">
                        <button
                            onClick={handleSave}
                            className="p-1.5 bg-emerald-500 text-white rounded-sm hover:bg-emerald-600 transition-colors flex-1 flex justify-center items-center"
                            title="Salvar"
                        >
                            <Save size={16} />
                        </button>
                        <button onClick={() => setIsAdding(false)} className="p-1.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-sm hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors flex-1 flex justify-center items-center">
                            <X size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Transactions List Container */}
            <div className="flex-1 overflow-auto custom-scrollbar p-0 bg-white dark:bg-slate-800">
                {/* Desktop Table */}
                <table className="w-full text-left border-collapse hidden md:table">
                    <thead className="bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
                        <tr>
                            <th className="py-3 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Data</th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Descrição</th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Categoria</th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-right">Valor</th>
                            <th className="py-3 px-6 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                        {cardTransactions.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="py-12 text-center text-slate-400 dark:text-slate-500">
                                    Nenhuma compra no cartão encontrada.
                                </td>
                            </tr>
                        ) : (
                            cardTransactions.map(t => (
                                <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors group">
                                    <td className="py-3 px-6 text-xs text-slate-600 dark:text-slate-300 font-mono">
                                        <div className="flex items-center gap-2">
                                            <Calendar size={12} className="text-slate-400" />
                                            {formatDateRaw(t.date)}
                                        </div>
                                    </td>
                                    <td className="py-3 px-6 text-sm text-slate-700 dark:text-slate-200 font-medium">
                                        {t.description}
                                    </td>
                                    <td className="py-3 px-6 text-xs text-slate-500 dark:text-slate-400">
                                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-700 border border-slate-200 dark:border-slate-600">
                                            {t.category}
                                        </span>
                                    </td>
                                    <td className="py-3 px-6 text-sm font-bold font-mono text-rose-600 dark:text-rose-400 text-right">
                                        {formatCurrency(t.amount, currency)}
                                    </td>
                                    <td className="py-3 px-6 text-center">
                                        <button 
                                            onClick={() => onDelete(t.id)}
                                            className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>

                {/* Mobile Card List */}
                <div className="md:hidden p-4 space-y-3 pb-20">
                    {cardTransactions.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 dark:text-slate-500">
                            Nenhuma compra encontrada.
                        </div>
                    ) : (
                        cardTransactions.map(t => (
                            <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-start animate-fade-in">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                                            {t.category}
                                        </span>
                                    </div>
                                    <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{t.description || 'Sem descrição'}</h4>
                                    <div className="flex items-center gap-2 text-xs text-slate-400">
                                        <Calendar size={10}/> {formatDateRaw(t.date)}
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <span className="text-sm font-black font-mono text-rose-600 dark:text-rose-400">
                                        {formatCurrency(t.amount, currency)}
                                    </span>
                                    <button onClick={() => onDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-700 rounded-lg transition-colors">
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};
