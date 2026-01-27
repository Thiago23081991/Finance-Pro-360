
import React, { useState, useMemo, useEffect } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, generateId, formatDateRaw } from '../utils';
import { Plus, Trash2, Save, X, CalendarClock, AlertCircle, Search, Filter, XCircle, Utensils, Car, Home, HeartPulse, PartyPopper, GraduationCap, Banknote, ShoppingBag, Zap, CircleDollarSign, Edit2, ArrowUp, ArrowDown, Calendar, CreditCard, RefreshCw } from 'lucide-react';

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
    const [isAdding, setIsAdding] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    // --- Search & Filter State ---
    const [showFilters, setShowFilters] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPaymentMethod, setFilterPaymentMethod] = useState(''); // New Payment Filter
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [minValue, setMinValue] = useState('');
    const [maxValue, setMaxValue] = useState('');

    // --- Sorting State ---
    const [sortConfig, setSortConfig] = useState<{ key: 'date' | 'amount'; direction: 'asc' | 'desc' }>({ key: 'date', direction: 'asc' });

    // --- New Transaction State ---
    const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
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

    // Reset states when type changes (e.g. switching between Income/Expense tabs)
    useEffect(() => {
        setIsAdding(false);
        setEditingId(null);
        setShowFilters(false);
        setSearchTerm('');
        setFilterCategory('');
        setFilterPaymentMethod('');
        setStartDate('');
        setEndDate('');
        setMinValue('');
        setMaxValue('');
        setNewDate(new Date().toISOString().split('T')[0]);
        setNewAmount('');
        setNewDesc('');
        setInstallments(1);
        setIsRecurring(false);
        setDateError('');
        // Ensure default category is valid if list changes (optional, but good practice)
        if (categories.length > 0) setNewCategory(categories[0]);
        if (paymentMethods.length > 0) setNewPayment(paymentMethods[0]);
    }, [type, categories, paymentMethods]);

    // Get today's date in 'YYYY-MM-DD' format based on local timezone to ensure accurate comparison
    const todayStr = useMemo(() => {
        const now = new Date();
        return new Date(now.getTime() - (now.getTimezoneOffset() * 60000))
            .toISOString()
            .split('T')[0];
    }, []);

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

        // Future Date Validation
        const [y, m, d] = newDate.split('-').map(Number);
        // Create date object treating input as local time (00:00:00)
        const inputDate = new Date(y, m - 1, d);

        // Get today's date normalized to 00:00:00 for comparison
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Logic: If date is in the future AND it is NOT an installment (installments <= 1) AND NOT RECURRING
        if (inputDate > today && installments <= 1 && !isRecurring) {
            setDateError('Data futura não permitida para lançamentos únicos.');
            return;
        }

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
        <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] transition-colors relative">
            {/* Toolbar */}
            <div className="p-3 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-3 bg-slate-50 dark:bg-slate-800/50">
                <div className="flex items-center gap-4 w-full sm:w-auto">
                    <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 whitespace-nowrap text-sm uppercase tracking-wide">
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
                            : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700'
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
                        onClick={() => { setIsAdding(true); setEditingId(null); setInstallments(1); setIsRecurring(false); setNewDesc(''); setNewAmount(''); }}
                        className="hidden md:flex items-center gap-2 bg-emerald-600 text-white px-4 py-1.5 rounded-sm text-xs font-medium hover:bg-emerald-700 transition-colors shadow-sm whitespace-nowrap"
                    >
                        <Plus size={14} />
                        Adicionar Linha
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 animate-fade-in">
                    <div className={`grid grid-cols-1 gap-4 ${type === 'expense' ? 'md:grid-cols-5' : 'md:grid-cols-4'}`}>
                        {/* Mobile Search - Only visible on small screens */}
                        <div className="md:hidden col-span-1">
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Buscar</label>
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
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Período</label>
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
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Categoria</label>
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
                                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Método Pagto</label>
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
                            <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Valor ({currency})</label>
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
                                    : 'text-slate-400 border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 cursor-not-allowed'
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
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Data</label>
                        <input
                            type="date"
                            value={newDate}
                            onChange={(e) => { setNewDate(e.target.value); setDateError(''); }}
                            className={`w-full border ${dateError ? 'border-rose-500' : 'border-slate-300 dark:border-slate-600'} dark:bg-slate-800 dark:text-white rounded-sm px-2 py-1.5 text-xs focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none`}
                        />
                        {dateError && (
                            <div className="absolute top-full mt-1 left-4 z-10 bg-rose-100 text-rose-700 text-[10px] px-2 py-1 rounded shadow-md border border-rose-200 flex items-center gap-1">
                                <AlertCircle size={10} />
                                {dateError}
                            </div>
                        )}
                    </div>
                    <div className="col-span-6 md:col-span-2">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Valor {installments > 1 ? '(Mensal)' : ''}</label>
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
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Categoria</label>
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
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Pagamento</label>
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
                            <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase" title="Número de meses/parcelas">
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
                                <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase">Recorrente?</span>
                            </label>
                        </div>
                    </div>

                    <div className="col-span-12 md:col-span-3">
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 mb-1 uppercase">Descrição</label>
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

            {/* Spreadsheet Table Area */}
            <div className="flex-1 overflow-auto custom-scrollbar relative">
                {/* Desktop Table */}
                <table className="w-full text-left border-collapse hidden md:table">
                    <thead className="bg-slate-100 dark:bg-slate-900 sticky top-0 z-10 shadow-sm">
                        <tr>
                            <th
                                className="py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-r border-slate-300 dark:border-slate-600 w-32 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                                onClick={() => handleSort('date')}
                                title="Clique para ordenar por data"
                            >
                                <div className="flex items-center gap-1 justify-between">
                                    DATA
                                    {sortConfig.key === 'date' && (
                                        sortConfig.direction === 'desc' ? <ArrowDown size={10} className="text-blue-500" /> : <ArrowUp size={10} className="text-blue-500" />
                                    )}
                                </div>
                            </th>
                            <th
                                className="py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-r border-slate-300 dark:border-slate-600 w-32 cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors select-none"
                                onClick={() => handleSort('amount')}
                                title="Clique para ordenar por valor"
                            >
                                <div className="flex items-center gap-1 justify-between">
                                    VALOR
                                    {sortConfig.key === 'amount' && (
                                        sortConfig.direction === 'desc' ? <ArrowDown size={10} className="text-blue-500" /> : <ArrowUp size={10} className="text-blue-500" />
                                    )}
                                </div>
                            </th>
                            <th className="py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-r border-slate-300 dark:border-slate-600 w-48">CATEGORIA</th>
                            {type === 'expense' && <th className="py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-r border-slate-300 dark:border-slate-600 w-40">PAGAMENTO</th>}
                            <th className="py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-r border-slate-300 dark:border-slate-600">DESCRIÇÃO</th>
                            <th className="py-2 px-3 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-300 dark:border-slate-600 w-24 text-center">AÇÕES</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
                        {sheetData.length === 0 ? (
                            <tr>
                                <td colSpan={type === 'expense' ? 6 : 5} className="py-12 text-center text-slate-400 dark:text-slate-500 italic bg-white dark:bg-slate-800">
                                    {transactions.length > 0
                                        ? "Nenhuma transação encontrada com os filtros atuais."
                                        : "Planilha vazia. Adicione uma nova linha acima."}
                                </td>
                            </tr>
                        ) : (
                            sheetData.map((t, idx) => (
                                <tr key={t.id} className={`hover:bg-blue-50 dark:hover:bg-blue-900/10 transition-colors group ${idx % 2 === 0 ? 'bg-white dark:bg-slate-800' : 'bg-slate-50 dark:bg-slate-800/50'}`}>
                                    <td className="py-1.5 px-3 border-r border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-300 font-mono flex items-center gap-2">
                                        {formatDateRaw(t.date)}
                                        {/* Indicate if it's a future transaction - Robust comparison using string format */}
                                        {t.date > todayStr && (
                                            <span title="Transação Futura">
                                                <CalendarClock size={10} className="text-blue-400" />
                                            </span>
                                        )}
                                        {t.isRecurring && (
                                            <span title="Recorrente (Projeção Automática)">
                                                <RefreshCw size={10} className="text-purple-500 ml-1" />
                                            </span>
                                        )}
                                    </td>
                                    <td className={`py-1.5 px-3 border-r border-slate-200 dark:border-slate-700 text-xs font-medium font-mono ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                        {formatCurrency(t.amount, currency)}
                                    </td>
                                    <td className="py-1.5 px-3 border-r border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300">
                                        <div className="flex items-center gap-1.5">
                                            <span className="opacity-50 text-slate-400">{getCategoryIcon(t.category)}</span>
                                            {t.category}
                                        </div>
                                    </td>
                                    {type === 'expense' && <td className="py-1.5 px-3 border-r border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400">{t.paymentMethod}</td>}
                                    <td className="py-1.5 px-3 border-r border-slate-200 dark:border-slate-700 text-xs text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{t.description}</td>
                                    <td className="py-1.5 px-3 text-center">
                                        <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button
                                                onClick={() => handleEdit(t)}
                                                className="text-slate-300 hover:text-blue-500 transition-colors"
                                                title="Editar Linha"
                                            >
                                                <Edit2 size={14} />
                                            </button>
                                            <button
                                                onClick={() => onDelete(t.id)}
                                                className="text-slate-300 hover:text-rose-500 transition-colors"
                                                title="Excluir Linha"
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>

                    {/* TABLE FOOTER SUMMARY */}
                    {sheetData.length > 0 && (
                        <tfoot className="bg-slate-100 dark:bg-slate-900 sticky bottom-0 z-10 font-bold text-slate-700 dark:text-slate-200 shadow-md border-t-2 border-slate-300 dark:border-slate-600">
                            <tr>
                                <td className="py-2 px-3 text-[10px] uppercase tracking-wider text-right border-r border-slate-300 dark:border-slate-600">Total:</td>
                                <td className={`py-2 px-3 text-xs font-mono border-r border-slate-300 dark:border-slate-600 ${type === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                    {formatCurrency(totalValue, currency)}
                                </td>
                                <td colSpan={type === 'expense' ? 4 : 3} className="py-2 px-3 text-[10px] text-slate-500 dark:text-slate-400 text-right italic font-normal">
                                    {sheetData.length} registros
                                </td>
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
                        sheetData.map((t) => (
                            <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-slate-100 dark:border-slate-700 flex justify-between items-start animate-fade-in">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`p-1.5 rounded-full ${type === 'income' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'} dark:bg-opacity-20`}>
                                            {getCategoryIcon(t.category)}
                                        </span>
                                        <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider px-2 py-0.5 bg-slate-100 dark:bg-slate-700 rounded-full">
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
                            </div>
                        ))
                    )}

                    {/* Mobile Footer Summary */}
                    {sheetData.length > 0 && (
                        <div className="fixed bottom-0 left-0 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-4 shadow-lg z-10 flex justify-between items-center mb-[56px] md:mb-0">
                            <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase">Total ({sheetData.length})</span>
                            <span className={`text-lg font-black font-mono ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                {formatCurrency(totalValue, currency)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Mobile Floating Action Button (FAB) */}
            {!isAdding && (
                <button
                    onClick={() => { setIsAdding(true); setEditingId(null); setInstallments(1); setNewDesc(''); setNewAmount(''); }}
                    className="md:hidden fixed bottom-24 right-6 w-14 h-14 bg-emerald-600 text-white rounded-full shadow-xl shadow-emerald-900/40 flex items-center justify-center hover:scale-105 transition-transform z-50 border-2 border-white dark:border-slate-800"
                    title="Adicionar Linha"
                >
                    <Plus size={28} />
                </button>
            )}
        </div>
    );
};
