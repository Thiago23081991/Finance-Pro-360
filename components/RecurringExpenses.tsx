import React, { useState, useEffect } from 'react';
import { Calendar, Bot, Wallet, AlertTriangle, ArrowRight, CheckCircle, X, Loader2, Sparkles, Plus, Save, Trash2, TrendingUp } from 'lucide-react';
import { Transaction, AppConfig } from '../types';
import { DBService } from '../db';
import { formatCurrency, generateId } from '../utils';
import { supabase } from '../supabaseClient';
// import { toast } from 'sonner'; // Removed to avoid dependency issue

interface RecurringExpensesProps {
    config: AppConfig;
    onClose: () => void;
}

export const RecurringExpenses: React.FC<RecurringExpensesProps> = ({ config, onClose }) => {
    const [recurringTxs, setRecurringTxs] = useState<Transaction[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);

    // Add State
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newAmount, setNewAmount] = useState('');
    const [newCategory, setNewCategory] = useState(config.expenseCategories?.[0] || 'Assinaturas');

    useEffect(() => {
        loadRecurring();
    }, []);

    const loadRecurring = async () => {
        try {
            const allTxs = await DBService.getTransactions(config.userId!);
            const recurring = allTxs
                .filter(t => t.type === 'expense' && t.isRecurring)
                .sort((a, b) => (a.recurrenceDay || 1) - (b.recurrenceDay || 1));
            setRecurringTxs(recurring);
        } catch (error) {
            console.error("Failed to load recurring expenses", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddSubscription = async () => {
        if (!newName || !newAmount) return;

        try {
            const amountVal = parseFloat(newAmount);
            if (isNaN(amountVal)) {
                alert("Valor inválido");
                return;
            }

            const newTx: Transaction = {
                id: generateId(),
                userId: config.userId || 'temp',
                type: 'expense',
                date: new Date().toISOString().split('T')[0], // Starts today
                amount: amountVal,
                category: newCategory,
                description: newName,
                isRecurring: true,
                recurrenceDay: new Date().getDate(),
                paymentMethod: 'Cartão de Crédito' // Default to credit card for subs
            };

            await DBService.addTransaction(newTx);

            // Refresh list
            loadRecurring();

            // Reset form
            setIsAdding(false);
            setNewName('');
            setNewAmount('');
        } catch (error: any) {
            console.error(error);
            alert("Erro ao adicionar assinatura: " + (error.message || "Erro desconhecido"));
        }
    };

    const handleDelete = async (id: string, name: string) => {
        if (window.confirm(`Tem certeza que deseja remover "${name}" das recorrências?`)) {
            try {
                await DBService.deleteTransaction(id);
                loadRecurring();
            } catch (error: any) {
                console.error(error);
                alert("Erro ao remover despesa: " + (error.message || "Erro desconhecido"));
            }
        }
    };

    const handleAnalyze = async () => {
        if (recurringTxs.length === 0) {
            alert("Adicione despesas recorrentes primeiro para analisar.");
            return;
        }

        setIsAnalyzing(true);
        try {
            const context = await DBService.getFinancialContext(config.userId!);
            const prompt = `
                Analise estas despesas recorrentes/assinaturas do usuário e sugira cortes ou otimizações.
                Seja direto e aponte itens que parecem supérfluos ou que poderiam ser negociados.
                Lista: ${recurringTxs.map(t => `${t.description} (${formatCurrency(t.amount, config.currency || 'BRL')})`).join(', ')}.
            `;

            const { data, error } = await supabase.functions.invoke('financial-advisor', {
                body: { message: prompt, context: context }
            });

            if (error) throw error;
            setAiAnalysis(data.reply);
        } catch (error) {
            console.error(error);
            alert("Falha ao analisar com IA via Edge Function.");
            // Fallback simulado se falhar a função (dev mode)
            setTimeout(() => {
                setAiAnalysis("Com base nos seus gastos recorrentes, sugiro verificar se todos os serviços de streaming são utilizados mensalmente. Considere também negociar o plano de internet se houver concorrentes com preços melhores na sua região. Assinaturas não utilizadas devem ser canceladas imediatamente.");
            }, 1000);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const totalMonthly = recurringTxs.reduce((acc, t) => acc + t.amount, 0);
    const totalYearly = totalMonthly * 12;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-xl shadow-md border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-6 text-white flex justify-between items-center sticky top-0 z-10">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/10 rounded-lg backdrop-blur-md">
                            <Calendar size={24} className="text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold">Organizador de Assinaturas</h2>
                            <p className="text-slate-400 text-xs">Gerencie seus gastos fixos e recorrentes</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={20} />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-8">

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-100 dark:border-blue-800 flex items-center gap-4">
                            <div className="p-3 bg-blue-100 dark:bg-blue-800 rounded-full text-blue-600 dark:text-blue-400">
                                <Wallet size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Mensal</p>
                                <p className="text-xl font-black text-slate-800 dark:text-white">
                                    {formatCurrency(totalMonthly, config.currency || 'BRL')}
                                </p>
                            </div>
                        </div>

                        <div className="bg-emerald-50 dark:bg-emerald-900/10 p-4 rounded-xl border border-emerald-100 dark:border-emerald-800 flex items-center gap-4">
                            <div className="p-3 bg-emerald-100 dark:bg-emerald-800 rounded-full text-emerald-600 dark:text-emerald-400">
                                <TrendingUp size={24} />
                            </div>
                            <div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium uppercase">Custo Anual</p>
                                <p className="text-xl font-black text-emerald-700 dark:text-emerald-400">
                                    {formatCurrency(totalYearly, config.currency || 'BRL')}
                                </p>
                            </div>
                        </div>

                        <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800 flex items-center justify-between cursor-pointer hover:bg-indigo-100 dark:hover:bg-indigo-900/20 transition-colors" onClick={handleAnalyze}>
                            <div className="flex items-center gap-3">
                                <div className="p-3 bg-indigo-100 dark:bg-indigo-800 rounded-full text-indigo-600 dark:text-indigo-400">
                                    {isAnalyzing ? <Loader2 size={24} className="animate-spin" /> : <Sparkles size={24} />}
                                </div>
                                <div className="flex-1">
                                    <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">
                                        {isAnalyzing ? 'Analisando...' : 'Análise IA'}
                                    </p>
                                    <p className="text-[10px] text-slate-500 leading-tight">
                                        Identificar cortes
                                    </p>
                                </div>
                            </div>
                            {!isAnalyzing && <ArrowRight size={16} className="text-indigo-400" />}
                        </div>
                    </div>

                    {/* AI Result Area */}
                    {aiAnalysis && (
                        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 p-6 rounded-xl border border-indigo-100 dark:border-indigo-800 animate-in slide-in-from-top-4">
                            <h3 className="flex items-center gap-2 text-indigo-700 dark:text-indigo-300 font-bold mb-3">
                                <Bot size={20} /> Insight do Consultor IA
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none text-slate-600 dark:text-slate-300">
                                <p className="whitespace-pre-wrap leading-relaxed">{aiAnalysis}</p>
                            </div>
                        </div>
                    )}

                    {/* List Header & Add Button */}
                    <div className="flex justify-between items-center">
                        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                            Sua Lista de Recorrências
                            <span className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 text-xs px-2 py-0.5 rounded-full">{recurringTxs.length}</span>
                        </h3>
                        {!isAdding && (
                            <button onClick={() => setIsAdding(true)} className="flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 font-medium">
                                <Plus size={16} /> Adicionar Assinatura
                            </button>
                        )}
                    </div>

                    {/* Add Form */}
                    {isAdding && (
                        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 animate-fade-in">
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Nome do Serviço</label>
                                    <input
                                        type="text"
                                        placeholder="Ex: Netflix"
                                        value={newName}
                                        onChange={e => setNewName(e.target.value)}
                                        className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Valor Mensal</label>
                                    <input
                                        type="number"
                                        placeholder="0.00"
                                        value={newAmount}
                                        onChange={e => setNewAmount(e.target.value)}
                                        className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] uppercase font-bold text-slate-500 mb-1 block">Categoria</label>
                                    <select
                                        value={newCategory}
                                        onChange={e => setNewCategory(e.target.value)}
                                        className="w-full text-sm p-2 rounded border border-slate-300 dark:border-slate-600 dark:bg-slate-900 outline-none focus:ring-1 focus:ring-blue-500"
                                    >
                                        {(config.expenseCategories || ['Assinaturas']).map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                            </div>
                            <div className="flex justify-end gap-2">
                                <button onClick={() => setIsAdding(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-700 rounded">Cancelar</button>
                                <button onClick={handleAddSubscription} className="px-3 py-1.5 text-xs font-bold bg-blue-600 text-white hover:bg-blue-700 rounded flex items-center gap-1">
                                    <Save size={14} /> Salvar
                                </button>
                            </div>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2, 3].map(i => <div key={i} className="h-16 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse"></div>)}
                        </div>
                    ) : recurringTxs.length > 0 ? (
                        <div className="space-y-3">
                            {recurringTxs.map(t => (
                                <div key={t.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-100 dark:border-slate-700 flex justify-between items-center group hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-slate-100 dark:bg-slate-700 flex flex-col items-center justify-center font-bold text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-600">
                                            <span className="text-[10px] uppercase">DIA</span>
                                            <span className="text-lg leading-none">{t.recurrenceDay || '10'}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-800 dark:text-white text-base">{t.description}</p>
                                            <p className="text-xs text-slate-500">{t.category}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            <p className="font-bold text-slate-800 dark:text-white">{formatCurrency(t.amount, config.currency || 'BRL')}</p>
                                            <p className="text-[10px] text-slate-400 uppercase font-bold">Mensal</p>
                                        </div>
                                        <button
                                            onClick={() => handleDelete(t.id, t.description)}
                                            className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                            title="Remover Assinatura"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-slate-50 dark:bg-slate-800/50 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-400">
                                <CheckCircle size={32} />
                            </div>
                            <h4 className="font-bold text-slate-600 dark:text-slate-300">Nenhuma recorrência encontrada</h4>
                            <p className="text-sm text-slate-400 mt-1 max-w-xs mx-auto">
                                Adicione despesas marcando a opção "Repetir mensalmente" ou use o botão acima.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
