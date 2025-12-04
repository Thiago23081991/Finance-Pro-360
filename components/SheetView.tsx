
import React, { useState, useMemo } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, generateId } from '../utils';
import { Plus, Trash2, Save, X, CalendarClock, AlertCircle, Search, Filter, XCircle, ArrowRight } from 'lucide-react';

interface SheetViewProps {
  type: TransactionType;
  transactions: Transaction[];
  categories: string[];
  paymentMethods: string[];
  onAdd: (t: Transaction) => void;
  onUpdate: (t: Transaction) => void;
  onDelete: (id: string) => void;
}

export const SheetView: React.FC<SheetViewProps> = ({ 
  type, 
  transactions, 
  categories, 
  paymentMethods, 
  onAdd,
  onDelete
}) => {
  const [isAdding, setIsAdding] = useState(false);
  
  // --- Search & Filter State ---
  const [showFilters, setShowFilters] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [minValue, setMinValue] = useState('');
  const [maxValue, setMaxValue] = useState('');

  // --- New Transaction State ---
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0] || '');
  const [newDesc, setNewDesc] = useState('');
  const [newPayment, setNewPayment] = useState(paymentMethods[0] || '');
  // State for installments
  const [installments, setInstallments] = useState(1);
  
  // Error state for validation
  const [dateError, setDateError] = useState('');

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

    // Logic: If date is in the future AND it is NOT an installment (installments <= 1)
    if (inputDate > today && installments <= 1) {
        setDateError('Data futura não permitida para lançamentos à vista.');
        return;
    }

    const amountVal = parseFloat(newAmount);
    const numInstallments = Math.max(1, Math.floor(installments));

    // Parse the initial date components to handle month increment correctly
    const [startYear, startMonth, startDay] = newDate.split('-').map(Number);

    for (let i = 0; i < numInstallments; i++) {
        // Calculate date for this installment
        // Note: Month in Date constructor is 0-indexed (0=Jan, 11=Dec)
        // We subtract 1 from startMonth which comes from YYYY-MM-DD string (1-12)
        const dateObj = new Date(startYear, (startMonth - 1) + i, startDay);
        const dateStr = dateObj.toISOString().split('T')[0];

        const description = numInstallments > 1 
            ? `${newDesc} (${i + 1}/${numInstallments})` 
            : newDesc;

        const transaction: Transaction = {
            id: generateId(),
            userId: 'temp', // Placeholder, handled by App controller
            type,
            date: dateStr,
            amount: amountVal, // Assuming the input amount is per installment. If it was total, we would divide. Usually users enter the monthly value.
            category: newCategory,
            description: description,
            paymentMethod: type === 'expense' ? newPayment : undefined
        };

        onAdd(transaction);
    }
    
    // Reset form
    setNewAmount('');
    setNewDesc('');
    setInstallments(1);
    setDateError('');
    setIsAdding(false);
  };

  const handleCancel = () => {
      setIsAdding(false);
      setInstallments(1);
      setDateError('');
  };

  const clearFilters = () => {
      setSearchTerm('');
      setFilterCategory('');
      setStartDate('');
      setEndDate('');
      setMinValue('');
      setMaxValue('');
  };

  const activeFiltersCount = (searchTerm ? 1 : 0) + 
                             (filterCategory ? 1 : 0) + 
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

            // Date Range
            const matchesStart = startDate ? t.date >= startDate : true;
            const matchesEnd = endDate ? t.date <= endDate : true;

            // Value Range
            const val = t.amount;
            const min = minValue ? parseFloat(minValue) : -Infinity;
            const max = maxValue ? parseFloat(maxValue) : Infinity;
            const matchesValue = val >= min && val <= max;

            return matchesSearch && matchesCategory && matchesStart && matchesEnd && matchesValue;
        })
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, type, searchTerm, filterCategory, startDate, endDate, minValue, maxValue]);

  // Calculate Total Value of filtered items
  const totalValue = useMemo(() => {
      return sheetData.reduce((acc, curr) => acc + curr.amount, 0);
  }, [sheetData]);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] transition-colors">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row justify-between items-center gap-4 bg-slate-50 dark:bg-slate-800/50">
            <div className="flex items-center gap-4 w-full sm:w-auto">
                <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2 whitespace-nowrap">
                    <div className={`w-3 h-3 rounded-full ${type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                    {type === 'income' ? 'Receitas' : 'Despesas'}
                </h2>
                
                {/* Quick Search */}
                <div className="relative hidden md:block">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
                    <input 
                        type="text" 
                        placeholder="Buscar..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-8 pr-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 transition-all"
                    />
                </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors border relative ${
                        showFilters || activeFiltersCount > 0
                        ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800' 
                        : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-600 dark:hover:bg-slate-700'
                    }`}
                >
                    <Filter size={16} />
                    <span className="hidden sm:inline">Filtros</span>
                    {activeFiltersCount > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold shadow-sm">
                            {activeFiltersCount}
                        </span>
                    )}
                </button>
                <button 
                    onClick={() => setIsAdding(true)}
                    className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm whitespace-nowrap"
                >
                    <Plus size={16} />
                    Novo
                </button>
            </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
            <div className="p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 animate-fade-in">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                                className="w-full pl-8 pr-3 py-1.5 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:outline-none focus:border-blue-500"
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
                                className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-slate-400 text-xs">até</span>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full px-2 py-1.5 text-xs border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Categoria</label>
                        <select 
                            value={filterCategory}
                            onChange={(e) => setFilterCategory(e.target.value)}
                            className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:outline-none focus:border-blue-500"
                        >
                            <option value="">Todas</option>
                            {categories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                    </div>

                    <div>
                        <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 mb-1">Valor (R$)</label>
                        <div className="flex items-center gap-2">
                            <input 
                                type="number" 
                                placeholder="Mín 0.00"
                                value={minValue}
                                onChange={(e) => setMinValue(e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:outline-none focus:border-blue-500"
                            />
                            <span className="text-slate-400">-</span>
                            <input 
                                type="number" 
                                placeholder="Máx..."
                                value={maxValue}
                                onChange={(e) => setMaxValue(e.target.value)}
                                className="w-full px-2 py-1.5 text-sm border border-slate-300 dark:border-slate-600 dark:bg-slate-900 dark:text-white rounded focus:outline-none focus:border-blue-500"
                            />
                        </div>
                    </div>

                    <div className="flex items-end">
                        <button 
                            onClick={clearFilters}
                            disabled={activeFiltersCount === 0}
                            className={`w-full px-3 py-1.5 text-xs font-medium border rounded transition-colors flex items-center justify-center gap-1 ${
                                activeFiltersCount > 0 
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
            <div className="p-4 bg-blue-50 dark:bg-slate-700 border-b border-blue-100 dark:border-slate-600 grid grid-cols-12 gap-3 items-start animate-fade-in relative">
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Data Início</label>
                    <input 
                        type="date" 
                        value={newDate} 
                        onChange={(e) => { setNewDate(e.target.value); setDateError(''); }}
                        className={`w-full border ${dateError ? 'border-rose-500' : 'border-slate-300 dark:border-slate-600'} dark:bg-slate-800 dark:text-white rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none`}
                    />
                    {dateError && (
                        <div className="absolute top-full mt-1 left-4 z-10 bg-rose-100 text-rose-700 text-[10px] px-2 py-1 rounded shadow-md border border-rose-200 flex items-center gap-1">
                            <AlertCircle size={10} />
                            {dateError}
                        </div>
                    )}
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Valor {installments > 1 ? '(Parcela)' : ''}</label>
                    <input 
                        type="number" 
                        step="0.01"
                        placeholder="0.00"
                        value={newAmount} 
                        onChange={(e) => setNewAmount(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Categoria</label>
                    <select 
                        value={newCategory} 
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    >
                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                
                {/* Conditional rendering for Expense fields (Payment Method & Installments) */}
                {type === 'expense' ? (
                    <>
                        <div className="col-span-2">
                             <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Pagamento</label>
                             <select 
                                value={newPayment} 
                                onChange={(e) => setNewPayment(e.target.value)}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                            >
                                {paymentMethods.map(p => <option key={p} value={p}>{p}</option>)}
                            </select>
                        </div>
                        <div className="col-span-1">
                            <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1" title="Número de Parcelas">Parc.</label>
                            <input 
                                type="number"
                                min="1"
                                max="60"
                                value={installments}
                                onChange={(e) => { 
                                    setInstallments(parseInt(e.target.value) || 1); 
                                    setDateError(''); // Clear error if user switches to installments
                                }}
                                className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-center"
                            />
                        </div>
                    </>
                ) : null}

                {/* Adjust description width based on type */}
                <div className={`${type === 'expense' ? 'col-span-2' : 'col-span-5'}`}>
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Descrição</label>
                    <input 
                        type="text" 
                        placeholder="Descrição opcional"
                        value={newDesc} 
                        onChange={(e) => setNewDesc(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
                </div>
                
                <div className="col-span-1 flex gap-2 mt-6">
                    <button onClick={handleSave} className="p-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors" title="Salvar">
                        <Save size={16} />
                    </button>
                    <button onClick={handleCancel} className="p-2 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors" title="Cancelar">
                        <X size={16} />
                    </button>
                </div>
            </div>
        )}

        {/* Table Area */}
        <div className="flex-1 overflow-auto custom-scrollbar relative">
             <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 dark:bg-slate-800 sticky top-0 z-10 shadow-sm">
                    <tr>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 w-32">Data</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 w-32">Valor</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 w-48">Categoria</th>
                        {type === 'expense' && <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 w-40">Forma Pag.</th>}
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">Descrição</th>
                        <th className="py-3 px-4 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700 w-16 text-center">Ações</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {sheetData.length === 0 ? (
                        <tr>
                            <td colSpan={type === 'expense' ? 6 : 5} className="py-12 text-center text-slate-400 dark:text-slate-500 italic">
                                {transactions.length > 0 
                                    ? "Nenhuma transação encontrada com os filtros atuais." 
                                    : "Nenhuma transação registrada. Adicione uma nova acima."}
                            </td>
                        </tr>
                    ) : (
                        sheetData.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                <td className="py-2 px-4 text-sm text-slate-600 dark:text-slate-300 font-mono flex items-center gap-2">
                                    {new Date(t.date).toLocaleDateString('pt-BR')}
                                    {/* Indicate if it's a future transaction */}
                                    {new Date(t.date) > new Date() && (
                                        <span title="Transação Futura">
                                            <CalendarClock size={12} className="text-blue-400" />
                                        </span>
                                    )}
                                </td>
                                <td className={`py-2 px-4 text-sm font-medium font-mono ${type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
                                    {formatCurrency(t.amount)}
                                </td>
                                <td className="py-2 px-4 text-sm text-slate-700 dark:text-slate-300">
                                    <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 rounded-full text-xs">{t.category}</span>
                                </td>
                                {type === 'expense' && <td className="py-2 px-4 text-sm text-slate-600 dark:text-slate-400">{t.paymentMethod}</td>}
                                <td className="py-2 px-4 text-sm text-slate-600 dark:text-slate-400 truncate max-w-[200px]">{t.description}</td>
                                <td className="py-2 px-4 text-center">
                                    <button 
                                        onClick={() => onDelete(t.id)}
                                        className="text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
                                        title="Excluir"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
                
                {/* TABLE FOOTER SUMMARY */}
                {sheetData.length > 0 && (
                    <tfoot className="bg-slate-100 dark:bg-slate-900 sticky bottom-0 z-10 font-semibold text-slate-700 dark:text-slate-200 shadow-md border-t border-slate-300 dark:border-slate-600">
                        <tr>
                            <td className="py-3 px-4 text-xs uppercase tracking-wider text-right">Total:</td>
                            <td className={`py-3 px-4 text-sm font-mono ${type === 'income' ? 'text-emerald-700 dark:text-emerald-400' : 'text-rose-700 dark:text-rose-400'}`}>
                                {formatCurrency(totalValue)}
                            </td>
                            <td colSpan={type === 'expense' ? 4 : 3} className="py-3 px-4 text-xs text-slate-500 dark:text-slate-400 text-right italic font-normal">
                                {sheetData.length} registros exibidos
                            </td>
                        </tr>
                    </tfoot>
                )}
             </table>
        </div>
    </div>
  );
};
