import React, { useState, useMemo, useEffect } from 'react';
import { SmartInputModal } from './SmartInputModal';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, generateId, formatDateRaw } from '../utils';
import { Plus, Trash2, Save, X, CalendarClock, AlertCircle, Search, Filter, XCircle, Utensils, Car, Home, HeartPulse, PartyPopper, GraduationCap, Banknote, ShoppingBag, Zap, CircleDollarSign, Edit2, ArrowUp, ArrowDown, Calendar, CreditCard, RefreshCw, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SheetViewProps {
    type: TransactionType;
    transactions: Transaction[];
    categories: string[];
    paymentMethods: string[];
    onAdd: (t: Transaction) => void;
    onAddBatch?: (transactions: Transaction[]) => void;
    onUpdate: (t: Transaction) => void;
    onDelete: (id: string) => void;
    currency?: string;
}

// Helper to get Icon based on category name
const getCategoryIcon = (category: string) => {
    const lower = category.toLowerCase();
    if (lower.includes('aliment')) return <Utensils size={14} />;
    if (lower.includes('transporte') || lower.includes('carro')) return <Car size={14} />;
    if (lower.includes('moradia') || lower.includes('casa')) return <Home size={14} />;
    if (lower.includes('saúde') || lower.includes('medico')) return <HeartPulse size={14} />;
    if (lower.includes('lazer') || lower.includes('viagem')) return <PartyPopper size={14} />;
    if (lower.includes('educa') || lower.includes('escola')) return <GraduationCap size={14} />;
    if (lower.includes('salário')) return <Banknote size={14} />;
    if (lower.includes('invest')) return <CircleDollarSign size={14} />;
    if (lower.includes('mercado')) return <ShoppingBag size={14} />;
    if (lower.includes('luz') || lower.includes('agua')) return <Zap size={14} />;
    return <CircleDollarSign size={14} />;
};

export const SheetView: React.FC<SheetViewProps> = ({
    type,
    transactions,
    categories,
    paymentMethods,
    onAdd,
    onAddBatch,
    onUpdate,
    onDelete,
    currency = 'BRL'
}) => {
    // Get today's date in 'YYYY-MM-DD' format based on local timezone to ensure accurate comparison
    const { todayStr, firstDayOfMonth, lastDayOfMonth } = useMemo(() => {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const lastDay = new Date(year, now.getMonth() + 1, 0).getDate();

        return {
            todayStr: `${year}-${month}-${day}`,
            firstDayOfMonth: `${year}-${month}-01`,
            lastDayOfMonth: `${year}-${month}-${lastDay}`
        };
    }, []);

    // Unified initialization logic
    useEffect(() => {
        setIsAdding(false);
        setEditingId(null);
        setShowFilters(false);
        setSearchTerm('');
        setFilterCategory('');
        setFilterPaymentMethod('');
        // STRICTLY CURRENT MONTH (User request: "apenas ... do mês atual")
        setStartDate(firstDayOfMonth);
        setEndDate(lastDayOfMonth);
        setMinValue('');
        setMaxValue('');
        setNewDate(todayStr);
        setNewAmount('');
        setNewDesc('');
        setInstallments(1);
        setIsRecurring(false);
        setDateError('');
        if (categories.length > 0) setNewCategory(categories[0]);
        if (paymentMethods.length > 0) setNewPayment(paymentMethods[0]);
    }, [type, categories, paymentMethods, todayStr, firstDayOfMonth, lastDayOfMonth]);

    const [isSmartInputOpen, setIsSmartInputOpen] = useState(false);

    const handleSmartSave = (partialT: Partial<Transaction>) => {
        const t: Transaction = {
            id: generateId(),
            userId: 'temp',
            type: type, // Force current sheet type for safety, or we could trust the AI
            date: partialT.date || todayStr,
            amount: partialT.amount || 0,
            category: partialT.category || categories[0],
            description: partialT.description || 'Smart Input',
            paymentMethod: partialT.paymentMethod,
            isRecurring: false
        };

        onAdd(t);

        // Check visibility
        const isOutsideView = (t.date < startDate) || (t.date > endDate && endDate !== '');
        if (isOutsideView) {
            setStartDate('');
            setEndDate('');
            setSortConfig({ key: 'date', direction: 'desc' });
            setShowFilters(true);
        }
    };

    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // --- Search & Filter State ---
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPaymentMethod, setFilterPaymentMethod] = useState(''); // New Payment Filter
    const [startDate, setStartDate] = useState(firstDayOfMonth); // Default to current month start
    const [endDate, setEndDate] = useState('');     // Default: No end date limit (shows future)
    const [minValue, setMinValue] = useState('');
    const [maxValue, setMaxValue] = useState('');

    // --- Sorting State ---
    const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'amount'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'desc' });

    // --- New Transaction State ---
    const [newDate, setNewDate] = useState(todayStr);
    const [newAmount, setNewAmount] = useState('');
    const [newCategory, setNewCategory] = useState(categories[0] || '');
    const [newDesc, setNewDesc] = useState('');
    const [newPayment, setNewPayment] = useState(paymentMethods[0] || '');
    // State for installments/recurrence
    const [installments, setInstallments] = useState(1);
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceDay, setRecurrenceDay] = useState<number>(1);

    // Error state for validation
    const [dateError, setDateError] = useState('');




    const handleEdit = (t: Transaction) => {
        setEditingId(t.id);
        setNewDate(t.date);
        setNewAmount(t.amount.toString());
        setNewCategory(t.category);
        setNewDesc(t.description);
        setNewDesc(t.description);
        if (t.paymentMethod) setNewPayment(t.paymentMethod);
        setInstallments(1); // Disable installment logic when editing single item
        setIsRecurring(!!t.isRecurring);
        setRecurrenceDay(t.recurrenceDay || parseInt(t.date.split('-')[2]));
        setIsAdding(true);
        setDateError('');
    };

    const handleSave = () => {
        // Basic fields check
        if (!newAmount || !newCategory || !newDate) return;



        const amountVal = parseFloat(newAmount);

        if (editingId) {
            // --- UPDATE MODE ---
            const updatedTransaction: Transaction = {
                id: editingId,
                userId: 'temp', // handled by App
                type,
                date: newDate,
                amount: amountVal,
                category: newCategory,
                description: newDesc,
                paymentMethod: type === 'expense' ? newPayment : undefined,
                isRecurring,
                recurrenceDay: isRecurring ? (recurrenceDay || parseInt(newDate.split('-')[2])) : undefined
            };
            onUpdate(updatedTransaction);
        } else {
            // --- CREATE MODE (With Installments support) ---
            // If Recurring, force only 1 instance (the template)
            const numInstallments = isRecurring ? 1 : Math.max(1, Math.floor(installments));
            const [startYear, startMonth, startDay] = newDate.split('-').map(Number);

            const transactionsToAdd: Transaction[] = [];

            for (let i = 0; i < numInstallments; i++) {
                // Usa o construtor Date para lidar com virada de ano e mês automaticamente
                // Meses em JS são 0-indexados (0=Jan, 11=Dez)
                // Definimos 12:00 para evitar problemas de fuso horário
                const dateObj = new Date(startYear, (startMonth - 1) + i, startDay, 12, 0, 0, 0);

                // Verificação de "Dia Inexistente" (Ex: 31 de Jan + 1 mês = 03 de Março no padrão JS)
                // Queremos que vá para o último dia de Fevereiro (28 ou 29)
                // Lógica: Se o mês resultante do objeto Date for diferente do mês esperado matematicamente,
                // significa que o dia "estourou" o mês.
                const expectedMonthIndex = (startMonth - 1 + i) % 12;

                if (dateObj.getMonth() !== expectedMonthIndex) {
                    // Voltar para o dia 0 do mês atual do objeto, que equivale ao último dia do mês anterior (o mês correto)
                    dateObj.setDate(0);
                }

                const dateStr = dateObj.toISOString().split('T')[0];

                const description = numInstallments > 1
                    ? `${newDesc} (${i + 1}/${numInstallments})`
                    : (isRecurring ? `${newDesc} (Recorrente)` : newDesc);

                const transaction: Transaction = {
                    id: generateId(),
                    userId: 'temp',
                    type,
                    date: dateStr,
                    amount: amountVal,
                    category: newCategory,
                    description: description,
                    paymentMethod: type === 'expense' ? newPayment : undefined,
                    isRecurring: isRecurring && i === 0, // Only the first one is marked recurring if user somehow did installments + recurring (should be blocked by UI but safe check)
                    recurrenceDay: (isRecurring && i === 0) ? (recurrenceDay || parseInt(dateStr.split('-')[2])) : undefined
                };

                transactionsToAdd.push(transaction);
            }

            // Batch optimization or single add
            if (onAddBatch && transactionsToAdd.length > 0) {
                onAddBatch(transactionsToAdd);
            } else {
                transactionsToAdd.forEach(t => onAdd(t));
            }
        }

        // Check if the new date is outside the current view
        const isOutsideView = (newDate < startDate) || (newDate > endDate);

        // If outside view, clear filters to show everything and ensure visibility
        if (isOutsideView) {
            setStartDate('');
            setEndDate('');
            setSortConfig({ key: 'date', direction: 'desc' });
            setShowFilters(true);
        }

        // Reset form
        setNewAmount('');
        setNewDesc('');
        setInstallments(1);
        setIsRecurring(false);
        setDateError('');
        setEditingId(null);
        setIsAdding(false);
    };

    const handleCancel = () => {
        setIsAdding(false);
        setEditingId(null);
        setInstallments(1);
        setIsRecurring(false);
        setNewAmount('');
        setNewDesc('');
        setDateError('');
    };

    const clearFilters = () => {
        setSearchTerm('');
        setFilterCategory('');
        setFilterPaymentMethod('');
        setStartDate('');
        setEndDate('');
        setMinValue('');
        setMaxValue('');
    };

    const activeFiltersCount = (searchTerm ? 1 : 0) +
        (filterCategory ? 1 : 0) +
        (filterPaymentMethod ? 1 : 0) +
        (startDate ? 1 : 0) +
        (endDate ? 1 : 0) +
        (minValue ? 1 : 0) +
        (maxValue ? 1 : 0);

    // Filter transactions logic
    const sheetData = useMemo(() => {
        return transactions
            .filter(t => t.type === type)
            .filter(t => {
                // Text Search
                const searchLower = searchTerm.toLowerCase();
                const matchesSearch =
                    t.description.toLowerCase().includes(searchLower) ||
                    t.category.toLowerCase().includes(searchLower) ||
                    (t.paymentMethod && t.paymentMethod.toLowerCase().includes(searchLower));

                // Category Filter
                const matchesCategory = filterCategory ? t.category === filterCategory : true;

                // Payment Method Filter
                const matchesPayment = filterPaymentMethod ? t.paymentMethod === filterPaymentMethod : true;

                // Date Range
                const matchesStart = startDate ? t.date >= startDate : true;
                const matchesEnd = endDate ? t.date <= endDate : true;

                // Value Range
                const val = t.amount;
                const min = minValue ? parseFloat(minValue) : -Infinity;
                const max = maxValue ? parseFloat(maxValue) : Infinity;
                const matchesValue = val >= min && val <= max;

                return matchesSearch && matchesCategory && matchesPayment && matchesStart && matchesEnd && matchesValue;
            })
            .sort((a, b) => {
                const { key, direction } = sortConfig;

                if (key === 'date') {
                    if (direction === 'asc') {
                        return a.date.localeCompare(b.date);
                    } else {
                        return b.date.localeCompare(a.date);
                    }
                } else if (key === 'amount') {
                    if (direction === 'asc') {
                        return a.amount - b.amount;
                    } else {
                        return b.amount - a.amount;
                    }
                }
                return 0;
            });
    }, [transactions, type, searchTerm, filterCategory, filterPaymentMethod, startDate, endDate, minValue, maxValue, sortConfig]);

    // Calculate Total Value of filtered items
    const totalValue = useMemo(() => {
        return sheetData.reduce((acc, curr) => acc + curr.amount, 0);
    }, [sheetData]);

    const handleSort = (key: 'date' | 'amount') => {
        setSortConfig(current => {
            if (current.key === key) {
                return { key, direction: current.direction === 'asc' ? 'desc' : 'asc' };
            }
            return { key, direction: 'asc' };
        });
    };

    return (
        <div className="bg-surface border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] transition-colors relative">
            {/* Toolbar */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 bg-surfaceHighlight/50">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <h2 className="font-semibold text-textMain flex items-center gap-2 whitespace-nowrap text-sm uppercase tracking-wide">
                        <div className={`w-2.5 h-2.5 rounded-full ${type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        {type === 'income' ? 'Planilha de Receitas' : 'Planilha de Despesas'}
                    </h2>

                    {/* Quick Search */}
                    <div className="relative hidden md:block">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={12} />
                        <input
                            type="text"
                            placeholder="Buscar registro..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 pr-3 py-1 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 transition-all"
                        />
                    </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-xs font-medium transition-colors border relative ${showFilters || activeFiltersCount > 0
                            ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-surfaceHighlight dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700'
                            }`}
                    >
                        <Filter size={14} />
                        <span className="hidden sm:inline">Filtros</span>
                        {activeFiltersCount > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-rose-500 text-white text-[9px] flex items-center justify-center rounded-full font-bold shadow-sm">
                                {activeFiltersCount}
                            </span>
                        )}
                    </button>
                    {/* Desktop Button */}
                    <button
                        onClick={() => setIsSmartInputOpen(true)}
                        className="hidden md:flex items-center gap-2 bg-gradient-to-r from-violet-600 to-indigo-600 text-white px-4 py-1.5 rounded-sm text-xs font-bold hover:shadow-lg hover:shadow-indigo-500/30 transition-all active:scale-95 whitespace-nowrap border border-white/10"
                    >
                        <Sparkles size={14} className="text-yellow-300" />
                        Smart Add
                    </button>

                    <button
                        onClick={() => {
                            // Reset everything first
                            setIsAdding(true);
                            setEditingId(null);
                            setInstallments(1);
                            setIsRecurring(false);
                            setNewDesc('');
                            setNewAmount('');
                            setSearchTerm('');
                            setFilterCategory('');
                            setFilterPaymentMethod('');

                            // FORCE CURRENT MONTH VIEW
                            setStartDate(firstDayOfMonth);
                            setEndDate(lastDayOfMonth); // Explicitly limit to end of month

                            setNewDate(todayStr);
                        }}
                        className="hidden md:flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-sm text-xs font-medium hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus size={14} />
                        Adicionar Linha
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="p-4 bg-surfaceHighlight border-b border-slate-200 dark:border-slate-700 animate-fade-in">
                    <div className={`grid grid-cols-1 gap-4 ${type === 'expense' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
                        {/* Mobile Search - Only visible on small screens */}
                        <div className="md:hidden col-span-1">
                            <label className="block text-xs font-semibold text-textMuted mb-1">Buscar</label>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                                <input
                                    type="text"
                                    placeholder="Descrição..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-8 pr-3 py-1.5 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-textMuted mb-1">Período</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-sm focus:outline-none focus:border-blue-500"
                                />
                                <span className="text-slate-400 text-xs">até</span>
                                <input
                                    type="date"
                                    value={endDate}
                                    onChange={(e) => setEndDate(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-xs font-semibold text-textMuted mb-1">Categoria</label>
                            <select
                                value={filterCategory}
                                onChange={(e) => setFilterCategory(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-sm focus:outline-none focus:border-blue-500"
                            >
                                <option value="">Todas</option>
                                {categories.map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>

                        {type === 'expense' && (
                            <div>
                                <label className="block text-xs font-semibold text-textMuted mb-1">Método Pagto</label>
                                <select
                                    value={filterPaymentMethod}
                                    onChange={(e) => setFilterPaymentMethod(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-sm focus:outline-none focus:border-blue-500"
                                >
                                    <option value="">Todos</option>
                                    {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
                                </select>
                            </div>
                        )}

                        <div>
                            <label className="block text-xs font-semibold text-textMuted mb-1">Valor ({currency})</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="number"
                                    placeholder="Mín 0.00"
                                    value={minValue}
                                    onChange={(e) => setMinValue(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-sm focus:outline-none focus:border-blue-500"
                                />
                                <span className="text-slate-400">-</span>
                                <input
                                    type="number"
                                    placeholder="Máx..."
                                    value={maxValue}
                                    onChange={(e) => setMaxValue(e.target.value)}
                                    className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-sm focus:outline-none focus:border-blue-500"
                                />
                            </div>
                        </div>

                        <div className="flex items-end">
                            <button
                                onClick={clearFilters}
                                disabled={activeFiltersCount === 0}
                                className={`w-full px-3 py-1.5 text-xs font-medium border rounded-sm transition-colors flex items-center justify-center gap-1 ${activeFiltersCount > 0
                                    ? 'text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-900/20 hover:bg-rose-100 dark:hover:bg-rose-900/40'
                                    : 'text-slate-400 border-slate-200 dark:border-slate-700 bg-surfaceHighlight cursor-not-allowed'
                                    }`}
                            >
                                <XCircle size={14} /> Limpar Filtros
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Input Row (Sheet Style) - Only visible when adding */}
            {isAdding && (
                <div className={`p-4 border-b grid grid-cols-12 gap-3 items-start animate-fade-in relative z-20 ${editingId
                    ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-800'
                    }`}>
                    {editingId && (
                        <div className="col-span-12 mb-2 flex items-center gap-2 text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wide">
                            <Edit2 size={14} /> Editando Linha
                        </div>
                    )}

                    <div className="col-span-12 md:col-span-2">
                        <label className="block text-[10px] font-bold text-textMuted mb-1 uppercase">Data</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => { setNewDate(e.target.value); setDateError(''); }}
                            className={`w-full border ${dateError ? 'border-rose-500' : 'border-slate-300 dark:border-slate-600'} dark:bg-slate-800 dark:text-white rounded-sm px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none`}
                        />

                    </div>
                    <div className="col-span-6 md:col-span-2">
                        <label className="block text-[10px] font-bold text-textMuted mb-1 uppercase">Valor {installments > 1 ? '(Mensal)' : ''}</label>
                        <input
                            type="number"
                            step="0.01"
                            placeholder="0.00"
                            value={newAmount}
                            onChange={(e) => setNewAmount(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-sm px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="col-span-6 md:col-span-2">
                        <label className="block text-[10px] font-bold text-textMuted mb-1 uppercase">Categoria</label>
                        <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-sm px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        >
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    {/* Conditional Payment Method - Only Expense */}
                    {type === 'expense' && (
                        <div className="col-span-6 md:col-span-2">
                            <label className="block text-[10px] font-bold text-textMuted mb-1 uppercase">Pagamento</label>
                            <select
                                value={newPayment}
                                onChange={(e) => setNewPayment(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-sm px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            >
                                {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                    )}

                    {/* Installments / Recurrence */}
                    <div className="col-span-6 md:col-span-2 flex gap-2">
                        <div className="flex-1">
                            <label className="block text-[10px] font-bold text-textMuted mb-1 uppercase" title="Número de meses/parcelas">
                                {type === 'expense' ? 'Parc.' : 'Qtd.'}
                            </label>
                            <input
                                type="number"
                                min="1"
                                max="60"
                                disabled={!!editingId || isRecurring} // Disable when editing existing or recurring
                                value={installments}
                                onChange={(e) => {
                                    setInstallments(parseInt(e.target.value) || 1);
                                    setDateError('');
                                }}
                                className={`w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-sm px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center ${(editingId || isRecurring) ? 'opacity-50 cursor-not-allowed' : ''}`}
                            />
                        </div>
                        <div className="flex items-center h-full pt-4">
                            <label className="flex items-center gap-1.5 cursor-pointer select-none">
                                <input
                                    type="checkbox"
                                    checked={isRecurring}
                                    onChange={(e) => {
                                        setIsRecurring(e.target.checked);
                                        if (e.target.checked) setInstallments(1);
                                    }}
                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 border-gray-300"
                                />
                                <span className="text-[10px] font-bold text-textMuted uppercase">Recorrente?</span>
                            </label>
                        </div>
                    </div>

                    <div className="col-span-12 md:col-span-3">
                        <label className="block text-[10px] font-bold text-textMuted mb-1 uppercase">Descrição</label>
                        <input
                            type="text"
                            placeholder="Descrição opcional"
                            value={newDesc}
                            onChange={(e) => setNewDesc(e.target.value)}
                            className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded-sm px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>

                    <div className="col-span-12 flex justify-end gap-2 mt-2">
                        <button
                            onClick={handleSave}
                            className={`flex-1 md:flex-none px-4 py-2 text-white rounded-sm transition-colors flex items-center justify-center gap-2 ${editingId ? 'bg-amber-500 hover:bg-amber-600' : 'bg-emerald-500 hover:bg-emerald-600'}`}
                        >
                            <Save size={16} />
                            {editingId ? 'Atualizar' : 'Salvar'}
                        </button>
                        <button onClick={handleCancel} className="px-4 py-2 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 rounded-sm hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* Spreadsheet Table Area - Modern Clean Table */}
            <div className="flex-1 overflow-auto custom-scrollbar relative bg-white dark:bg-slate-900">
                {/* Desktop Table */}
                <table className="w-full text-left border-collapse hidden md:table">
                    <thead className="bg-white dark:bg-slate-900 sticky top-0 z-10 shadow-sm border-b border-slate-200 dark:border-slate-700">
                        <tr>
                            <th className="py-3 px-4 text-xs font-semibold text-textMuted uppercase tracking-wider w-32 cursor-pointer hover:text-blue-600 transition-colors select-none" onClick={() => handleSort('date')}>
                                <div className="flex items-center gap-1">
                                    Data
                                    {sortConfig.key === 'date' && (sortConfig.direction === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                                </div>
                            </th>
                            <th className="py-3 px-4 text-xs font-semibold text-textMuted uppercase tracking-wider w-40 cursor-pointer hover:text-blue-600 transition-colors select-none" onClick={() => handleSort('amount')}>
                                <div className="flex items-center gap-1 justify-end pr-2">
                                    Valor
                                    {sortConfig.key === 'amount' && (sortConfig.direction === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />)}
                                </div>
                            </th>
                            <th className="py-3 px-4 text-xs font-semibold text-textMuted uppercase tracking-wider w-48">Categoria</th>
                            {type === 'expense' && <th className="py-3 px-4 text-xs font-semibold text-textMuted uppercase tracking-wider w-40">Pagamento</th>}
                            <th className="py-3 px-4 text-xs font-semibold text-textMuted uppercase tracking-wider">Descrição</th>
                            <th className="py-3 px-4 text-xs font-semibold text-textMuted uppercase tracking-wider w-20 text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sheetData.length === 0 ? (
                            <tr>
                                <td colSpan={type === 'expense' ? 6 : 5} className="py-16 text-center text-slate-400 dark:text-slate-500 italic">
                                    Nenhuma transação encontrada.
                                </td>
                            </tr>
                        ) : (
                            <AnimatePresence mode="popLayout">
                                {sheetData.map((t, idx) => (
                                    <motion.tr
                                        key={t.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20, backgroundColor: 'rgba(244, 63, 94, 0.1)' }}
                                        transition={{ duration: 0.2 }}
                                        className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors group"
                                    >
                                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 font-medium">
                                            <div className="flex items-center gap-2">
                                                {formatDateRaw(t.date)}
                                                {t.date === todayStr && <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mb-0.5" title="Hoje"></span>}
                                                {t.isRecurring && (
                                                    <span title="Recorrente">
                                                        <RefreshCw size={10} className="text-purple-400" />
                                                    </span>
                                                )}
                                            </div>
                                        </td>
                                        <td className={`py-3 px-4 text-sm font-bold text-right font-mono tabular-nums pr-6 ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-textMain'}`}>
                                            {formatCurrency(t.amount, currency)}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${type === 'income'
                                                ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-900'
                                                : 'bg-indigo-50 text-indigo-700 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-900'
                                                }`}>
                                                {getCategoryIcon(t.category)}
                                                {t.category}
                                            </span>
                                        </td>
                                        {type === 'expense' && (
                                            <td className="py-3 px-4 text-xs text-textMuted">
                                                <div className="flex items-center gap-1.5">
                                                    {t.paymentMethod && t.paymentMethod.toLowerCase().includes('pix')
                                                        ? <Zap size={12} className="text-amber-500" />
                                                        : <CreditCard size={12} className="text-slate-400" />
                                                    }
                                                    {t.paymentMethod || '-'}
                                                </div>
                                            </td>
                                        )}
                                        <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-300 font-medium truncate max-w-[250px]">
                                            {t.description}
                                        </td>
                                        <td className="py-3 px-4 text-center">
                                            <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-600 rounded hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors">
                                                    <Edit2 size={14} />
                                                </button>
                                                <button onClick={() => onDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 dark:hover:bg-rose-900/20 transition-colors">
                                                    <Trash2 size={14} />
                                                </button>
                                            </div>
                                        </td>
                                    </motion.tr>
                                ))}
                            </AnimatePresence>
                        )}
                    </tbody>
                    {sheetData.length > 0 && (
                        <tfoot className="bg-slate-50 dark:bg-slate-900 sticky bottom-0 z-10 border-t border-slate-200 dark:border-slate-700">
                            <tr>
                                <td className="py-3 px-4 text-xs font-bold text-slate-500 uppercase tracking-widest text-right">Total</td>
                                <td className={`py-3 px-4 text-sm font-black font-mono text-right tabular-nums pr-6 ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                                    }`}>
                                    {formatCurrency(totalValue, currency)}
                                </td>
                                <td colSpan={10}></td>
                            </tr>
                        </tfoot>
                    )}
                </table>

                {/* Mobile List View (Cards) */}
                <div className="md:hidden p-4 space-y-3 pb-24">
                    {sheetData.length === 0 ? (
                        <div className="text-center py-10 text-slate-400 dark:text-slate-500 italic">
                            <p>Nenhuma transação encontrada.</p>
                            <p className="text-xs mt-1">Toque em + para adicionar.</p>
                        </div>
                    ) : (
                        <AnimatePresence>
                            {sheetData.map((t) => (
                                <motion.div
                                    key={t.id}
                                    layout
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-surface p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-start"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className={`p-1.5 rounded-full ${type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} dark:bg-opacity-20`}>
                                                {getCategoryIcon(t.category)}
                                            </span>
                                            <span className="text-xs font-bold text-textMuted uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">
                                                {t.category}
                                            </span>
                                        </div>
                                        <h4 className="font-bold text-slate-800 dark:text-white text-sm mb-1">{t.description || 'Sem descrição'}</h4>
                                        <div className="flex items-center gap-3 text-xs text-slate-400">
                                            <span className="flex items-center gap-1"><Calendar size={10} /> {formatDateRaw(t.date)}</span>
                                            {t.paymentMethod && <span>• {t.paymentMethod}</span>}
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`text-sm font-black font-mono ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                            {formatCurrency(t.amount, currency)}
                                        </span>
                                        <div className="flex gap-2">
                                            <button onClick={() => handleEdit(t)} className="p-1.5 text-slate-400 hover:text-blue-500 bg-slate-50 dark:bg-slate-700 rounded-lg transition-colors">
                                                <Edit2 size={14} />
                                            </button>
                                            <button onClick={() => onDelete(t.id)} className="p-1.5 text-slate-400 hover:text-rose-500 bg-slate-50 dark:bg-slate-700 rounded-lg transition-colors">
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                    )}

                    {/* Mobile Footer Summary */}
                    {sheetData.length > 0 && (
                        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-lg z-10 flex justify-between items-center mb-[56px] md:mb-0">
                            <span className="text-xs font-bold text-textMuted uppercase">Total ({sheetData.length})</span>
                            <span className={`text-lg font-black font-mono ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatCurrency(totalValue, currency)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Summary Footer - Modern Glassmorphism */}
            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 bg-slate-900/90 dark:bg-white/90 backdrop-blur-md text-white dark:text-slate-900 px-6 py-3 rounded-full shadow-2xl flex items-center gap-6 border border-white/10 dark:border-slate-200">
                <div className="flex flex-col">
                    <span className="text-[10px] opacity-60 uppercase font-bold tracking-widest">Total {type === 'income' ? 'Receitas' : 'Despesas'}</span>
                    <span className="text-xl font-black font-mono tracking-tighter leading-none">
                        {formatCurrency(totalValue, currency)}
                    </span>
                </div>
                <div className="h-8 w-px bg-white/20 dark:bg-slate-900/20"></div>
                <div className="text-right">
                    <span className="text-[10px] opacity-60 uppercase font-bold tracking-widest block">{sheetData.length} registros</span>
                    <span className="text-xs font-medium opacity-80">Exibindo período filtrado</span>
                </div>
            </div>

            {/* Mobile Floating Action Button (FAB) - Keep existing style */}
            {!isAdding && (
                <button
                    onClick={() => {
                        // Reset everything first
                        setIsAdding(true);
                        setEditingId(null);
                        setInstallments(1);
                        setIsRecurring(false);
                        setNewDesc('');
                        setNewAmount('');
                        setSearchTerm('');
                        setFilterCategory('');
                        setFilterPaymentMethod('');

                        // FORCE CURRENT MONTH VIEW
                        setStartDate(firstDayOfMonth);
                        setEndDate(lastDayOfMonth); // Explicitly limit to end of month

                        setNewDate(todayStr);
                    }}
                    className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-indigo-600 text-white rounded-full shadow-xl shadow-indigo-900/40 flex items-center justify-center hover:scale-105 transition-transform z-50 border-2 border-white dark:border-slate-800"
                    title="Adicionar Linha"
                >
                    <Plus size={28} />
                </button>
            )}

            <SmartInputModal
                isOpen={isSmartInputOpen}
                onClose={() => setIsSmartInputOpen(false)}
                onSave={handleSmartSave}
                categories={categories}
            />
        </div>
    );
};
