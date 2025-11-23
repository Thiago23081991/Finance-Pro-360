
import React, { useState } from 'react';
import { Transaction, TransactionType } from '../types';
import { formatCurrency, generateId } from '../utils';
import { Plus, Trash2, Save, X, CalendarClock } from 'lucide-react';

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
  
  // New Transaction State
  const [newDate, setNewDate] = useState(new Date().toISOString().split('T')[0]);
  const [newAmount, setNewAmount] = useState('');
  const [newCategory, setNewCategory] = useState(categories[0] || '');
  const [newDesc, setNewDesc] = useState('');
  const [newPayment, setNewPayment] = useState(paymentMethods[0] || '');
  // State for installments
  const [installments, setInstallments] = useState(1);

  const handleSave = () => {
    if (!newAmount || !newCategory || !newDate) return;
    
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
    setIsAdding(false);
  };

  // Filter transactions by type for this sheet
  const sheetData = transactions.filter(t => t.type === type).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm overflow-hidden flex flex-col h-[calc(100vh-140px)] transition-colors">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
            <h2 className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${type === 'income' ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                {type === 'income' ? 'Receitas' : 'Despesas'}
            </h2>
            <button 
                onClick={() => setIsAdding(true)}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 transition-colors"
            >
                <Plus size={16} />
                Novo Lançamento
            </button>
        </div>

        {/* Input Row (Sheet Style) - Only visible when adding */}
        {isAdding && (
            <div className="p-4 bg-blue-50 dark:bg-slate-700 border-b border-blue-100 dark:border-slate-600 grid grid-cols-12 gap-3 items-end animate-fade-in">
                <div className="col-span-2">
                    <label className="block text-xs font-medium text-slate-500 dark:text-slate-300 mb-1">Data Início</label>
                    <input 
                        type="date" 
                        value={newDate} 
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full border border-slate-300 dark:border-slate-600 dark:bg-slate-800 dark:text-white rounded px-2 py-1 text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
                    />
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
                                onChange={(e) => setInstallments(parseInt(e.target.value) || 1)}
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
                
                <div className="col-span-1 flex gap-2">
                    <button onClick={handleSave} className="p-2 bg-emerald-500 text-white rounded hover:bg-emerald-600 transition-colors" title="Salvar">
                        <Save size={16} />
                    </button>
                    <button onClick={() => { setIsAdding(false); setInstallments(1); }} className="p-2 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-200 rounded hover:bg-slate-300 dark:hover:bg-slate-500 transition-colors" title="Cancelar">
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
                                Nenhuma transação registrada. Adicione uma nova acima.
                            </td>
                        </tr>
                    ) : (
                        sheetData.map(t => (
                            <tr key={t.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                <td className="py-2 px-4 text-sm text-slate-600 dark:text-slate-300 font-mono flex items-center gap-2">
                                    {new Date(t.date).toLocaleDateString('pt-BR')}
                                    {/* Indicate if it's a future transaction */}
                                    {new Date(t.date) > new Date() && <CalendarClock size={12} className="text-blue-400" title="Transação Futura" />}
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
             </table>
        </div>
    </div>
  );
};